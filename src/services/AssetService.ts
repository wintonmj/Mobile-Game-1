import { IAssetService, AssetEventMap, ILoadCompleted } from './interfaces/IAssetService';
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
  private memoryMonitorInterval: number | null = null;

  /**
   * Creates a new instance of the AssetService
   * @param scene The Phaser scene to use for loading assets
   * @param registry The service registry for accessing other services
   * @param config Optional configuration options
   */
  constructor(scene: Phaser.Scene, registry: IRegistry, config?: Partial<AssetServiceConfig>) {
    this.scene = scene;
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
   * @param _options Optional loading configuration
   */
  registerAsset(key: string, path: string, type: AssetType, _options?: AssetOptions): void {
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
      cachePolicy: CachePolicy.PERSISTENT, // Default policy
    };

    // Store in registry
    this.assets.set(key, assetInfo);

    // Emit registration event
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
   * Gets the event history
   * @returns Array of event history entries
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
   * Load a single asset
   * @param key Asset key
   * @returns Promise that resolves with the loaded asset
   */
  loadAsset(key: string): Promise<any> {
    // Validate key
    if (!key || typeof key !== 'string') {
      return Promise.reject(new Error('Asset key must be a non-empty string'));
    }

    // Check if asset is already loaded
    if (this.isLoaded(key)) {
      return Promise.resolve(this.getAssetByKey(key));
    }

    // Check if asset is in loading progress
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Get asset info
    const assetInfo = this.assets.get(key);
    if (!assetInfo) {
      return Promise.reject(new Error(`Asset with key "${key}" is not registered`));
    }

    // Create asset loading promise
    const loadPromise = new Promise<any>((resolve, reject) => {
      // Update asset state
      this.emitEvent('asset.state.changed', {
        key,
        previousState: 'registered',
        newState: 'loading',
      });

      // Emit load started event
      this.emitEvent('asset.load.started', {
        key,
        type: assetInfo.type,
        timestamp: Date.now(),
      });

      const startTime = Date.now();

      // Create a new loader for this asset
      const loader = this.scene.load;

      // Set up loader event handlers for this specific asset
      const fileLoadProgressHandler = (file: Phaser.Loader.File) => {
        if (file.key === key) {
          this.emitEvent('asset.load.progress', {
            key,
            progress: file.percentComplete,
            bytes: file.bytesLoaded,
            totalBytes: file.bytesTotal,
          });
        }
      };

      const fileCompleteHandler = (file: string) => {
        if (file === key) {
          const loadTime = Date.now() - startTime;

          // Update asset info
          assetInfo.loaded = true;
          assetInfo.loadTime = loadTime;
          assetInfo.lastUsed = Date.now();

          // Remove from loading promises
          this.loadingPromises.delete(key);

          // Clean up loader event handlers
          loader.off('fileprogress', fileLoadProgressHandler);
          loader.off('filecomplete', fileCompleteHandler);
          loader.off('fileerror', fileErrorHandler);

          // Update asset state
          this.emitEvent('asset.state.changed', {
            key,
            previousState: 'loading',
            newState: 'loaded',
          });

          // Emit completion event
          this.emitEvent('asset.load.completed', {
            key,
            type: assetInfo.type,
            duration: loadTime,
            size: undefined, // Can't determine size from string file parameter
          });

          if (this.config.enableLogging) {
            console.log(`[AssetService] Loaded asset: ${key} (${loadTime}ms)`);
          }

          // Resolve with the loaded asset
          resolve(this.getAssetByKey(key));
        }
      };

      const fileErrorHandler = (file: Phaser.Loader.File) => {
        if (file.key === key) {
          // Remove from loading promises
          this.loadingPromises.delete(key);

          // Clean up loader event handlers
          loader.off('fileprogress', fileLoadProgressHandler);
          loader.off('filecomplete', fileCompleteHandler);
          loader.off('fileerror', fileErrorHandler);

          // Update asset state
          this.emitEvent('asset.state.changed', {
            key,
            previousState: 'loading',
            newState: 'error',
          });

          // Emit error event
          this.emitEvent('asset.load.error', {
            key,
            type: assetInfo.type,
            error:
              file.state === Phaser.Loader.FILE_ERRORED
                ? `Failed to load asset: ${file.src}`
                : `Unknown error loading asset: ${key}`,
            attemptCount: 1,
            willRetry: false,
          });

          if (this.config.enableLogging) {
            console.error(`[AssetService] Failed to load asset: ${key}`);
          }

          reject(new Error(`Failed to load asset: ${key}`));
        }
      };

      // Add event handlers
      loader.on('fileprogress', fileLoadProgressHandler);
      loader.on('filecomplete', fileCompleteHandler);
      loader.on('fileerror', fileErrorHandler);

      // Load asset based on type
      try {
        switch (assetInfo.type) {
          case AssetType.IMAGE:
            loader.image(key, assetInfo.path);
            break;

          case AssetType.SPRITE_SHEET: {
            // Find the asset definition to get options
            const spriteSheetOptions = this.getAssetOptions(key);
            if (!spriteSheetOptions?.frameConfig) {
              reject(new Error(`Spritesheet ${key} requires frameConfig in options`));
              return;
            }
            loader.spritesheet(key, assetInfo.path, spriteSheetOptions.frameConfig);
            break;
          }

          case AssetType.ATLAS: {
            const atlasOptions = this.getAssetOptions(key);
            if (!atlasOptions?.atlasURL) {
              reject(new Error(`Atlas ${key} requires atlasURL in options`));
              return;
            }
            loader.atlas(key, assetInfo.path, atlasOptions.atlasURL);
            break;
          }

          case AssetType.AUDIO:
            loader.audio(key, assetInfo.path);
            break;

          case AssetType.JSON:
            loader.json(key, assetInfo.path);
            break;

          case AssetType.BITMAP_FONT: {
            const bitmapFontOptions = this.getAssetOptions(key);
            if (!bitmapFontOptions?.dataURL) {
              reject(new Error(`BitmapFont ${key} requires dataURL in options`));
              return;
            }
            loader.bitmapFont(key, assetInfo.path, bitmapFontOptions.dataURL);
            break;
          }

          case AssetType.VIDEO:
            loader.video(key, assetInfo.path);
            break;

          case AssetType.TILEMAP: {
            const tilemapOptions = this.getAssetOptions(key);
            if (!tilemapOptions?.dataURL) {
              reject(new Error(`Tilemap ${key} requires dataURL in options`));
              return;
            }
            loader.tilemapTiledJSON(key, assetInfo.path);
            break;
          }

          case AssetType.HTML:
            loader.html(key, assetInfo.path);
            break;

          case AssetType.SHADER:
            loader.glsl(key, assetInfo.path);
            break;

          default:
            reject(new Error(`Unsupported asset type: ${assetInfo.type}`));
            return;
        }

        // Start the loader if not already started
        loader.start();
      } catch (error) {
        // Clean up event handlers
        loader.off('fileprogress', fileLoadProgressHandler);
        loader.off('filecomplete', fileCompleteHandler);
        loader.off('fileerror', fileErrorHandler);

        // Update asset state
        this.emitEvent('asset.state.changed', {
          key,
          previousState: 'loading',
          newState: 'error',
        });

        // Emit error event
        this.emitEvent('asset.load.error', {
          key,
          type: assetInfo.type,
          error: error instanceof Error ? error : `Unknown error loading asset: ${key}`,
          attemptCount: 1,
          willRetry: false,
        });

        // Reject the promise
        reject(error);
      }
    });

    // Store and return the loading promise
    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Gets a loaded asset by key
   * @param key Asset key
   * @returns The loaded asset
   * @private
   */
  private getAssetByKey(key: string): any {
    const assetInfo = this.assets.get(key);
    if (!assetInfo || !assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    // Return appropriate asset based on type
    switch (assetInfo.type) {
      case AssetType.IMAGE:
      case AssetType.SPRITE_SHEET:
      case AssetType.ATLAS:
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
   * Gets a texture asset
   * @param key Asset key
   * @returns Phaser texture
   */
  getTexture(key: string): Phaser.Textures.Texture {
    const assetInfo = this.assets.get(key);

    if (!assetInfo) {
      throw new Error(`Asset with key "${key}" is not registered`);
    }

    if (!assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded yet. Call loadAsset() first.`);
    }

    if (![AssetType.IMAGE, AssetType.SPRITE_SHEET, AssetType.ATLAS].includes(assetInfo.type)) {
      throw new Error(`Asset with key "${key}" is not a texture (type: ${assetInfo.type})`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    return this.scene.textures.get(key);
  }

  /**
   * Gets an audio asset
   * @param key Asset key
   * @returns Phaser sound
   */
  getAudio(key: string): Phaser.Sound.BaseSound {
    const assetInfo = this.assets.get(key);

    if (!assetInfo) {
      throw new Error(`Asset with key "${key}" is not registered`);
    }

    if (!assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded yet. Call loadAsset() first.`);
    }

    if (assetInfo.type !== AssetType.AUDIO) {
      throw new Error(`Asset with key "${key}" is not an audio (type: ${assetInfo.type})`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    return this.scene.sound.get(key);
  }

  /**
   * Gets a JSON asset
   * @param key Asset key
   * @returns JSON data
   */
  getJSON(key: string): any {
    const assetInfo = this.assets.get(key);

    if (!assetInfo) {
      throw new Error(`Asset with key "${key}" is not registered`);
    }

    if (!assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded yet. Call loadAsset() first.`);
    }

    if (assetInfo.type !== AssetType.JSON) {
      throw new Error(`Asset with key "${key}" is not a JSON (type: ${assetInfo.type})`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    return this.scene.cache.json.get(key);
  }

  /**
   * Gets a texture atlas asset
   * @param key Asset key
   * @returns Phaser texture
   */
  getAtlas(key: string): Phaser.Textures.Texture {
    const assetInfo = this.assets.get(key);

    if (!assetInfo) {
      throw new Error(`Asset with key "${key}" is not registered`);
    }

    if (!assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded yet. Call loadAsset() first.`);
    }

    if (assetInfo.type !== AssetType.ATLAS) {
      throw new Error(`Asset with key "${key}" is not an atlas (type: ${assetInfo.type})`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    return this.scene.textures.get(key);
  }

  /**
   * Gets a bitmap font asset
   * @param key Asset key
   * @returns Phaser bitmap text
   */
  getBitmapFont(key: string): Phaser.GameObjects.BitmapText {
    const assetInfo = this.assets.get(key);

    if (!assetInfo) {
      throw new Error(`Asset with key "${key}" is not registered`);
    }

    if (!assetInfo.loaded) {
      throw new Error(`Asset with key "${key}" is not loaded yet. Call loadAsset() first.`);
    }

    if (assetInfo.type !== AssetType.BITMAP_FONT) {
      throw new Error(`Asset with key "${key}" is not a bitmap font (type: ${assetInfo.type})`);
    }

    // Update last used timestamp
    assetInfo.lastUsed = Date.now();

    // Create a bitmap text object with this font
    // Note: We're returning a new instance each time this is called
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
   * @param _key Asset key
   * @returns True if the asset was released
   */
  releaseAsset(_key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Clears assets from memory
   * @param _keys Optional array of asset keys to clear
   */
  clearAssets(_keys?: string[]): void {
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
   * @param _targetSize Target cache size in MB
   * @returns Cache pruning result data
   */
  pruneCache(_targetSize?: number): CachePrunedData {
    throw new Error('Method not implemented.');
  }

  /**
   * Sets memory thresholds for warning and critical events
   * @param _warning Warning threshold in MB
   * @param _critical Critical threshold in MB
   */
  setMemoryThresholds(_warning: number, _critical: number): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Enables memory monitoring
   * @param interval Monitoring interval in ms
   */
  enableMemoryMonitoring(_interval?: number): void {
    if (this.memoryMonitorInterval !== null) {
      this.disableMemoryMonitoring();
    }

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
}
