# Asset Management System

## Overview
This document details the asset management system, including loading strategies, optimization techniques, and best practices for handling game assets.

## Core Components

### 1. Asset Registry
```typescript
interface AssetInfo {
  key: string;
  path: string;
  type: AssetType;
  metadata?: Record<string, any>;
  loaded: boolean;
  size?: number;
}

class AssetRegistry {
  private assets: Map<string, AssetInfo>;
  
  registerAsset(info: AssetInfo): void;
  unregisterAsset(key: string): void;
  getAssetInfo(key: string): AssetInfo | undefined;
  isLoaded(key: string): boolean;
}
```

### 2. Asset Loader
```typescript
interface LoaderConfig {
  maxConcurrent: number;
  retryAttempts: number;
  timeout: number;
}

class AssetLoader {
  constructor(scene: Phaser.Scene, config: LoaderConfig) {
    this.scene = scene;
    this.config = config;
  }
  
  preload(assets: AssetInfo[]): Promise<void>;
  loadInBackground(assets: AssetInfo[]): Promise<void>;
  unload(keys: string[]): void;
}
```

## Loading Strategies

### 1. Progressive Loading
- Initial minimal load for startup
- Background loading during gameplay
- Priority-based loading queue
- Load based on player location/progress

### 2. Scene-Based Loading
```typescript
class GameScene extends Phaser.Scene {
  preload(): void {
    // Show loading progress
    this.createLoadingBar();
    
    // Register required assets
    this.assetRegistry.registerAsset({
      key: 'player',
      path: 'assets/sprites/player.png',
      type: 'image'
    });
    
    // Load with progress tracking
    this.assetLoader.preload([
      'player',
      'environment',
      'ui'
    ]).then(() => {
      this.onLoadComplete();
    });
  }
}
```

### 3. Dynamic Loading
```typescript
class DynamicLoader {
  // Load assets based on viewport
  loadVisibleArea(bounds: Rectangle): void;
  
  // Predict and preload upcoming assets
  preloadNextArea(playerDirection: Vector2): void;
  
  // Unload distant assets
  unloadDistantAssets(currentPosition: Vector2): void;
}
```

## Asset Types and Handling

### 1. Images and Sprites
```typescript
interface ImageAsset extends AssetInfo {
  frameWidth?: number;
  frameHeight?: number;
  spacing?: number;
}

// Loading example
scene.load.image('background', 'assets/background.png');
scene.load.spritesheet('player', 'assets/player.png', {
  frameWidth: 64,
  frameHeight: 64
});
```

### 2. Audio
```typescript
interface AudioAsset extends AssetInfo {
  format: string[];
  volume?: number;
  loop?: boolean;
}

// Loading example
scene.load.audio('background-music', [
  'assets/audio/background.mp3',
  'assets/audio/background.ogg'
]);
```

### 3. Data Files
```typescript
interface DataAsset extends AssetInfo {
  format: 'json' | 'xml' | 'csv';
  parser?: (data: any) => any;
}

// Loading example
scene.load.json('game-config', 'assets/config.json');
```

## Optimization Techniques

### 1. Texture Atlases
```typescript
interface AtlasConfig {
  maxWidth: number;
  maxHeight: number;
  padding: number;
  allowRotation: boolean;
}

class TextureAtlasGenerator {
  generateAtlas(images: string[], config: AtlasConfig): Promise<AtlasData>;
  packImages(atlas: AtlasData): Promise<void>;
  exportAtlas(path: string): Promise<void>;
}
```

### 2. Audio Optimization
```typescript
interface AudioConfig {
  format: string[];
  quality: number;
  channels: number;
}

class AudioOptimizer {
  convertFormat(file: string, config: AudioConfig): Promise<void>;
  compressAudio(file: string, quality: number): Promise<void>;
  generateVariants(file: string): Promise<void>;
}
```

### 3. Memory Management
```typescript
class MemoryManager {
  // Track asset memory usage
  trackAssetMemory(key: string): void;
  
  // Get memory statistics
  getMemoryStats(): MemoryStats;
  
  // Clean up unused assets
  cleanupUnusedAssets(): void;
}
```

## Caching Strategies

### 1. Browser Cache
```typescript
class BrowserCacheManager {
  // Configure cache settings
  setCachePolicy(policy: CachePolicy): void;
  
  // Preload into browser cache
  primeCache(assets: string[]): Promise<void>;
  
  // Clear specific assets
  clearCache(keys: string[]): Promise<void>;
}
```

### 2. Memory Cache
```typescript
class MemoryCacheManager {
  // Set cache size limits
  setCacheLimits(limits: CacheLimits): void;
  
  // Add to memory cache
  cacheAsset(key: string, data: any): void;
  
  // Remove from cache
  uncacheAsset(key: string): void;
}
```

