# Scene System API Documentation

## Overview
The Scene System provides the core functionality for managing game scenes, handling scene transitions, and managing the scene lifecycle. This document outlines the API for working with scenes in our game project.

## Core Components

### 1. Scene Base Class
The base class for all game scenes, extending Phaser.Scene.

```typescript
export abstract class BaseScene extends Phaser.Scene {
  constructor(config: Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  /**
   * Initialize scene data
   * @param data - Data passed to the scene
   */
  init(data?: any): void;

  /**
   * Preload scene assets
   */
  preload(): void;

  /**
   * Create scene objects and setup
   */
  create(): void;

  /**
   * Update scene logic
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void;
}
```

### 2. Scene Configuration
Configuration options for scene initialization.

```typescript
interface SceneConfig extends Phaser.Types.Scenes.SettingsConfig {
  /**
   * Custom scene configuration options
   */
  customOptions?: {
    /**
     * Whether to preload assets automatically
     */
    autoLoadAssets?: boolean;
    
    /**
     * Scene transition configuration
     */
    transitions?: SceneTransitionConfig;
    
    /**
     * Scene-specific services to initialize
     */
    services?: string[];
  };
}
```

### 3. Scene State Management
Methods for managing scene-specific state.

```typescript
interface SceneState<T = any> {
  /**
   * Get current scene state
   */
  getState(): T;

  /**
   * Update scene state
   * @param update - Partial state update
   */
  setState(update: Partial<T>): void;

  /**
   * Reset scene state to initial values
   */
  resetState(): void;
}
```

## Scene Lifecycle

### 1. Initialization
```typescript
class GameScene extends BaseScene {
  init(data?: any): void {
    // Initialize scene data
    this.initializeState(data);
    this.setupEventListeners();
  }
}
```

### 2. Asset Loading
```typescript
class GameScene extends BaseScene {
  preload(): void {
    // Load scene assets
    this.load.image('background', 'assets/background.png');
    this.load.audio('music', 'assets/music.mp3');
  }
}
```

### 3. Scene Setup
```typescript
class GameScene extends BaseScene {
  create(): void {
    // Set up scene objects
    this.createBackground();
    this.createUI();
    this.setupInput();
  }
}
```

### 4. Scene Update
```typescript
class GameScene extends BaseScene {
  update(time: number, delta: number): void {
    // Update scene logic
    this.updateEntities(delta);
    this.checkCollisions();
    this.updateUI();
  }
}
```

## Scene Transitions

### 1. Transition Configuration
```typescript
interface SceneTransitionConfig {
  /**
   * Transition duration in milliseconds
   */
  duration?: number;

  /**
   * Transition target scene key
   */
  target: string;

  /**
   * Data to pass to target scene
   */
  data?: any;

  /**
   * Transition effects configuration
   */
  effects?: TransitionEffects;
}
```

### 2. Transition Methods
```typescript
interface SceneTransitionManager {
  /**
   * Start scene transition
   * @param config - Transition configuration
   */
  transitionTo(config: SceneTransitionConfig): Promise<void>;

  /**
   * Add transition effects
   * @param effects - Effect configuration
   */
  addEffects(effects: TransitionEffects): void;
}
```

## Event System Integration

### 1. Scene Events
```typescript
enum SceneEvents {
  INIT = 'scene:init',
  PRELOAD = 'scene:preload',
  CREATE = 'scene:create',
  UPDATE = 'scene:update',
  PAUSE = 'scene:pause',
  RESUME = 'scene:resume',
  SLEEP = 'scene:sleep',
  WAKE = 'scene:wake',
  SHUTDOWN = 'scene:shutdown',
  DESTROY = 'scene:destroy'
}
```

### 2. Event Handling
```typescript
class GameScene extends BaseScene {
  setupEventListeners(): void {
    this.events.on(SceneEvents.PAUSE, this.handlePause);
    this.events.on(SceneEvents.RESUME, this.handleResume);
  }

  handlePause(): void {
    // Handle scene pause
  }

  handleResume(): void {
    // Handle scene resume
  }
}
```

## Service Integration

### 1. Scene Services
```typescript
interface SceneServices {
  /**
   * Get scene-specific service instance
   * @param serviceKey - Service identifier
   */
  getService<T>(serviceKey: string): T;

  /**
   * Register scene-specific service
   * @param serviceKey - Service identifier
   * @param service - Service instance
   */
  registerService<T>(serviceKey: string, service: T): void;
}
```

### 2. Service Usage
```typescript
class GameScene extends BaseScene {
  create(): void {
    const audioService = this.getService<AudioService>('audio');
    audioService.playBackgroundMusic();
  }
}
```

## Asset Management

### 1. Asset Loading
```typescript
interface SceneAssetLoader {
  /**
   * Load multiple assets
   * @param assets - Asset configurations
   */
  loadAssets(assets: AssetConfig[]): Promise<void>;

  /**
   * Track loading progress
   * @param callback - Progress callback
   */
  onProgress(callback: (progress: number) => void): void;
}
```

### 2. Asset Configuration
```typescript
interface AssetConfig {
  /**
   * Asset key
   */
  key: string;

  /**
   * Asset type (image, audio, etc.)
   */
  type: AssetType;

  /**
   * Asset URL or path
   */
  url: string;

  /**
   * Additional loading options
   */
  options?: any;
}
```

## Error Handling

### 1. Scene Error Types
```typescript
enum SceneErrorType {
  INITIALIZATION_ERROR = 'SCENE_INIT_ERROR',
  ASSET_LOAD_ERROR = 'ASSET_LOAD_ERROR',
  TRANSITION_ERROR = 'TRANSITION_ERROR',
  STATE_ERROR = 'STATE_ERROR'
}
```

### 2. Error Handling Methods
```typescript
interface SceneErrorHandler {
  /**
   * Handle scene-specific errors
   * @param error - Error instance
   */
  handleError(error: SceneError): void;

  /**
   * Recover from error state
   */
  recover(): Promise<void>;
}
```

## Best Practices

### 1. Scene Organization
- Keep scenes focused and single-purpose
- Use proper inheritance hierarchy
- Implement proper cleanup in shutdown/destroy
- Follow consistent naming conventions
- Document scene dependencies

### 2. State Management
- Use typed state objects
- Implement proper state persistence
- Handle state transitions gracefully
- Document state shape and updates
- Use immutable state patterns

### 3. Performance
- Optimize asset loading
- Implement proper cleanup
- Use scene pooling when appropriate
- Monitor memory usage
- Profile scene transitions

## Related Documentation
- [Scene Testing Guidelines](../../testing/unit/scenes.md)
- [Scene Manager API](../services/sprint1/scene-manager-api.md)
- [Testing Strategy Overview](../../testing/jest-testing-strategy.md) 