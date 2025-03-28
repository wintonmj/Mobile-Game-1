import { IAssetService, AssetEventMap, AssetEvents } from './interfaces/IAssetService';
import { AssetDefinition, AssetInfo, AssetOptions, AssetType, CachePolicy, CachePrunedData, MemoryUsageData } from '../types/assets';
import { IEventBusService, Subscription, EventCallback } from './interfaces/IEventBusService';
import { IRegistry } from './interfaces/IRegistry';

/**
 * Configuration options for the AssetService
 */
export interface AssetServiceConfig {
  /**
   * Maximum assets to keep in memory at once
   */
  maxCachedAssets: number;
  
  /**
   * Memory threshold (MB) to trigger warning events
   */
  memoryWarningThreshold: number;
  
  /**
   * Memory threshold (MB) to trigger critical events
   */
  memoryCriticalThreshold: number;
  
  /**
   * Whether to automatically enable memory monitoring
   */
  enableMemoryMonitoring: boolean;
  
  /**
   * Interval (ms) for memory monitoring checks
   */
  memoryMonitoringInterval: number;
  
  /**
   * Whether to automatically prune assets when cache is full
   */
  autoPruneCache: boolean;
  
  /**
   * Whether to log asset operations to console
   */
  enableLogging: boolean;
  
  /**
   * Size of event history log
   */
  eventHistorySize: number;
  
  /**
   * Strategy to use when pruning cache
   */
  cachePruneStrategy: 'LRU' | 'SIZE' | 'HYBRID';
  
  /**
   * Asset types to prioritize keeping in cache
   */
  priorityAssetTypes: AssetType[];
}

/**
 * Default configuration for the AssetService
 */
const defaultConfig: AssetServiceConfig = {
  maxCachedAssets: 1000,
  memoryWarningThreshold: 150,
  memoryCriticalThreshold: 250,
  enableMemoryMonitoring: true,
  memoryMonitoringInterval: 10000,
  autoPruneCache: true,
  enableLogging: false,
  eventHistorySize: 100,
  cachePruneStrategy: 'LRU',
  priorityAssetTypes: [AssetType.JSON, AssetType.BITMAP_FONT]
};

/**
 * Implementation of the AssetService interface.
 * Provides a centralized system for managing game assets.
 */
export class AssetService implements IAssetService {
  // Asset registry and metadata storage
  private assets: Map<string, AssetInfo> = new Map();
  private groups: Map<string, string[]> = new Map();
  private scene: Phaser.Scene;
  
  // Loading state tracking
  private loadingPromises: Map<string, Promise<any>> = new Map();
  
  // Event handling
  private eventBus: IEventBusService | null = null;
  private subscriptions: Subscription[] = [];
  private eventLog: Array<{event: string, data: any, timestamp: number}> = [];
  
  // Memory management
  private config: AssetServiceConfig;
  private memoryUsage: Record<AssetType, number> = Object.values(AssetType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<AssetType, number>);
  private memoryMonitorInterval: number | null = null;
  
  /**
   * Creates a new instance of the AssetService
   * @param scene The Phaser scene to use for loading assets
   * @param registry The service registry for accessing other services
   * @param config Optional configuration options
   */
  constructor(scene: Phaser.Scene, registry: IRegistry, config?: Partial<AssetServiceConfig>) {
    this.scene = scene;
    this.config = {...defaultConfig, ...config};
    
    // Try to get EventBusService reference, but don't throw if unavailable
    try {
      this.eventBus = registry.getService<IEventBusService>('eventBus');
      this.setupEventListeners();
    } catch (error) {
      console.warn('[AssetService] EventBusService not available, continuing with limited functionality');
    }
    
    // Enable memory monitoring if configured
    if (this.config.enableMemoryMonitoring) {
      this.enableMemoryMonitoring(this.config.memoryMonitoringInterval);
    }
  }
  
  /**
   * Sets up event listeners for the AssetService
   */
  private setupEventListeners(): void {
    if (!this.eventBus) return;
    
    // Subscribe to relevant events
    this.subscriptions.push(
      this.eventBus.on('game.shutdown', () => this.clearAssets())
    );
  }
  
