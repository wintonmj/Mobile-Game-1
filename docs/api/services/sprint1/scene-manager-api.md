# Scene Manager API Documentation

## Overview
The Scene Manager service provides centralized control over scene creation, transitions, and lifecycle management. It handles scene loading, unloading, and state management across the game.

## Service Registration

### 1. Service Configuration
```typescript
interface SceneManagerConfig {
  /**
   * Default scene transition options
   */
  defaultTransitions?: SceneTransitionConfig;

  /**
   * Scene loading options
   */
  loadingOptions?: {
    /**
     * Loading scene key
     */
    loadingSceneKey?: string;

    /**
     * Minimum loading screen duration
     */
    minimumLoadingTime?: number;
  };

  /**
   * Scene cache options
   */
  cacheOptions?: {
    /**
     * Maximum number of cached scenes
     */
    maxCachedScenes?: number;

    /**
     * Scene cache expiration time
     */
    cacheExpiration?: number;
  };
}
```

### 2. Service Registration
```typescript
class SceneManagerService implements IGameService {
  private static instance: SceneManagerService;

  public static getInstance(): SceneManagerService {
    if (!SceneManagerService.instance) {
      SceneManagerService.instance = new SceneManagerService();
    }
    return SceneManagerService.instance;
  }

  async init(config: SceneManagerConfig): Promise<void> {
    // Initialize scene manager
  }

  destroy(): void {
    // Cleanup resources
  }
}

// Register with service registry
ServiceRegistry.getInstance().register('sceneManager', SceneManagerService.getInstance());
```

## Core Functionality

### 1. Scene Management
```typescript
interface ISceneManager {
  /**
   * Add scene to manager
   * @param key - Scene identifier
   * @param scene - Scene instance or constructor
   */
  add(key: string, scene: typeof Phaser.Scene): void;

  /**
   * Start scene
   * @param key - Scene identifier
   * @param data - Initial scene data
   */
  start(key: string, data?: any): Promise<void>;

  /**
   * Stop scene
   * @param key - Scene identifier
   */
  stop(key: string): Promise<void>;

  /**
   * Pause scene
   * @param key - Scene identifier
   */
  pause(key: string): void;

  /**
   * Resume scene
   * @param key - Scene identifier
   */
  resume(key: string): void;
}
```

### 2. Scene Transitions
```typescript
interface ISceneTransitionManager {
  /**
   * Transition between scenes
   * @param from - Source scene key
   * @param to - Target scene key
   * @param config - Transition configuration
   */
  transition(from: string, to: string, config?: SceneTransitionConfig): Promise<void>;

  /**
   * Register transition effect
   * @param key - Effect identifier
   * @param effect - Transition effect implementation
   */
  registerEffect(key: string, effect: TransitionEffect): void;
}
```

### 3. Scene State Management
```typescript
interface ISceneStateManager {
  /**
   * Save scene state
   * @param key - Scene identifier
   * @param state - Scene state data
   */
  saveState(key: string, state: any): void;

  /**
   * Load scene state
   * @param key - Scene identifier
   */
  loadState(key: string): any;

  /**
   * Clear scene state
   * @param key - Scene identifier
   */
  clearState(key: string): void;
}
```

## Scene Loading System

### 1. Asset Preloading
```typescript
interface ISceneLoader {
  /**
   * Preload scene assets
   * @param key - Scene identifier
   */
  preloadScene(key: string): Promise<void>;

  /**
   * Track loading progress
   * @param callback - Progress callback
   */
  onLoadProgress(callback: (progress: number) => void): void;

  /**
   * Handle loading errors
   * @param callback - Error callback
   */
  onLoadError(callback: (error: Error) => void): void;
}
```

### 2. Scene Cache Management
```typescript
interface ISceneCacheManager {
  /**
   * Cache scene instance
   * @param key - Scene identifier
   * @param scene - Scene instance
   */
  cacheScene(key: string, scene: Phaser.Scene): void;

  /**
   * Get cached scene
   * @param key - Scene identifier
   */
  getCachedScene(key: string): Phaser.Scene | null;

  /**
   * Clear scene cache
   */
  clearCache(): void;
}
```

## Event System