## Error Handling

### 1. Load Error Recovery
```typescript
class LoadErrorHandler {
  // Handle load failures
  handleLoadError(asset: AssetInfo, error: Error): void;
  
  // Retry failed loads
  retryLoad(asset: AssetInfo): Promise<void>;
  
  // Report load statistics
  getLoadStats(): LoadStats;
}
```

### 2. Missing Asset Fallbacks
```typescript
class AssetFallbackManager {
  // Register fallback assets
  registerFallback(key: string, fallbackKey: string): void;
  
  // Get fallback asset
  getFallback(key: string): string | undefined;
  
  // Use placeholder asset
  usePlaceholder(type: AssetType): string;
}
```

## Integration Examples

### 1. Scene Integration
```typescript
class GameScene extends Phaser.Scene {
  create() {
    // Initialize asset managers
    this.assetRegistry = new AssetRegistry();
    this.assetLoader = new AssetLoader(this, {
      maxConcurrent: 5,
      retryAttempts: 3,
      timeout: 10000
    });
    
    // Setup memory management
    this.memoryManager = new MemoryManager();
    
    // Configure dynamic loading
    this.dynamicLoader = new DynamicLoader(this);
    
    // Start asset tracking
    this.setupAssetTracking();
  }
  
  private setupAssetTracking(): void {
    // Track loaded assets
    this.assetRegistry.onAssetLoaded.add((key: string) => {
      this.memoryManager.trackAssetMemory(key);
    });
    
    // Monitor memory usage
    this.memoryManager.onMemoryWarning.add(() => {
      this.handleMemoryWarning();
    });
  }
}
```

### 2. Service Integration
```typescript
class AssetService implements IGameService {
  constructor() {
    this.setupAssetManagement();
  }
  
  private setupAssetManagement(): void {
    // Initialize managers
    this.registry = new AssetRegistry();
    this.memoryManager = new MemoryManager();
    this.cacheManager = new MemoryCacheManager();
    
    // Setup event handling
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    // Handle scene transitions
    this.events.on('scene.transition', this.handleSceneTransition);
    
    // Handle memory warnings
    this.events.on('memory.warning', this.handleMemoryWarning);
  }
}
```

## Best Practices

### 1. Asset Organization
- Use consistent naming conventions
- Organize assets by type and purpose
- Maintain clear directory structure
- Document asset requirements

### 2. Loading Optimization
- Minimize initial load size
- Use appropriate file formats
- Implement progressive loading
- Cache effectively

### 3. Memory Management
- Monitor memory usage
- Implement cleanup strategies
- Use texture atlases
- Unload unused assets

### 4. Error Handling
- Provide fallback assets
- Implement retry logic
- Log loading errors
- Handle missing assets gracefully

## Save Data Integration

### 1. Save Data Migration
```typescript
interface SaveDataMigration {
  version: string;
  migrate: (data: any) => Promise<any>;
}

class SaveDataMigrator {
  private migrations: SaveDataMigration[] = [];
  
  registerMigration(migration: SaveDataMigration): void {
    this.migrations.push(migration);
    // Sort migrations by version
    this.migrations.sort((a, b) => 
      this.compareVersions(a.version, b.version));
  }
  
  async migrateData(data: any, fromVersion: string, toVersion: string): Promise<any> {
    let currentData = { ...data };
    
    // Find applicable migrations
    const applicableMigrations = this.migrations.filter(m =>
      this.compareVersions(m.version, fromVersion) > 0 &&
      this.compareVersions(m.version, toVersion) <= 0
    );
    
    // Apply migrations in sequence
    for (const migration of applicableMigrations) {
      currentData = await migration.migrate(currentData);
    }
    
    return currentData;
  }
}
```

### 2. Asset State Persistence
```typescript
interface AssetState {
  id: string;
  type: string;
  modifications: AssetModification[];
  lastModified: number;
}

class AssetStatePersistence {
  private modifiedAssets: Map<string, AssetState> = new Map();
  
  trackModification(assetId: string, modification: AssetModification): void {
    let state = this.modifiedAssets.get(assetId);
    if (!state) {
      state = {
        id: assetId,
        type: modification.type,
        modifications: [],
        lastModified: Date.now()
      };
      this.modifiedAssets.set(assetId, state);
    }
    
    state.modifications.push(modification);
    state.lastModified = Date.now();
  }
  
  async saveState(): Promise<void> {
    const serializedState = Array.from(this.modifiedAssets.values())
      .map(state => ({
        ...state,
        modifications: state.modifications.map(mod => mod.serialize())
      }));
    
    await this.storage.set('assetState', serializedState);
  }
}
```

## Asset Streaming