  /**
   * Registers a single asset with the AssetService
   * @param key Unique identifier for the asset
   * @param path Path to the asset file
   * @param type Type of the asset
   * @param options Optional loading configuration
   */
  registerAsset(key: string, path: string, type: AssetType, options?: AssetOptions): void {
    // Validate parameters
    if (!key || typeof key !== 'string') {
      throw new Error('Asset key must be a non-empty string');
    }
    
    if (!path || typeof path !== 'string') {
      throw new Error('Asset path must be a non-empty string');
    }
    
    if (!Object.values(AssetType).includes(type)) {
      throw new Error(`Invalid asset type: ${type}`);
    }
    
    // Check for duplicate key
    if (this.assets.has(key)) {
      console.warn(`[AssetService] Asset with key "${key}" is already registered. Skipping registration.`);
      return;
    }
    
    // Create asset info object
    const assetInfo: AssetInfo = {
      key,
      path,
      type,
      loaded: false,
      cachePolicy: CachePolicy.PERSISTENT, // Default policy
    };
    
    // Store in registry
    this.assets.set(key, assetInfo);
    
    // Emit registration event
    this.emitEvent('asset.state.changed', {
      key,
      previousState: 'unregistered',
      newState: 'registered'
    });
    
    if (this.config.enableLogging) {
      console.log(`[AssetService] Registered asset: ${key} (${type})`);
    }
  }
  
  /**
   * Registers multiple assets at once
   * @param assets Array of asset definitions
   */
  registerMultiple(assets: AssetDefinition[]): void {
    if (!Array.isArray(assets)) {
      throw new Error('Assets must be an array');
    }
    
    assets.forEach(asset => {
      try {
        this.registerAsset(
          asset.key,
          asset.path,
          asset.type,
          asset.options
        );
        
        // Update cache policy if provided
        if (asset.cachePolicy) {
          const assetInfo = this.assets.get(asset.key);
          if (assetInfo) {
            assetInfo.cachePolicy = asset.cachePolicy;
          }
        }
      } catch (error) {
        console.error(`[AssetService] Failed to register asset: ${asset.key}`, error);
      }
    });
  }
  
  /**
   * Gets information about a registered asset
   * @param key Asset key
   * @returns Asset information or null if not found
   */
  getAssetInfo(key: string): AssetInfo | null {
    return this.assets.get(key) || null;
  }
  
  /**
   * Gets the total number of registered assets
   * @returns Total number of assets
   */
  getTotalAssetCount(): number {
    return this.assets.size;
  }
  
  /**
   * Gets the number of loaded assets
   * @returns Number of loaded assets
   */
  getLoadedAssetCount(): number {
    let count = 0;
    this.assets.forEach(asset => {
      if (asset.loaded) count++;
    });
    return count;
  }
  
  /**
   * Checks if an asset is loaded
   * @param key Asset key
   * @returns True if the asset is loaded
   */
  isLoaded(key: string): boolean {
    const asset = this.assets.get(key);
    return !!asset && asset.loaded;
  }
  
  /**
   * Gets the current loading status
   * @returns Object with loaded count, total count, and in-progress keys
   */
  getLoadingStatus(): { loaded: number, total: number, inProgress: string[] } {
    return {
      loaded: this.getLoadedAssetCount(),
      total: this.getTotalAssetCount(),
      inProgress: Array.from(this.loadingPromises.keys())
    };
  }
  
  /**
   * Emits an event through the EventBus service
   * @param event Event name
   * @param data Event data
   */
  private emitEvent<K extends keyof AssetEventMap>(event: K, data: AssetEventMap[K]): void {
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    }
    