### 1. Scene Manager Events
```typescript
enum SceneManagerEvents {
  SCENE_ADDED = 'sceneManager:sceneAdded',
  SCENE_STARTED = 'sceneManager:sceneStarted',
  SCENE_STOPPED = 'sceneManager:sceneStopped',
  TRANSITION_START = 'sceneManager:transitionStart',
  TRANSITION_COMPLETE = 'sceneManager:transitionComplete',
  LOAD_START = 'sceneManager:loadStart',
  LOAD_COMPLETE = 'sceneManager:loadComplete',
  LOAD_ERROR = 'sceneManager:loadError'
}
```

### 2. Event Handling
```typescript
interface ISceneManagerEvents {
  /**
   * Subscribe to scene manager events
   * @param event - Event type
   * @param handler - Event handler
   */
  on(event: SceneManagerEvents, handler: Function): void;

  /**
   * Unsubscribe from scene manager events
   * @param event - Event type
   * @param handler - Event handler
   */
  off(event: SceneManagerEvents, handler: Function): void;
}
```

## Error Handling

### 1. Scene Manager Errors
```typescript
enum SceneManagerErrorType {
  SCENE_NOT_FOUND = 'SCENE_NOT_FOUND',
  TRANSITION_FAILED = 'TRANSITION_FAILED',
  LOAD_FAILED = 'LOAD_FAILED',
  INVALID_STATE = 'INVALID_STATE'
}

class SceneManagerError extends Error {
  constructor(type: SceneManagerErrorType, message: string) {
    super(message);
    this.name = type;
  }
}
```

### 2. Error Recovery
```typescript
interface ISceneManagerRecovery {
  /**
   * Handle scene manager errors
   * @param error - Error instance
   */
  handleError(error: SceneManagerError): void;

  /**
   * Recover from error state
   */
  recover(): Promise<void>;
}
```

## Performance Optimization

### 1. Scene Pooling
```typescript
interface IScenePool {
  /**
   * Get scene from pool
   * @param key - Scene identifier
   */
  acquire(key: string): Phaser.Scene;

  /**
   * Return scene to pool
   * @param scene - Scene instance
   */
  release(scene: Phaser.Scene): void;
}
```

### 2. Memory Management
```typescript
interface ISceneMemoryManager {
  /**
   * Monitor scene memory usage
   * @param scene - Scene instance
   */
  monitorMemory(scene: Phaser.Scene): void;

  /**
   * Clean up unused resources
   */
  cleanup(): void;
}
```

## Usage Examples

### 1. Basic Scene Management
```typescript
// Get scene manager instance
const sceneManager = ServiceRegistry.getInstance().get<SceneManagerService>('sceneManager');

// Add and start scene
sceneManager.add('mainMenu', MainMenuScene);
await sceneManager.start('mainMenu', { level: 1 });

// Transition to game scene
await sceneManager.transition('mainMenu', 'game', {
  duration: 1000,
  effect: 'fade'
});
```

### 2. Scene State Management
```typescript
// Save scene state
sceneManager.saveState('game', {
  playerPosition: { x: 100, y: 200 },
  score: 1000
});

// Load scene state
const gameState = sceneManager.loadState('game');
```

### 3. Event Handling
```typescript
// Subscribe to scene events
sceneManager.on(SceneManagerEvents.TRANSITION_COMPLETE, (from: string, to: string) => {
  console.log(`Transitioned from ${from} to ${to}`);
});
```

## Best Practices

### 1. Scene Management
- Use descriptive scene keys
- Implement proper scene cleanup
- Handle scene dependencies appropriately
- Cache frequently used scenes
- Monitor scene memory usage

### 2. Transitions
- Use appropriate transition effects
- Handle transition errors gracefully
- Clean up resources after transitions
- Avoid long transition chains
- Implement transition cancellation

### 3. State Management
- Use typed state objects
- Implement state validation
- Handle state persistence properly
- Clear unused state data
- Document state structure

## Related Documentation
- [Scene System API](../../scenes/scene-system.md)
- [Scene Testing Guidelines](../../../testing/unit/scenes.md)
- [Testing Strategy Overview](../../../testing/jest-testing-strategy.md) 