### 1. Streaming Manager
```typescript
interface StreamingConfig {
  chunkSize: number;
  preloadDistance: number;
  maxConcurrentLoads: number;
  unloadDistance: number;
}

class AssetStreamingManager {
  private activeChunks: Set<string> = new Set();
  private loadQueue: PriorityQueue<ChunkRequest>;
  private config: StreamingConfig;
  
  constructor(config: StreamingConfig) {
    this.config = config;
    this.loadQueue = new PriorityQueue();
  }
  
  updatePlayerPosition(position: Vector2): void {
    // Calculate visible chunks
    const visibleChunks = this.calculateVisibleChunks(position);
    
    // Queue chunk loads
    for (const chunk of visibleChunks) {
      if (!this.activeChunks.has(chunk.id)) {
        this.queueChunkLoad(chunk);
      }
    }
    
    // Unload distant chunks
    this.unloadDistantChunks(position);
  }
  
  private async loadChunk(chunk: ChunkData): Promise<void> {
    // Load chunk assets
    const assets = await this.assetLoader.loadChunk(chunk.id);
    
    // Process loaded assets
    for (const asset of assets) {
      await this.processStreamedAsset(asset);
    }
    
    this.activeChunks.add(chunk.id);
  }
}
```

### 2. Progressive Loading
```typescript
class ProgressiveLoader {
  private loadingPhases: LoadingPhase[] = [];
  private currentPhase: number = 0;
  
  addPhase(phase: LoadingPhase): void {
    this.loadingPhases.push(phase);
  }
  
  async startLoading(): Promise<void> {
    for (const phase of this.loadingPhases) {
      await this.executePhase(phase);
      this.currentPhase++;
      
      // Allow game to be playable even if not all assets are loaded
      if (phase.allowGameStart) {
        this.events.emit('loading.gamePlayable');
      }
    }
  }
  
  private async executePhase(phase: LoadingPhase): Promise<void> {
    const assets = phase.getAssets();
    const total = assets.length;
    let loaded = 0;
    
    for (const asset of assets) {
      await this.loadAsset(asset);
      loaded++;
      
      this.events.emit('loading.progress', {
        phase: this.currentPhase,
        loaded,
        total,
        percentage: (loaded / total) * 100
      });
    }
  }
}
```

### 3. Asset Compression Pipeline
```typescript
interface CompressionConfig {
  format: 'webp' | 'avif' | 'png';
  quality: number;
  targetSize?: number;
}

class AssetCompressionPipeline {
  async processAsset(asset: Asset, config: CompressionConfig): Promise<Asset> {
    // Determine optimal compression strategy
    const strategy = this.determineCompressionStrategy(asset, config);
    
    // Apply compression
    const compressed = await this.compressAsset(asset, strategy);
    
    // Validate result
    if (!this.validateCompression(compressed, config)) {
      throw new Error('Compression failed to meet target requirements');
    }
    
    return compressed;
  }
  
  private determineCompressionStrategy(asset: Asset, config: CompressionConfig): CompressionStrategy {
    if (asset.type === 'image') {
      return this.determineImageStrategy(asset, config);
    } else if (asset.type === 'audio') {
      return this.determineAudioStrategy(asset, config);
    }
    // Add more asset types as needed
  }
}
```

## Asset Optimization

### 1. Dynamic Resolution Scaling
```typescript
class DynamicResolutionManager {
  private baseResolution: Vector2;
  private currentScale: number = 1.0;
  private targetFPS: number = 60;
  
  adjustResolution(currentFPS: number): void {
    if (currentFPS < this.targetFPS * 0.9) {
      // Decrease resolution to improve performance
      this.scaleDown();
    } else if (currentFPS > this.targetFPS && this.currentScale < 1.0) {
      // Increase resolution if performance allows
      this.scaleUp();
    }
  }
  
  private scaleDown(): void {
    this.currentScale = Math.max(0.5, this.currentScale - 0.1);
    this.applyScale();
  }
  
  private scaleUp(): void {
    this.currentScale = Math.min(1.0, this.currentScale + 0.1);
    this.applyScale();
  }
}
```

### 2. Asset Versioning
```typescript
interface AssetVersion {
  id: string;
  version: string;
  hash: string;
  dependencies: string[];
}

class AssetVersionManager {
  private versions: Map<string, AssetVersion> = new Map();
  
  async checkAssetUpdates(): Promise<AssetUpdate[]> {
    const updates: AssetUpdate[] = [];
    
    for (const [id, version] of this.versions) {
      const remoteVersion = await this.fetchRemoteVersion(id);
      if (this.compareVersions(version.version, remoteVersion.version) < 0) {
        updates.push({
          asset: id,
          fromVersion: version.version,
          toVersion: remoteVersion.version,
          size: remoteVersion.size
        });
      }
    }
    
    return updates;
  }
}
``` 