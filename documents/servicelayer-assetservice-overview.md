# Asset Service Overview

## Problem Statement

Our mobile game architecture currently suffers from several asset management challenges:

1. **Decentralized Asset Loading** - Assets are loaded in multiple scenes without coordination
2. **Duplicate Asset Loading** - The same assets are loaded multiple times across different scenes
3. **Inconsistent Error Handling** - Missing assets are handled differently across the codebase
4. **Poor Loading Performance** - Assets are loaded in inefficient sequences without prioritization
5. **Manual Asset Tracking** - No systematic way to track asset usage and optimize bundle size
6. **Inconsistent Caching** - Some assets are cached while others are repeatedly loaded
7. **Limited Progress Feedback** - Loading progress is difficult to monitor and report to players

## Solution Approach

The AssetService will provide a centralized, robust asset management system that addresses these challenges through:

1. **Unified Asset Registry** - Single source of truth for all game assets
2. **Smart Caching System** - Intelligent asset retention based on usage patterns
3. **Prioritized Loading** - Asset loading based on importance and dependencies
4. **Memory Management** - Proactive monitoring and optimization of memory usage
5. **Event-Based Communication** - Real-time status updates via EventBusService

This service will provide game developers with a simple, consistent API for asset operations while handling complex memory management logic internally.

## Component Design

### Core Components

1. **Asset Registry** - Maintains metadata for all registered assets
2. **Loading Manager** - Handles prioritized loading and progress tracking
3. **Cache Manager** - Implements retention policies and memory optimization
4. **Event System** - Provides status updates and monitoring capabilities
5. **Group Manager** - Supports logical grouping of related assets

### Key Interfaces

```typescript
export interface IAssetService {
  // Asset registration and discovery
  registerAsset(key: string, path: string, type: AssetType, options?: AssetOptions): void;
  registerMultiple(assets: AssetDefinition[]): void;
  
  // Asset loading
  preload(keys: string[], onProgress?: (progress: number) => void): Promise<void>;
  loadAsset(key: string): Promise<any>;
  
  // Asset retrieval
  getTexture(key: string): Phaser.Textures.Texture;
  getAudio(key: string): Phaser.Sound.BaseSound;
  getJSON(key: string): any;
  
  // Memory management
  getMemoryUsage(): MemoryUsageData;
  enableMemoryMonitoring(interval?: number): void;
  pruneCache(targetSize?: number): CachePrunedData;
  
  // Group operations
  createGroup(groupId: string, assetKeys: string[]): void;
  loadGroup(groupId: string, onProgress?: (progress: number) => void): Promise<void>;
  
  // Event system
  subscribe<K extends keyof AssetEventMap>(eventName: K, callback: (data: AssetEventMap[K]) => void): Subscription | null;
}
```

The service works with the following primary types:

