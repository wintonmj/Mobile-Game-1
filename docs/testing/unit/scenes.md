# Scene Testing Guidelines

## Overview
This document outlines the testing standards and patterns for Phaser scenes in our game project. It provides comprehensive guidance for testing scene lifecycle, state management, asset loading, and event handling patterns.

## Scene Testing Fundamentals

### 1. Scene Lifecycle Testing
- Test scene initialization and setup
- Verify proper preload handling
- Test scene creation and destruction
- Validate scene transitions
- Test scene data persistence

```typescript
describe('MainMenuScene', () => {
  let scene: MainMenuScene;
  
  beforeEach(() => {
    scene = new MainMenuScene();
  });

  describe('lifecycle', () => {
    test('should initialize with correct scene key', () => {
      expect(scene.scene.key).toBe('MainMenu');
    });

    test('should load required assets in preload', () => {
      const loadSpy = jest.spyOn(scene.load, 'image');
      scene.preload();
      expect(loadSpy).toHaveBeenCalledWith('logo', 'assets/logo.png');
    });

    test('should set up UI elements in create', () => {
      scene.create();
      expect(scene.add.text).toHaveBeenCalled();
    });
  });
});
```

### 2. State Management Testing
- Test scene-specific state initialization
- Verify state transitions within scenes
- Test state persistence between scenes
- Validate state recovery mechanisms
- Test state synchronization with game systems

```typescript
describe('GameplayScene State Management', () => {
  let scene: GameplayScene;
  
  beforeEach(() => {
    scene = new GameplayScene();
  });

  test('should initialize with default state', () => {
    expect(scene.gameState).toEqual({
      score: 0,
      level: 1,
      playerHealth: 100
    });
  });

  test('should update state on game events', () => {
    scene.handleScoreUpdate(50);
    expect(scene.gameState.score).toBe(50);
  });
});
```

### 3. Asset Loading Testing
- Test asset preloading functionality
- Verify loading progress tracking
- Test error handling during asset loading
- Validate asset cleanup on scene destruction
- Test dynamic asset loading

```typescript
describe('Scene Asset Loading', () => {
  let scene: GameScene;
  
  beforeEach(() => {
    scene = new GameScene();
  });

  test('should track loading progress', () => {
    const progressCallback = jest.fn();
    scene.load.on('progress', progressCallback);
    scene.preload();
    expect(progressCallback).toHaveBeenCalled();
  });

  test('should handle loading errors gracefully', () => {
    const errorCallback = jest.fn();
    scene.load.on('loaderror', errorCallback);
    scene.load.image('missing', 'nonexistent.png');
    expect(errorCallback).toHaveBeenCalled();
  });
});
```

### 4. Event Handling Testing
- Test scene-specific event listeners
- Verify event emission and handling
- Test event cleanup on scene destruction
- Validate event propagation between scenes
- Test input event handling

```typescript
describe('Scene Event Handling', () => {
  let scene: BattleScene;
  
  beforeEach(() => {
    scene = new BattleScene();
  });

  test('should handle player input events', () => {
    const attackHandler = jest.fn();
    scene.input.keyboard.on('keydown-SPACE', attackHandler);
    scene.simulateKeyPress('SPACE');
    expect(attackHandler).toHaveBeenCalled();
  });

  test('should clean up event listeners on shutdown', () => {
    scene.events.emit('shutdown');
    expect(scene.input.keyboard.listeners('keydown-SPACE')).toHaveLength(0);
  });
});
```

## Testing Best Practices

### 1. Scene Isolation
- Mock dependencies and external systems
- Use scene test bed utilities
- Reset scene state between tests
- Mock Phaser systems appropriately
- Use consistent scene configuration

### 2. Performance Testing
- Test scene initialization performance
- Monitor memory usage during scene lifecycle
- Test asset loading performance
- Verify render performance
- Test scene transition performance

### 3. Integration Testing
- Test scene communication
- Verify data passing between scenes
- Test plugin integration
- Validate service integration
- Test scene manager interaction

## Common Testing Patterns

### 1. Scene Setup Pattern
```typescript
function createTestScene(config = {}) {
  return new TestScene({
    ...defaultTestConfig,
    ...config
  });
}
```

### 2. Asset Loading Pattern
```typescript
function mockAssetLoader(scene: Scene) {
  return {
    image: jest.fn(),
    audio: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  };
}
```

### 3. Event Testing Pattern
```typescript
function createEventSpy(scene: Scene, eventName: string) {
  const spy = jest.fn();
  scene.events.on(eventName, spy);
  return spy;
}
```

## Related Documentation
- [Scene System API Documentation](../api/scenes/scene-system.md)
- [Scene Manager API Documentation](../api/services/sprint1/scene-manager-api.md)
- [Testing Strategy Overview](../jest-testing-strategy.md)
- [Test Implementation Details](../test-implementation-details.md) 