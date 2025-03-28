import { IAssetService, AssetEventMap, ILoadCompleted } from './interfaces/IAssetService';
import { IService } from './interfaces/IService';
import { ILifecycleAssetService } from './interfaces/ILifecycleAssetService';
import { ServiceStatus } from './interfaces/ServiceStatus';
import {
  AssetDefinition,
  AssetInfo,
  AssetOptions,
  AssetType,
  CachePolicy,
  CachePrunedData,
  MemoryUsageData,
} from '../types/assets';
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
  priorityAssetTypes: [AssetType.JSON, AssetType.BITMAP_FONT],
};

/**
 * Implementation of the AssetService interface.
 * Provides a centralized system for managing game assets.
 */
export class AssetService implements IAssetService, IService, ILifecycleAssetService {
  // Asset registry and metadata storage
  private assets: Map<string, AssetInfo> = new Map();
  private groups: Map<string, string[]> = new Map();
  private sceneAssets: Map<Phaser.Scene, Set<string>> = new Map();
  private currentScene: Phaser.Scene | null = null;
  private status: ServiceStatus = ServiceStatus.CREATED;
  private scene: Phaser.Scene | null = null;

  // Loading state tracking
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private loadingMetrics: Map<string, { startTime: number; endTime?: number }> = new Map();
  private sceneLoadingStatus: Map<Phaser.Scene, { loaded: number; total: number; inProgress: string[] }> = new Map();

  // Event handling
  private eventBus: IEventBusService | null = null;
  private subscriptions: Subscription[] = [];
  private eventLog: Array<{ event: string; data: any; timestamp: number }> = [];

  // Memory management
  private config: AssetServiceConfig;
  private memoryUsage: Record<AssetType, number> = Object.values(AssetType).reduce(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    {} as Record<AssetType, number>
  );
  private sceneMemoryUsage: Map<Phaser.Scene, number> = new Map();
  private memoryMonitorInterval: number | null = null;