```typescript
export enum AssetType {
  IMAGE = 'image',
  SPRITE_SHEET = 'spritesheet',
  ATLAS = 'atlas',
  AUDIO = 'audio',
  JSON = 'json',
  BITMAP_FONT = 'bitmapFont',
  VIDEO = 'video',
  TILEMAP = 'tilemap',
  HTML = 'html',
  SHADER = 'shader'
}

export interface AssetDefinition {
  key: string;
  path: string;
  type: AssetType;
  options?: AssetOptions;
}

/**
 * Configuration options for different asset types
 */
export interface AssetOptions {
  // Common options
  priority?: number;         // Loading priority (higher = loaded sooner)
  retryCount?: number;       // Number of load retries on failure
  cachePolicy?: CachePolicy; // How this asset should be cached
  
  // Type-specific options
  // For SPRITE_SHEET
  frameWidth?: number;
  frameHeight?: number;
  frameMax?: number;
  frameStart?: number;
  
  // For ATLAS
  atlasURL?: string;
  atlasFormat?: string;
  
  // For AUDIO
  audioRate?: number;
  loop?: boolean;
  
  // For TILEMAP
  tilemapDataURL?: string;
  tilemapFormat?: string;
}

/**
 * Cache retention policy for assets
 */
export enum CachePolicy {
  PERMANENT = 'permanent',   // Never remove from cache
  SESSION = 'session',       // Keep for entire game session
  LEVEL = 'level',           // Keep while level is active
  TEMPORARY = 'temporary',   // Remove as soon as memory pressure exists
  CUSTOM = 'custom'          // Custom handling (requires callback)
}

/**
 * Memory usage statistics returned by getMemoryUsage()
 */
export interface MemoryUsageData {
  totalBytes: number;         // Estimated total memory usage in bytes
  textureBytes: number;       // Memory used by textures
  audioBytes: number;         // Memory used by audio assets
  jsonBytes: number;          // Memory used by JSON data
  otherBytes: number;         // Memory used by other asset types
  assetCount: {               // Count of assets by type
    [key in AssetType]?: number;
  };
  thresholdWarnings: {        // Memory threshold warnings
    exceededThreshold: boolean;
    currentPercentage: number;
    recommendedAction?: string;
  };
}

/**
 * Data returned after cache pruning operation
 */
export interface CachePrunedData {
  bytesBefore: number;        // Memory usage before pruning
  bytesAfter: number;         // Memory usage after pruning
  bytesFreed: number;         // Total bytes freed
  assetsRemoved: number;      // Number of assets removed
  removedAssets: string[];    // Keys of assets that were removed
  assetsByType: {             // Assets removed by type
    [key in AssetType]?: string[];
  };
}

/**
 * Event map for asset service events
 */
export interface AssetEventMap {
  'asset:registered': {
    key: string;
    type: AssetType;
  };
  'asset:load:start': {
    key: string;
    type: AssetType;
  };
  'asset:load:complete': {
    key: string;
    type: AssetType;
    duration: number;    // Load time in ms
  };
  'asset:load:error': {
    key: string;
    type: AssetType;
    error: string;
    retryCount: number;
  };
  'asset:load:progress': {
    progress: number;    // 0-1 value
    loaded: number;      // Number of assets loaded
    total: number;       // Total assets to load
  };
  'asset:memory:warning': {
    currentUsage: number;
    threshold: number;
    percentageUsed: number;
  };
  'asset:cache:pruned': CachePrunedData;
  'asset:group:created': {
    groupId: string;
    assetCount: number;
  };
  'asset:group:load:complete': {
    groupId: string;
    duration: number;
  };
}

/**
 * Subscription object returned by event subscriptions
 */
export interface Subscription {
  unsubscribe: () => void;    // Function to cancel the subscription
  id: string;                 // Unique identifier for the subscription
}
```

## Test-Driven Development Approach

### Test Categories

1. **Asset Registration Tests**
   - Verify asset metadata storage
   - Validate registration parameters
   - Test bulk registration capabilities

2. **Asset Loading Tests**
   - Test loading individual and grouped assets
   - Verify progress tracking accuracy
   - Test error handling and recovery

3. **Memory Management Tests**
   - Test memory usage monitoring
   - Verify threshold warnings function
   - Test cache pruning strategies

4. **Event System Tests**
   - Verify event emission during operations
   - Test subscription mechanism
   - Validate event payload structures

5. **Integration Tests**
   - Test integration with EventBusService
   - Verify Phaser scene integration
   - Test parallel loading operations

## Integration Points

### 1. Service Layer Integration

The AssetService integrates with these services:

1. **EventBusService** - For publishing asset operation events
   - Uses typed event definitions for compile-time safety
   - Implements graceful fallback when unavailable

2. **LoggerService** - For detailed logging of asset operations
   - Logs asset loading errors
   - Records performance metrics

3. **ConfigurationService** - For loading asset configuration
   - Retrieves asset paths and options
   - Loads environment-specific settings

4. **ObjectPoolService** - For reusable game objects
   - Provides asset references for pool initialization
   - Manages texture reuse for particles

### 2. Phaser Integration