    // Also log to internal event history
    this.logEvent(event, data);
  }
  
  /**
   * Logs an event to the internal event history
   * @param event Event name
   * @param data Event data
   */
  private logEvent<K extends keyof AssetEventMap>(event: K, data: AssetEventMap[K]): void {
    // Add to event log
    this.eventLog.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // Trim event log if it exceeds the configured size
    if (this.eventLog.length > this.config.eventHistorySize) {
      this.eventLog = this.eventLog.slice(-this.config.eventHistorySize);
    }
  }
  
  /**
   * Gets the event history
   * @returns Array of event history entries
   */
  getEventHistory(): Array<{event: string, data: any, timestamp: number}> {
    return [...this.eventLog];
  }
  
  /**
   * Checks if the EventBus service is available
   * @returns True if the EventBus service is available
   */
  isEventBusAvailable(): boolean {
    return this.eventBus !== null;
  }
  
  /**
   * Reconnects to the EventBus service
   * @param registry Service registry
   * @returns True if reconnection was successful
   */
  reconnectEventBus(registry: IRegistry): boolean {
    try {
      this.eventBus = registry.getService<IEventBusService>('eventBus');
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.warn('[AssetService] Failed to reconnect to EventBusService', error);
      return false;
    }
  }
  
  /**
   * Subscribes to an asset event
   * @param eventName Event name
   * @param callback Callback function
   * @returns Subscription object or null if EventBus is unavailable
   */
  subscribe<K extends keyof AssetEventMap>(
    eventName: K, 
    callback: (data: AssetEventMap[K]) => void
  ): Subscription | null {
    if (!this.eventBus) return null;
    
    const wrappedCallback: EventCallback<AssetEventMap[K]> = (data?: AssetEventMap[K]) => {
      if (data) {
        callback(data);
      }
    };
    
    return this.eventBus.on(eventName, wrappedCallback);
  }
  
  /**
   * Subscribes to an asset event once
   * @param eventName Event name
   * @param callback Callback function
   * @returns Subscription object or null if EventBus is unavailable
   */
  subscribeOnce<K extends keyof AssetEventMap>(
    eventName: K, 
    callback: (data: AssetEventMap[K]) => void
  ): Subscription | null {
    if (!this.eventBus) return null;
    
    const wrappedCallback: EventCallback<AssetEventMap[K]> = (data?: AssetEventMap[K]) => {
      if (data) {
        callback(data);
      }
    };
    
    return this.eventBus.once(eventName, wrappedCallback);
  }
  
  /**
   * Preload multiple assets
   * @param keys Array of asset keys to preload
   * @param onProgress Progress callback
   * @returns Promise that resolves when all assets are loaded
   */
  preload(keys: string[], onProgress?: (progress: number) => void): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Load a single asset
   * @param key Asset key
   * @returns Promise that resolves with the loaded asset
   */
  loadAsset(key: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets a texture asset
   * @param key Asset key
   * @returns Phaser texture
   */
  getTexture(key: string): Phaser.Textures.Texture {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets an audio asset
   * @param key Asset key
   * @returns Phaser sound
   */
  getAudio(key: string): Phaser.Sound.BaseSound {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets a JSON asset
   * @param key Asset key
   * @returns JSON data
   */
  getJSON(key: string): any {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets a texture atlas asset
   * @param key Asset key
   * @returns Phaser texture
   */
  getAtlas(key: string): Phaser.Textures.Texture {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets a bitmap font asset
   * @param key Asset key
   * @returns Phaser bitmap text
   */
  getBitmapFont(key: string): Phaser.GameObjects.BitmapText {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Releases an asset from memory
   * @param key Asset key
   * @returns True if the asset was released
   */
  releaseAsset(key: string): boolean {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Clears assets from memory
   * @param keys Optional array of asset keys to clear
   */
  clearAssets(keys?: string[]): void {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets memory usage data
   * @returns Memory usage data
   */
  getMemoryUsage(): MemoryUsageData {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Sets memory thresholds for warning and critical events
   * @param warning Warning threshold in MB
   * @param critical Critical threshold in MB
   */
  setMemoryThresholds(warning: number, critical: number): void {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Enables memory monitoring
   * @param interval Monitoring interval in ms
   */
  enableMemoryMonitoring(interval?: number): void {
    if (this.memoryMonitorInterval !== null) {
      this.disableMemoryMonitoring();
    }
    
    const monitoringInterval = interval || this.config.memoryMonitoringInterval;
    // For now, just set the interval variable without actual monitoring
    // This will be implemented in a later phase
    this.memoryMonitorInterval = 1; // Placeholder value
  }
  
  /**
   * Disables memory monitoring
   */
  disableMemoryMonitoring(): void {
    if (this.memoryMonitorInterval !== null) {
      this.memoryMonitorInterval = null;
    }
  }
  
  /**
   * Gets the total memory used by assets
   * @returns Total memory in MB
   */
  getTotalMemoryUsed(): number {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Gets memory usage by asset type
   * @returns Record of memory usage by type
   */
  getMemoryUsageByType(): Record<AssetType, number> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Prunes the asset cache
   * @param targetSize Target cache size in MB
   * @returns Cache pruning result data
   */
  pruneCache(targetSize?: number): CachePrunedData {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Creates an asset group
   * @param groupId Group ID
   * @param assetKeys Array of asset keys
   */
  createGroup(groupId: string, assetKeys: string[]): void {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Loads an asset group
   * @param groupId Group ID
   * @param onProgress Progress callback
   * @returns Promise that resolves when all assets in the group are loaded
   */
  loadGroup(groupId: string, onProgress?: (progress: number) => void): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Releases an asset group
   * @param groupId Group ID
   */
  releaseGroup(groupId: string): void {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Watches loading of multiple assets
   * @param keys Array of asset keys to watch
   * @param onProgress Progress callback
   * @param onComplete Completion callback
   * @returns Object with stopWatching method
   */
  watchLoading(keys: string[], onProgress: (progress: number) => void, onComplete: () => void): { stopWatching: () => void } {
    throw new Error('Method not implemented.');
  }
} 