  /**
   * Creates a new instance of the AssetService
   * @param scene The Phaser scene
   * @param registry The service registry for accessing other services
   * @param config Optional configuration options
   */
  constructor(scene: Phaser.Scene, registry: IRegistry, config?: Partial<AssetServiceConfig>) {
    this.scene = scene;
    this.currentScene = scene;
    this.config = { ...defaultConfig, ...config };

    // Try to get EventBusService reference, but don't throw if unavailable
    try {
      this.eventBus = registry.getService<IEventBusService>('eventBus');
      this.setupEventListeners();
    } catch (error) {
      console.warn(
        '[AssetService] EventBusService not available, continuing with limited functionality'
      );
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
    this.subscriptions.push(this.eventBus.on('game.shutdown', () => this.clearAssets()));
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
      console.warn(
        `[AssetService] Asset with key "${key}" is already registered. Skipping registration.`
      );
      return;
    }

    // Create asset info object
    const assetInfo: AssetInfo = {
      key,
      path,
      type,
      loaded: false,
      cachePolicy: options?.cachePolicy ?? CachePolicy.PERSISTENT,
      scene: this.currentScene,
    };

    // Store in registry
    this.assets.set(key, assetInfo);

    // Track scene-specific assets
    if (this.currentScene) {
      if (!this.sceneAssets.has(this.currentScene)) {
        this.sceneAssets.set(this.currentScene, new Set());
      }
      this.sceneAssets.get(this.currentScene)?.add(key);
    }

    this.emitEvent('asset.state.changed', {
      key,
      previousState: 'unregistered',
      newState: 'registered',
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

    assets.forEach((asset) => {
      try {
        this.registerAsset(asset.key, asset.path, asset.type, asset.options);

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
    this.assets.forEach((asset) => {
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
  getLoadingStatus(): { loaded: number; total: number; inProgress: string[] } {
    return {
      loaded: this.getLoadedAssetCount(),
      total: this.getTotalAssetCount(),
      inProgress: Array.from(this.loadingPromises.keys()),
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
      timestamp: Date.now(),
    });

    // Trim event log if it exceeds the configured size
    if (this.eventLog.length > this.config.eventHistorySize) {
      this.eventLog = this.eventLog.slice(-this.config.eventHistorySize);
    }
  }

  /**
   * Gets the event history log
   * @returns Array of event entries
   */
  getEventHistory(): Array<{ event: string; data: any; timestamp: number }> {
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
    if (!Array.isArray(keys) || keys.length === 0) {
      return Promise.resolve();
    }

    // Filter out already loaded assets
    const assetsToLoad = keys.filter((key) => !this.isLoaded(key));

    if (assetsToLoad.length === 0) {
      return Promise.resolve();
    }

    // Create loading tracker
    let loadedCount = 0;
    const totalCount = assetsToLoad.length;

    // Create array of promises for each asset to load
    const loadPromises = assetsToLoad.map((key) => {
      return this.loadAsset(key)
        .then(() => {
          loadedCount++;

          // Update progress if callback provided
          if (onProgress && typeof onProgress === 'function') {
            onProgress(loadedCount / totalCount);
          }

          return true;
        })
        .catch((error) => {
          console.error(`[AssetService] Failed to load asset: ${key}`, error);
          throw error;
        });
    });

    // Return a promise that resolves when all assets are loaded
    return Promise.all(loadPromises).then(() => void 0);
  }

  /**
   * Gets an asset by its key and type
   * @param key Asset key
   * @param type Asset type
   * @returns The loaded asset
   * @private
   */
  private getAssetByType(
    key: string,
    type: AssetType
  ): Phaser.GameObjects.GameObject | Phaser.Loader.FileTypes.AudioFile | Phaser.Textures.Texture | object {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    switch (type) {
      case AssetType.IMAGE:
        return this.scene.textures.get(key);
      case AssetType.AUDIO:
        return this.scene.sound.get(key);
      case AssetType.JSON:
        return this.scene.cache.json.get(key);
      case AssetType.BITMAP_FONT:
        return this.scene.cache.bitmapFont.get(key);
      default:
        throw new Error(`Unsupported asset type: ${type}`);
    }
  }

  /**
   * Loads a single asset
   * @param key Asset key
   * @returns Promise that resolves with the loaded asset
   * @throws Error if asset is not registered or fails to load
   */
  loadAsset(
    key: string
  ): Promise<
    | Phaser.GameObjects.GameObject
    | Phaser.Loader.FileTypes.AudioFile
    | Phaser.Textures.Texture
    | object
  > {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    const assetInfo = this.getAssetInfo(key);
    if (!assetInfo) {
      throw new Error(`Asset not found: ${key}`);
    }

    // Check if already loaded
    if (this.isLoaded(key)) {
      return Promise.resolve(this.getAssetByType(key, assetInfo.type));
    }

    // Create loading promise
    const loadPromise = new Promise<any>((resolve, reject) => {
      if (!this.scene) {
        reject(new Error('Scene not initialized'));
        return;
      }

      const options = this.getAssetOptions(key);
      const atlasOptions = options as { atlasURL?: string };
      const fontOptions = options as { dataURL?: string };

      switch (assetInfo.type) {
        case AssetType.IMAGE:
          this.scene.load.image(key, assetInfo.path);
          break;
        case AssetType.SPRITE_SHEET:
          if (options?.frameConfig) {
            this.scene.load.spritesheet(key, assetInfo.path, options.frameConfig);
          } else {
            this.scene.load.spritesheet(key, assetInfo.path, {
              frameWidth: 32,
              frameHeight: 32,
            });
          }
          break;
        case AssetType.ATLAS:
          if (atlasOptions.atlasURL) {
            this.scene.load.atlas(key, atlasOptions.atlasURL, assetInfo.path);
          } else {
            this.scene.load.atlas(key, assetInfo.path);
          }
          break;
        case AssetType.AUDIO:
          this.scene.load.audio(key, assetInfo.path, {
            rate: options?.audioRate,
            loop: options?.loop,
          });
          break;
        case AssetType.JSON:
          this.scene.load.json(key, assetInfo.path);
          break;
        case AssetType.BITMAP_FONT:
          if (fontOptions.dataURL) {
            this.scene.load.bitmapFont(key, fontOptions.dataURL, assetInfo.path);
          } else {
            this.scene.load.bitmapFont(key, assetInfo.path);
          }
          break;
        default:
          reject(new Error(`Unsupported asset type: ${assetInfo.type}`));
          return;
      }

      this.scene.load.start();

      this.scene.load.once(`complete`, () => {
        if (!this.scene) {
          reject(new Error('Scene not initialized'));
          return;
        }
        // Update asset info to mark as loaded
        assetInfo.loaded = true;
        assetInfo.lastUsed = Date.now();
        resolve(this.getAssetByType(key, assetInfo.type));
      });

      this.scene.load.once(`loaderror`, (file: any) => {
        reject(new Error(`Failed to load asset: ${file.key}`));
      });
    });

    // Store promise and start loading
    this.loadingPromises.set(key, loadPromise);
    this.loadingMetrics.set(key, { startTime: Date.now() });

    return loadPromise;
  }

  /**
   * Gets the size of an asset in bytes
   * @param key Asset key
   * @returns Size in bytes or undefined if not available
   * @private
   */
  private getAssetSize(key: string): number | undefined {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    const assetInfo = this.getAssetInfo(key);
    if (!assetInfo) {
      return undefined;
    }

    switch (assetInfo.type) {
      case AssetType.IMAGE:
        return this.scene.textures.get(key).source[0].width * this.scene.textures.get(key).source[0].height * 4;
      case AssetType.AUDIO:
        return this.scene.sound.get(key).duration * 44100 * 2; // Approximate size based on duration
      case AssetType.JSON:
        return JSON.stringify(this.scene.cache.json.get(key)).length;
      default:
        return undefined;
    }
  }

  /**
   * Gets loading performance metrics for an asset
   * @param key Asset key
   * @returns Loading metrics or undefined if not available
   */
  getLoadingMetrics(key: string): { startTime: number; endTime?: number; duration?: number } | undefined {
    const metrics = this.loadingMetrics.get(key);
    if (!metrics) return undefined;

    return {
      startTime: metrics.startTime,
      endTime: metrics.endTime,
      duration: metrics.endTime ? metrics.endTime - metrics.startTime : undefined,
    };
  }

  /**
   * Gets loading performance metrics for all assets
   * @returns Array of loading metrics for all assets
   */
  getAllLoadingMetrics(): Array<{ key: string; metrics: { startTime: number; endTime?: number; duration?: number } }> {
    return Array.from(this.loadingMetrics.entries()).map(([key, metrics]) => ({
      key,
      metrics: {
        startTime: metrics.startTime,
        endTime: metrics.endTime,
        duration: metrics.endTime ? metrics.endTime - metrics.startTime : undefined,
      },
    }));
  }

  /**
   * Gets an asset by key and handles tracking and error states
   * @param key Asset key
   * @returns The asset
   * @private
   */
  private getAssetByKey(
    key: string
  ):
    | Phaser.GameObjects.GameObject
    | Phaser.Loader.FileTypes.AudioFile
    | Phaser.Textures.Texture
    | object {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    const assetInfo = this.getAssetInfo(key);
    if (!assetInfo) {
      throw new Error(`Asset not found: ${key}`);
    }

    switch (assetInfo.type) {
      case AssetType.IMAGE:
        return this.scene.textures.get(key);
      case AssetType.AUDIO:
        return this.scene.sound.get(key);
      case AssetType.JSON:
        return this.scene.cache.json.get(key);
      case AssetType.BITMAP_FONT:
        return this.scene.cache.bitmapFont.get(key);
      case AssetType.VIDEO:
        return this.scene.cache.video.get(key);
      case AssetType.TILEMAP:
        return this.scene.cache.tilemap.get(key);
      case AssetType.HTML:
        return this.scene.cache.html.get(key);
      case AssetType.SHADER:
        return this.scene.cache.shader.get(key);
      default:
        throw new Error(`Unsupported asset type: ${assetInfo.type}`);
    }
  }

  /**
   * Enforces cache policies for assets
   * @param assetInfo The asset to check
   * @returns true if the asset should be kept in cache, false if it should be removed
   */
  private enforceCachePolicy(assetInfo: AssetInfo): boolean {
    console.log(`[CachePolicy] Checking policy for asset: ${assetInfo.key}`);
    console.log(`[CachePolicy] Asset type: ${assetInfo.type}, Policy: ${assetInfo.cachePolicy}`);
    console.log(`[CachePolicy] Asset loaded: ${assetInfo.loaded}, Last used: ${assetInfo.lastUsed}`);

    if (!assetInfo.loaded) {
      console.log(`[CachePolicy] Asset ${assetInfo.key} not loaded, removing from cache`);
      return false;
    }

    switch (assetInfo.cachePolicy) {
      case CachePolicy.PERSISTENT:
        console.log(`[CachePolicy] Asset ${assetInfo.key} is PERSISTENT, keeping in cache`);
        return true;

      case CachePolicy.SESSION:
        console.log(`[CachePolicy] Asset ${assetInfo.key} is SESSION, keeping in cache`);
        return true;

      case CachePolicy.LEVEL:
        console.log(`[CachePolicy] Asset ${assetInfo.key} is LEVEL, keeping in cache (TODO: implement level-based caching)`);
        return true;

      case CachePolicy.TEMPORARY:
        const fiveSecondsAgo = Date.now() - 5000;
        const shouldKeep = (assetInfo.lastUsed || 0) > fiveSecondsAgo;
        console.log(`[CachePolicy] Asset ${assetInfo.key} is TEMPORARY, last used: ${assetInfo.lastUsed}, five seconds ago: ${fiveSecondsAgo}, keeping: ${shouldKeep}`);
        return shouldKeep;

      case CachePolicy.MANUAL:
        console.log(`[CachePolicy] Asset ${assetInfo.key} is MANUAL, keeping in cache until explicitly removed`);
        return true;

      default:
        console.log(`[CachePolicy] Asset ${assetInfo.key} has unknown policy, defaulting to persistent behavior`);
        return true;
    }
  }

  /**
   * Updates the last used timestamp for an asset
   * @param key The asset key
   */
  private updateLastUsed(key: string): void {
    const assetInfo = this.assets.get(key);
    if (assetInfo) {
      const oldLastUsed = assetInfo.lastUsed;
      assetInfo.lastUsed = Date.now();
      console.log(`[CachePolicy] Updated last used time for ${key}: ${oldLastUsed} -> ${assetInfo.lastUsed}`);
    }
  }

  /**
   * Gets a texture asset
   * @param key Asset key
   * @returns The texture
   * @throws Error if asset is not loaded or is not a texture
   */
  getTexture(key: string): Phaser.Textures.Texture {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }
    return this.scene.textures.get(key);
  }

  /**
   * Gets an audio asset
   * @param key Asset key
   * @returns The audio asset
   * @throws Error if asset is not loaded or is not an audio asset
   */
  getAudio(key: string): Phaser.Sound.BaseSound {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }
    return this.scene.sound.get(key);
  }

  /**
   * Gets a JSON asset
   * @param key Asset key
   * @returns The JSON object
   * @throws Error if asset is not loaded or is not a JSON asset
   */
  getJSON(key: string): object {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }
    return this.scene.cache.json.get(key);
  }

  /**
   * Gets a texture atlas asset
   * @param key Asset key
   * @returns Phaser texture
   */
  getAtlas(key: string): Phaser.Textures.Texture {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }
    return this.scene.textures.get(key);
  }

  /**
   * Gets a bitmap font asset
   * @param key Asset key
   * @returns Phaser bitmap text
   */
  getBitmapFont(key: string): Phaser.GameObjects.BitmapText {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }
    return this.scene.add.bitmapText(0, 0, key, '');
  }

  /**
   * Watches loading of multiple assets
   * @param keys Array of asset keys to watch
   * @param onProgress Progress callback
   * @param onComplete Completion callback
   * @returns Object with stopWatching method
   */
  watchLoading(
    keys: string[],
    onProgress: (progress: number) => void,
    onComplete: () => void
  ): { stopWatching: () => void } {
    if (!Array.isArray(keys) || keys.length === 0) {
      // If no keys to watch, immediately complete
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      return { stopWatching: () => {} };
    }

    let active = true;
    const subscriptions: Subscription[] = [];

    // Check if all assets are already loaded
    const allLoaded = keys.every((key) => this.isLoaded(key));
    if (allLoaded) {
      if (onProgress && typeof onProgress === 'function') {
        onProgress(1);
      }
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
      return { stopWatching: () => {} };
    }

    // Set up state for tracking load progress
    const assetStates = new Map<string, boolean>();
    keys.forEach((key) => {
      assetStates.set(key, this.isLoaded(key));
    });

    // Function to calculate current progress
    const calculateProgress = (): number => {
      let loadedCount = 0;
      assetStates.forEach((loaded) => {
        if (loaded) loadedCount++;
      });
      return loadedCount / assetStates.size;
    };

    // Function to check if all assets are loaded
    const checkAllLoaded = (): boolean => {
      let allLoaded = true;
      assetStates.forEach((loaded) => {
        if (!loaded) allLoaded = false;
      });
      return allLoaded;
    };

    // Subscribe to load completed events
    if (this.eventBus) {
      const loadCompletedSubscription = this.eventBus.on(
        'asset.load.completed',
        (data?: ILoadCompleted) => {
          if (!active || !data) return;

          // If this is one of our watched assets
          if (assetStates.has(data.key)) {
            // Update state
            assetStates.set(data.key, true);

            // Call progress callback
            if (onProgress && typeof onProgress === 'function') {
              onProgress(calculateProgress());
            }

            // Check if all assets are loaded
            if (checkAllLoaded()) {
              // Call complete callback
              if (onComplete && typeof onComplete === 'function') {
                onComplete();
              }
              // Stop watching
              active = false;
              subscriptions.forEach((sub) => sub.unsubscribe());
            }
          }
        }
      );

      subscriptions.push(loadCompletedSubscription);
    }

    // Return method to stop watching
    return {
      stopWatching: () => {
        active = false;
        subscriptions.forEach((sub) => sub.unsubscribe());
      },
    };
  }

  /**
   * Releases an asset from memory
   * @param key Asset key
   * @returns True if the asset was released
   */
  releaseAsset(key: string): boolean {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    const assetInfo = this.getAssetInfo(key);
    if (!assetInfo) {
      return false;
    }

    try {
      switch (assetInfo.type) {
        case AssetType.IMAGE:
          if (this.scene.textures.exists(key)) {
            this.scene.textures.remove(key);
          }
          break;
        case AssetType.AUDIO:
          const sound = this.scene.sound.get(key);
          if (sound) {
            sound.destroy();
          }
          break;
        case AssetType.VIDEO:
          const video = this.scene.cache.video.get(key);
          if (video) {
            video.destroy();
          }
          break;
        case AssetType.BITMAP_FONT:
          if (this.scene.cache.bitmapFont.has(key)) {
            this.scene.cache.bitmapFont.remove(key);
          }
          break;
        case AssetType.JSON:
          if (this.scene.cache.json.has(key)) {
            this.scene.cache.json.remove(key);
          }
          break;
        case AssetType.TILEMAP:
          if (this.scene.cache.tilemap.has(key)) {
            this.scene.cache.tilemap.remove(key);
          }
          break;
        case AssetType.HTML:
          if (this.scene.cache.html.has(key)) {
            this.scene.cache.html.remove(key);
          }
          break;
        case AssetType.SHADER:
          if (this.scene.cache.shader.has(key)) {
            this.scene.cache.shader.remove(key);
          }
          break;
      }

      // Remove from registry
      this.assets.delete(key);
      return true;
    } catch (error) {
      console.error(`Error releasing asset ${key}:`, error);
      return false;
    }
  }

  /**
   * Clears assets from memory
   * @param keys Optional array of asset keys to clear. If not provided, all loaded assets will be cleared.
   */
  clearAssets(keys?: string[]): void {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    if (keys) {
      // Clear specific assets
      for (const key of keys) {
        const assetInfo = this.getAssetInfo(key);
        if (assetInfo && assetInfo.cachePolicy !== CachePolicy.PERSISTENT) {
          this.releaseAsset(key);
        }
      }
    } else {
      // Clear all non-persistent assets
      for (const [key, assetInfo] of this.assets.entries()) {
        if (assetInfo.cachePolicy !== CachePolicy.PERSISTENT) {
          this.releaseAsset(key);
        }
      }
    }
  }

  /**
   * Gets memory usage data
   * @returns Memory usage data
   */
  getMemoryUsage(): MemoryUsageData {
    if (!this.scene) {
      throw new Error('Scene not initialized');
    }

    const usage: MemoryUsageData = {
      total: 0,
      byType: Object.values(AssetType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<AssetType, number>),
      largestAssets: [],
    };

    // Calculate memory usage for each asset
    for (const [key, assetInfo] of this.assets.entries()) {
      if (this.scene.textures.exists(key)) {
        const texture = this.scene.textures.get(key);
        const size = texture.source[0].width * texture.source[0].height * 4;
        usage.total += size;
        usage.byType[AssetType.IMAGE] += size;
      }
      const json = this.scene.cache.json.get(key);
      if (json) {
        const size = JSON.stringify(json).length;
        usage.total += size;
        usage.byType[AssetType.JSON] += size;
      }
    }

    // Sort assets by size
    usage.largestAssets = Object.entries(usage.byType)
      .map(([type, size]) => ({
        key: type,
        size,
        type: type as AssetType,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return usage;
  }

  /**
   * Gets the total memory used by assets
   * @returns Total memory in MB
   */
  getTotalMemoryUsed(): number {
    // We can use getMemoryUsage but just return the total
    return this.getMemoryUsage().total;
  }

  /**
   * Gets memory usage by asset type
   * @returns Record of memory usage by type
   */
  getMemoryUsageByType(): Record<AssetType, number> {
    // We can use getMemoryUsage but just return the byType property
    return this.getMemoryUsage().byType;
  }

  /**
   * Sets memory thresholds for warning and critical events
   * @param warning Warning threshold in MB
   * @param critical Critical threshold in MB
   */
  setMemoryThresholds(warning: number, critical: number): void {
    if (typeof warning !== 'number' || warning <= 0) {
      throw new Error('Warning threshold must be a positive number');
    }

    if (typeof critical !== 'number' || critical <= 0) {
      throw new Error('Critical threshold must be a positive number');
    }

    if (warning >= critical) {
      throw new Error('Warning threshold must be less than critical threshold');
    }

    // Update config
    this.config.memoryWarningThreshold = warning;
    this.config.memoryCriticalThreshold = critical;

    if (this.config.enableLogging) {
      console.log(
        `[AssetService] Memory thresholds updated: Warning=${warning}MB, Critical=${critical}MB`
      );
    }
  }

  /**
   * Prunes the asset cache
   * @param targetSize Target cache size in MB, defaults to 80% of warning threshold
   * @returns Cache pruning result data
   */
  pruneCache(targetSize?: number): CachePrunedData {
    // Get current memory usage
    const memoryData = this.getMemoryUsage();
    const currentMemory = memoryData.total;

    // If no target size provided, use 80% of warning threshold
    const targetMemory = targetSize || this.config.memoryWarningThreshold * 0.8;

    // If we're already below the target, no need to prune
    if (currentMemory <= targetMemory) {
      if (this.config.enableLogging) {
        console.log(
          `[AssetService] No need to prune cache: ${currentMemory.toFixed(2)}MB used, target is ${targetMemory.toFixed(2)}MB`
        );
      }

      return {
        removedCount: 0,
        freedMemory: 0,
        removedAssets: [],
      };
    }

    // Calculate how much memory we need to free
    const memoryToFree = currentMemory - targetMemory;

    // Get all loaded assets with their memory usage and sort them based on the selected strategy
    const assetEntries: Array<{ key: string; memory: number; lastUsed: number; priority: number }> =
      [];

    this.assets.forEach((asset, key) => {
      if (!asset.loaded || asset.cachePolicy === CachePolicy.PERSISTENT) {
        return; // Skip unloaded assets and persistent assets
      }

      // Get estimated memory for this asset (simplified version)
      const memory =
        memoryData.byType[asset.type] /
        Array.from(this.assets.values()).filter((a) => a.loaded && a.type === asset.type).length;

      // Calculate priority based on asset type
      const priorityIndex = this.config.priorityAssetTypes.indexOf(asset.type);
      const priority = priorityIndex >= 0 ? priorityIndex : this.config.priorityAssetTypes.length;

      assetEntries.push({
        key,
        memory,
        lastUsed: asset.lastUsed || 0,
        priority,
      });
    });

    // Sort assets based on the selected strategy
    switch (this.config.cachePruneStrategy) {
      case 'LRU':
        // Sort by last used time (oldest first)
        assetEntries.sort((a, b) => a.lastUsed - b.lastUsed);
        break;

      case 'SIZE':
        // Sort by memory usage (largest first)
        assetEntries.sort((a, b) => b.memory - a.memory);
        break;

      case 'HYBRID':
        // Combined approach considering last used time, size, and priority
        assetEntries.sort((a, b) => {
          // Calculate a score based on all factors
          const timeFactorA = (Date.now() - a.lastUsed) / 3600000; // Hours since last use
          const timeFactorB = (Date.now() - b.lastUsed) / 3600000;

          const scoreA = timeFactorA * 0.6 + a.memory * 0.3 - a.priority * 0.1;
          const scoreB = timeFactorB * 0.6 + b.memory * 0.3 - b.priority * 0.1;

          return scoreB - scoreA; // Higher score gets removed first
        });
        break;
    }

    // Release assets until we've freed enough memory
    const releasedAssets: string[] = [];
    let freedMemory = 0;

    for (const entry of assetEntries) {
      if (freedMemory >= memoryToFree) {
        // We've freed enough memory
        break;
      }

      // Release this asset
      if (this.releaseAsset(entry.key)) {
        releasedAssets.push(entry.key);
        freedMemory += entry.memory;
      }
    }

    // Create result data
    const pruneData: CachePrunedData = {
      removedCount: releasedAssets.length,
      freedMemory,
      removedAssets: releasedAssets,
    };

    // Emit pruning event
    this.emitEvent('asset.cache.pruned', pruneData);

    if (this.config.enableLogging) {
      console.log(
        `[AssetService] Pruned cache: Removed ${releasedAssets.length} assets, freed ${freedMemory.toFixed(2)}MB: ${releasedAssets.join(', ')}`
      );
    }

    return pruneData;
  }

  /**
   * Enables memory monitoring
   * @param interval Monitoring interval in ms
   */
  enableMemoryMonitoring(interval?: number): void {
    if (this.memoryMonitorInterval !== null) {
      this.disableMemoryMonitoring();
    }

    // Set default interval if not provided
    const monitoringInterval = interval || this.config.memoryMonitoringInterval;

    // Use browser setInterval to periodically check memory usage
    // We'll store the ID as a number rather than NodeJS.Timeout for type compatibility
    this.memoryMonitorInterval = window.setInterval(() => {
      // Get current memory usage
      const memoryData = this.getMemoryUsage();

      // Memory warning/critical events are already handled in getMemoryUsage()

      if (this.config.enableLogging) {
        console.log(`[AssetService] Memory monitoring: ${memoryData.total.toFixed(2)}MB used`);
      }

      // If auto-pruning is enabled and we're approaching the warning threshold (80%)
      if (
        this.config.autoPruneCache &&
        memoryData.total > this.config.memoryWarningThreshold * 0.8 &&
        memoryData.total < this.config.memoryWarningThreshold
      ) {
        // Preemptively prune to avoid hitting the warning threshold
        this.pruneCache(this.config.memoryWarningThreshold * 0.7);
      }
    }, monitoringInterval) as unknown as number;

    if (this.config.enableLogging) {
      console.log(
        `[AssetService] Memory monitoring enabled with interval: ${monitoringInterval}ms`
      );
    }
  }

  /**
   * Disables memory monitoring
   */
  disableMemoryMonitoring(): void {
    if (this.memoryMonitorInterval !== null) {
      window.clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;

      if (this.config.enableLogging) {
        console.log('[AssetService] Memory monitoring disabled');
      }
    }
  }

  /**
   * Get asset options from registry
   * @param _key Asset key
   * @returns Asset options or undefined if not found
   * @private
   */
  private getAssetOptions(_key: string): AssetOptions | undefined {
    // Since AssetInfo doesn't store options, we need to find the original asset definition
    // This is a workaround since we don't store options in AssetInfo
    // In a real implementation, you might want to store options in AssetInfo

    // For now, return undefined as this is a stub
    // In the actual implementation, this would retrieve options from wherever they are stored
    return undefined;
  }

  /**
   * Creates an asset group with the specified ID and asset keys
   * @param groupId Group ID
   * @param assetKeys Array of asset keys to include in the group
   * @throws Error if group already exists or if any asset key is invalid
   */
  createGroup(groupId: string, assetKeys: string[]): void {
    // Validate parameters
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Group ID must be a non-empty string');
    }

    if (!Array.isArray(assetKeys) || assetKeys.length === 0) {
      throw new Error('Asset keys must be a non-empty array');
    }

    // Check if group already exists
    if (this.groups.has(groupId)) {
      throw new Error(`Group with ID "${groupId}" already exists`);
    }

    // Validate that all asset keys exist in the registry
    const invalidKeys: string[] = [];
    for (const key of assetKeys) {
      if (!this.assets.has(key)) {
        invalidKeys.push(key);
      }
    }

    if (invalidKeys.length > 0) {
      throw new Error(
        `Cannot create group "${groupId}": The following assets are not registered: ${invalidKeys.join(
          ', '
        )}`
      );
    }

    // Create the group
    this.groups.set(groupId, [...assetKeys]);

    // Emit group creation event
    this.emitEvent('asset.group.operation', {
      groupId,
      assetCount: assetKeys.length,
      operation: 'created',
    });

    if (this.config.enableLogging) {
      console.log(
        `[AssetService] Created group "${groupId}" with ${assetKeys.length} assets: ${assetKeys.join(
          ', '
        )}`
      );
    }
  }

  /**
   * Loads all assets in the specified group
   * @param groupId Group ID
   * @param onProgress Optional callback for loading progress (0-1)
   * @returns Promise that resolves when all assets in the group are loaded
   * @throws Error if group does not exist
   */
  loadGroup(groupId: string, onProgress?: (progress: number) => void): Promise<void> {
    // Validate parameters
    if (!groupId || typeof groupId !== 'string') {
      return Promise.reject(new Error('Group ID must be a non-empty string'));
    }

    // Check if group exists
    const assetKeys = this.groups.get(groupId);
    if (!assetKeys) {
      return Promise.reject(new Error(`Group with ID "${groupId}" does not exist`));
    }

    // Emit group loading event
    this.emitEvent('asset.group.operation', {
      groupId,
      assetCount: assetKeys.length,
      operation: 'loading',
    });

    if (this.config.enableLogging) {
      console.log(`[AssetService] Loading group "${groupId}" with ${assetKeys.length} assets`);
    }

    // Create a loading promise that tracks all assets in the group
    return this.preload(assetKeys, (progress) => {
      // Forward progress to the callback if provided
      if (onProgress) {
        onProgress(progress);
      }
    }).then(() => {
      // Emit group loaded event
      this.emitEvent('asset.group.operation', {
        groupId,
        assetCount: assetKeys.length,
        operation: 'loaded',
      });

      if (this.config.enableLogging) {
        console.log(`[AssetService] Loaded group "${groupId}" successfully`);
      }
    });
  }

  /**
   * Releases all assets in the specified group
   * @param groupId Group ID
   * @throws Error if group does not exist
   */
  releaseGroup(groupId: string): void {
    // Validate parameters
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('Group ID must be a non-empty string');
    }

    // Check if group exists
    const assetKeys = this.groups.get(groupId);
    if (!assetKeys) {
      throw new Error(`Group with ID "${groupId}" does not exist`);
    }

    // Release each asset in the group
    const releasedAssets: string[] = [];
    for (const key of assetKeys) {
      if (this.releaseAsset(key)) {
        releasedAssets.push(key);
      }
    }

    // Emit group released event
    this.emitEvent('asset.group.operation', {
      groupId,
      assetCount: releasedAssets.length,
      operation: 'released',
    });

    if (this.config.enableLogging) {
      console.log(
        `[AssetService] Released group "${groupId}": ${releasedAssets.length} assets released`
      );
    }
  }

  // IService implementation
  getStatus(): ServiceStatus {
    return this.status;
  }

  getScene(): Phaser.Scene | null {
    return this.currentScene;
  }

  setScene(scene: Phaser.Scene | null): void {
    this.setCurrentScene(scene);
  }

  getPriority(): number {
    return 1; // High priority as other services may depend on assets
  }

  getDependencies(): string[] {
    return ['eventBus']; // Only depends on EventBusService
  }

  async onInit(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    this.currentScene = scene;
    this.status = ServiceStatus.CREATED;
  }

  async onStart(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    this.currentScene = scene;
    this.status = ServiceStatus.STARTED;
  }

  async onPause(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    this.currentScene = scene;
    this.status = ServiceStatus.PAUSED;
    this.emitEvent('asset.state.changed', {
      key: 'service',
      previousState: 'loaded',
      newState: 'registered'
    });
  }

  async onResume(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    this.currentScene = scene;
    this.status = ServiceStatus.RESUMED;
    this.emitEvent('asset.state.changed', {
      key: 'service',
      previousState: 'registered',
      newState: 'loaded'
    });
  }

  async onStop(scene: Phaser.Scene): Promise<void> {
    this.scene = scene;
    this.currentScene = scene;
    this.status = ServiceStatus.SHUTDOWN;
    this.emitEvent('asset.state.changed', {
      key: 'service',
      previousState: 'loaded',
      newState: 'released'
    });
  }

  async onDestroy(scene: Phaser.Scene): Promise<void> {
    this.status = ServiceStatus.DESTROYED;
    // Clean up scene-specific resources
    this.releaseSceneAssets(scene);
    this.sceneAssets.delete(scene);
    this.sceneMemoryUsage.delete(scene);
    this.sceneLoadingStatus.delete(scene);
  }

  // ILifecycleAssetService implementation
  getCurrentScene(): Phaser.Scene | null {
    return this.currentScene;
  }

  setCurrentScene(scene: Phaser.Scene | null): void {
    if (this.currentScene === scene) {
      return;
    }

    // Clean up old scene if needed
    if (this.currentScene) {
      this.releaseSceneAssets(this.currentScene);
    }

    this.currentScene = scene;
  }

  getSceneAssets(scene: Phaser.Scene): string[] {
    const assets = this.sceneAssets.get(scene);
    return assets ? Array.from(assets) : [];
  }

  releaseSceneAssets(scene: Phaser.Scene): void {
    const assets = this.getSceneAssets(scene);
    for (const key of assets) {
      this.releaseAsset(key);
    }
    this.sceneAssets.delete(scene);
  }

  getSceneMemoryUsage(scene: Phaser.Scene): number {
    return this.sceneMemoryUsage.get(scene) ?? 0;
  }

  getSceneLoadingStatus(scene: Phaser.Scene): { loaded: number; total: number; inProgress: string[] } {
    return this.sceneLoadingStatus.get(scene) ?? { loaded: 0, total: 0, inProgress: [] };
  }
}