The AssetService wraps Phaser's loading and caching systems:

- Uses Phaser's loaders for each asset type
- Monitors Phaser's internal events for load completion
- Leverages Phaser's texture manager for memory calculations
- Integrates with Phaser's scene lifecycle

## Implementation Plan

### Phase 1: Core Framework (Days 1-3)
1. **Asset Registry (Day 1)** - Begin with the registration system as it's the foundation for all other components
   - Define core interfaces (AssetOptions, CachePolicy, AssetEventMap)
   - Implement asset metadata storage structure
   - Create registration validation logic
   - Build bulk registration capabilities
   - *Rationale*: The registry is a prerequisite for tracking assets through their lifecycle, and well-defined interfaces ensure type safety

2. **Basic Loading System (Day 2)** - Build the essential loading mechanisms
   - Implement Phaser loader integration
   - Create promise-based loading interface
   - Build basic error handling
   - Define Subscription interface for event handling
   - *Rationale*: Loading is the next critical piece after registration and enables basic functionality

3. **Event Foundation (Day 3)** - Set up the event system for status reporting
   - Create EventBusService integration
   - Implement core event types and payloads
   - Build fallback mechanisms for when EventBus is unavailable
   - *Rationale*: The event system enables monitoring and will be needed by all subsequent components

### Phase 2: Advanced Features (Days 4-7)
1. **Group Management (Day 4)** - Enable logical asset organization
   - Implement group creation and storage
   - Build group loading with dependencies
   - Create progress tracking for groups
   - *Rationale*: Groups depend on the core loading system but are needed before memory management

2. **Memory Monitoring (Day 5-6)** - Build the observability layer
   - Define MemoryUsageData interface for consistent reporting
   - Implement memory usage calculation
   - Create threshold-based warnings
   - Build monitoring interval system
   - *Rationale*: Memory monitoring is needed before optimization can be implemented effectively

3. **Cache Optimization (Day 7)** - Implement intelligent caching strategies
   - Define CachePrunedData interface for pruning operations
   - Create LRU (Least Recently Used) algorithm
   - Implement size-based pruning
   - Build hybrid optimization approach
   - *Rationale*: Cache optimization builds on both memory monitoring and asset usage patterns

### Phase 3: Integration & Testing (Days 8-11)
1. **Service Integration (Day 8)** - Connect with the broader system
   - Integrate with ConfigurationService
   - Connect with LoggerService
   - Link with ObjectPoolService
   - *Rationale*: Service integration comes after core functionality is complete

2. **Comprehensive Testing (Days 9-10)** - Ensure reliability
   - Implement unit tests for all components
   - Create integration tests for service interactions
   - Build performance tests for optimization strategies
   - *Rationale*: Thorough testing follows implementation but precedes documentation

3. **Documentation & Examples (Day 11)** - Enable developer adoption
   - Create usage documentation
   - Build example implementations
   - Provide performance recommendations
   - *Rationale*: Documentation is the final step to ensure proper usage by the team

This phased approach ensures that each component builds upon a stable foundation, with dependencies properly satisfied, while providing incremental value throughout the implementation process.

## Key Benefits

1. **Performance Improvements**
   - Reduced load times through intelligent caching
   - Lower memory usage through asset lifecycle management
   - Fewer GC pauses from optimized asset handling

2. **Developer Experience**
   - Simple, consistent API for asset operations
   - Comprehensive monitoring and debugging tools
   - Reduced boilerplate code in game scenes

3. **Player Experience**
   - Faster loading screens with accurate progress indicators
   - Smoother gameplay with fewer loading hitches
   - Lower memory usage on resource-constrained devices

## Implementation Status

**Planned** - Design complete, implementation scheduled for Phase 2

## Related Documents

- [Asset Service Detailed Design](ServiceLayer-AssetService.md) - Complete implementation details
- [Service Layer Overview](ServiceLayer-Overview.md) - Architecture context
- [Event Bus Service](ServiceLayer-EventBusService.md) - Event system integration 