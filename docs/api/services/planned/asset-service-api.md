# Asset Service API Documentation (Planned - Post Sprint 1)

## Version Information
- **Version**: v2.0.0-planned
- **Last Updated**: 2024-03-31
- **Status**: Planned
- **Authors**: Development Team
- **Target Implementation**: Post Sprint 1

## Overview
The `AssetService` is planned to be responsible for managing game assets and resources. It will provide a centralized system for loading, caching, and managing game assets including sprites, textures, audio files, and other game resources.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [TypeScript Standards](../standards/typescript.mdc)

## Core Interface

```typescript
import { 
  IGameService, 
  ServiceError,
  ServiceThreadError,
  ServiceStateError,
  IEventBus,
  GameEventMap
} from './types';

/**
 * Service responsible for managing game assets
 * @implements IGameService
 */
interface IAssetService extends IGameService {
  /**
   * Preload assets for a scene
   * @param scene Phaser Scene context
   * @param assets Array of asset definitions to load
   */
  preloadAssets(scene: Phaser.Scene, assets: Asset[]): void;
  
  /**
   * Check if an asset is loaded
   * @param key Asset key to check
   * @returns True if asset is loaded, false otherwise
   */
  isLoaded(key: string): boolean;
  
  /**
   * Clear cached assets no longer needed
   * @param keys Array of asset keys to clear
   */
  clearAssets(keys: string[]): void;
}

/**
 * Asset definition for loading
 */
interface Asset {
  /** Unique key for referencing the asset */
  key: string;
  
  /** Asset type (image, audio, spritesheet, etc.) */
  type: AssetType;
  
  /** URL to load the asset from */
  url: string;
  
  /** Additional metadata required by specific asset types */
  metadata?: AssetMetadata;
}

type AssetType = 'image' | 'audio' | 'spritesheet' | 'atlas' | 'video';

type AssetMetadata = {
  // Image metadata
  width?: number;
  height?: number;
  
  // Spritesheet metadata
  frameWidth?: number;
  frameHeight?: number;
  spacing?: number;
  margin?: number;
  startFrame?: number;
  endFrame?: number;
  
  // Atlas metadata
  atlasURL?: string;
  format?: 'JSON' | 'XML';
  
  // Audio metadata
  volume?: number;
  loop?: boolean;
  rate?: number;
  
  // Video metadata
  loadEvent?: 'loadeddata' | 'canplay' | 'canplaythrough';
  noAudio?: boolean;
  crossOrigin?: string;
};
```

## Usage Examples

### Basic Asset Loading
```typescript
class GameScene extends Phaser.Scene {
  private eventBus: IEventBus;
  private assetService: IAssetService;
  
  constructor() {
    super({ key: 'GameScene' });
    const registry = ServiceRegistry.getInstance();
    this.eventBus = registry.get<IEventBus>('eventBus');
    this.assetService = registry.get<IAssetService>('asset');
  }
  
  preload(): void {
    this.assetService.preloadAssets(this, [
      {
        key: 'player',
        type: 'spritesheet',
        url: 'assets/player.png',
        metadata: {
          frameWidth: 32,
          frameHeight: 32
        }
      },
      {
        key: 'background',
        type: 'image',
        url: 'assets/background.png'
      }
    ]);
    
    // Listen for load progress
    this.eventBus.on('resource.progress', (data: GameEventMap['resource.progress']) => {
      console.log(`Loading progress: ${data.progress}%`);
    });
  }
  
  create(): void {
    // Clean up event listeners
    this.eventBus.off('resource.progress', this.handleProgress);
  }
}
```

### Asset Management with Error Handling
```typescript
try {
  // Check if assets are loaded
  if (!this.assetService.isLoaded('player')) {
    throw new AssetNotFoundError('player');
  }
  
  // Clear unused assets
  this.assetService.clearAssets(['old_level', 'unused_music']);
  
  // Emit asset cleared event
  this.eventBus.emit('resource.cleared', {
    keys: ['old_level', 'unused_music'],
    timestamp: Date.now()
  });
} catch (error) {
  if (error instanceof AssetNotFoundError) {
    console.error(`Required asset not found: ${error.key}`);
    this.eventBus.emit('error', error);
  }
}
```

## Error Types

```typescript
/**
 * Error thrown when asset loading fails
 */
class AssetLoadError extends ServiceError {
  constructor(key: string, cause?: Error) {
    super(`Failed to load asset: ${key}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'AssetLoadError';
    this.cause = cause;
    this.key = key;
  }
  
  cause?: Error;
  key: string;
}

/**
 * Error thrown when trying to access an unloaded asset
 */
class AssetNotFoundError extends ServiceError {
  constructor(key: string) {
    super(`Asset not found: ${key}`);
    this.name = 'AssetNotFoundError';
    this.key = key;
  }
  
  key: string;
}
```

## Implementation Checklist
1. **Asset Management**
   - [ ] Implement efficient asset loading
   - [ ] Handle loading progress events
   - [ ] Manage asset cache properly
   - [ ] Support all required asset types

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Handle loading failures gracefully
   - [ ] Emit error events when appropriate
   - [ ] Validate asset metadata

3. **Event Communication**
   - [ ] Emit loading progress events
   - [ ] Emit completion events
   - [ ] Handle error events
   - [ ] Clean up event listeners

4. **Type Safety**
   - [ ] Use proper asset type definitions
   - [ ] Validate asset metadata
   - [ ] Ensure type-safe event handling
   - [ ] Implement proper error types

## Change History
- v2.0.0 (2024-03-31)
  - Added type-safe asset definitions
  - Improved error handling
  - Added event system integration
  - Enhanced metadata validation
- v1.0.0 (2024-03-01)
  - Initial implementation 

## Implementation Timeline
This service is planned for implementation after Sprint 1. The current documentation serves as a design specification for future implementation. 