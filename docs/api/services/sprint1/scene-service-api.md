# Scene Service API Documentation

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team

## Overview
The `SceneService` is responsible for managing scene transitions and scene lifecycle in the game. It provides a consistent interface for starting, stopping, and transitioning between game scenes.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [Asset Service API](./asset-service-api.md)
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
 * Service responsible for scene management
 * @implements IGameService
 */
interface ISceneService extends IGameService {
  /**
   * Register available scenes with the service
   * @param sceneMap Map of scene keys to scene classes
   */
  registerScenes(sceneMap: Record<string, typeof Phaser.Scene>): void;
  
  /**
   * Start a new scene
   * @param key Key of the scene to start
   * @param data Optional data to pass to the scene
   * @param options Scene start options
   * @throws SceneError if scene not found or cannot be started
   */
  startScene(key: string, data?: SceneData, options?: SceneStartOptions): void;
  
  /**
   * Transition between scenes with effects
   * @param from Key of the current scene
   * @param to Key of the target scene
   * @param data Optional data to pass to the target scene
   * @param transition Transition configuration
   * @throws SceneError if scenes not found or transition fails
   */
  transitionTo(from: string, to: string, data?: SceneData, transition?: TransitionConfig): void;
  
  /**
   * Get the currently active scene
   * @returns Key of the currently active scene
   */
  getCurrentScene(): string;
  
  /**
   * Pause a scene
   * @param key Key of the scene to pause
   * @throws SceneError if scene not found or cannot be paused
   */
  pauseScene(key: string): void;
  
  /**
   * Resume a paused scene
   * @param key Key of the scene to resume
   * @throws SceneError if scene not found or cannot be resumed
   */
  resumeScene(key: string): void;
}

/**
 * Options for starting a scene
 */
interface SceneStartOptions {
  /** Whether to start scene in parallel with current */
  additive?: boolean;
  
  /** Whether to start scene but keep it hidden */
  hidden?: boolean;
}

/**
 * Configuration for scene transitions
 */
interface TransitionConfig {
  /** Duration of the transition in milliseconds */
  duration: number;
  
  /** Type of transition effect */
  effect: TransitionEffect;
  
  /** Custom shader for transition (if effect is 'custom') */
  shader?: any;
  
  /** Direction for directional transitions */
  direction?: TransitionDirection;
  
  /** Color for fade transitions */
  color?: number;
}

type TransitionEffect = 'fade' | 'slide' | 'zoom' | 'custom';
type TransitionDirection = 'left' | 'right' | 'up' | 'down';
type SceneData = Record<string, unknown>;
```

## Usage Examples

### Basic Scene Management with Events
```typescript
class GameManager {
  private sceneService: ISceneService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.sceneService = registry.get<ISceneService>('scene');
    this.eventBus = registry.get<IEventBus>('eventBus');
    
    try {
      // Register available scenes
      this.sceneService.registerScenes({
        'menu': MenuScene,
        'game': GameScene,
        'pause': PauseScene
      });
      
      // Start with menu scene
      this.sceneService.startScene('menu');
      
      // Emit scene started event
      this.eventBus.emit('scene.started', {
        scene: 'menu',
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof SceneError) {
        console.error('Scene system error:', error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
}
```

### Scene Transitions with Error Handling
```typescript
class LevelManager {
  private sceneService: ISceneService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.sceneService = registry.get<ISceneService>('scene');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  async loadLevel(levelNumber: number): Promise<void> {
    try {
      const currentScene = this.sceneService.getCurrentScene();
      
      // Emit transition start event
      this.eventBus.emit('scene.transition.started', {
        from: currentScene,
        to: `level_${levelNumber}`,
        timestamp: Date.now()
      });
      
      // Transition to the new level
      await this.sceneService.transitionTo(
        currentScene,
        `level_${levelNumber}`,
        { levelData: this.getLevelData(levelNumber) },
        {
          duration: 1000,
          effect: 'fade',
          color: 0x000000
        }
      );
      
      // Emit transition complete event
      this.eventBus.emit('scene.transition.completed', {
        scene: `level_${levelNumber}`,
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof SceneTransitionError) {
        console.error(`Failed to load level ${levelNumber}:`, error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
}
```

## Error Types

```typescript
/**
 * Base error class for scene-related errors
 */
class SceneError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'SceneError';
  }
}

/**
 * Error thrown when a scene cannot be found
 */
class SceneNotFoundError extends SceneError {
  constructor(sceneKey: string) {
    super(`Scene not found: ${sceneKey}`);
    this.name = 'SceneNotFoundError';
    this.sceneKey = sceneKey;
  }
  
  sceneKey: string;
}

/**
 * Error thrown when a scene fails to load
 */
class SceneLoadError extends SceneError {
  constructor(sceneKey: string, cause?: Error) {
    super(`Failed to load scene: ${sceneKey}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'SceneLoadError';
    this.cause = cause;
    this.sceneKey = sceneKey;
  }
  
  cause?: Error;
  sceneKey: string;
}

/**
 * Error thrown when a scene transition fails
 */
class SceneTransitionError extends SceneError {
  constructor(fromScene: string, toScene: string, cause?: Error) {
    super(`Failed to transition from scene "${fromScene}" to "${toScene}"${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'SceneTransitionError';
    this.cause = cause;
    this.fromScene = fromScene;
    this.toScene = toScene;
  }
  
  cause?: Error;
  fromScene: string;
  toScene: string;
}
```

## Implementation Checklist
1. **Scene Management**
   - [ ] Implement efficient scene loading
   - [ ] Handle scene transitions
   - [ ] Manage scene lifecycle
   - [ ] Support parallel scenes

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Handle loading failures gracefully
   - [ ] Emit error events when appropriate
   - [ ] Validate scene configurations

3. **Event Communication**
   - [ ] Emit scene lifecycle events
   - [ ] Emit transition events
   - [ ] Handle error events
   - [ ] Clean up event listeners

4. **Resource Management**
   - [ ] Clean up scene resources
   - [ ] Handle memory management
   - [ ] Cache scene assets
   - [ ] Manage transition effects

## Change History
- v2.0.0 (2024-03-31)
  - Added type-safe scene configurations
  - Improved error handling
  - Added event system integration
  - Enhanced transition effects
- v1.0.0 (2024-03-01)
  - Initial implementation 