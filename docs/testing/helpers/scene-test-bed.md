# Scene Testing Utilities

## Overview
This document provides comprehensive documentation for the Scene Test Bed utility, which helps create controlled environments for testing Phaser.js scenes. It includes utilities for scene setup, state management, and interaction testing.

## Contents
- [Scene Test Bed](#scene-test-bed)
- [Scene State Management](#scene-state-management)
- [Scene Interaction Testing](#scene-interaction-testing)
- [Examples](#examples)

## Scene Test Bed

### Basic Implementation
```typescript
// tests/helpers/scene-test-bed.ts
export class SceneTestBed {
  private scene: Phaser.Scene;
  private mockGame: jest.Mocked<Phaser.Game>;
  
  constructor(SceneClass: typeof Phaser.Scene) {
    this.mockGame = {
      config: {
        width: 800,
        height: 600,
        type: Phaser.AUTO
      },
      scene: {
        add: jest.fn(),
        remove: jest.fn()
      }
    } as unknown as jest.Mocked<Phaser.Game>;
    
    this.scene = new SceneClass({
      game: this.mockGame,
      physics: {
        arcade: {
          gravity: { y: 300 }
        }
      }
    });
  }
  
  init(data?: any): void {
    this.scene.init(data);
  }
  
  preload(): void {
    this.scene.preload();
  }
  
  create(data?: any): void {
    this.scene.create(data);
  }
  
  update(time: number, delta: number): void {
    this.scene.update(time, delta);
  }
  
  getScene(): Phaser.Scene {
    return this.scene;
  }
  
  destroy(): void {
    this.scene.destroy();
  }
}
```

### Usage Example
```typescript
describe('GameScene', () => {
  let testBed: SceneTestBed;
  
  beforeEach(() => {
    testBed = new SceneTestBed(GameScene);
  });
  
  afterEach(() => {
    testBed.destroy();
  });
  
  test('should initialize correctly', () => {
    testBed.init();
    testBed.create();
    
    const scene = testBed.getScene();
    expect(scene.sys.settings.active).toBe(true);
  });
});
```

## Scene State Management

### State Tracking
```typescript
export class SceneStateTracker {
  private states: Map<string, any> = new Map();
  private eventLog: Array<{ event: string, data?: any }> = [];
  
  trackState(key: string, initialValue: any): void {
    this.states.set(key, initialValue);
  }
  
  updateState(key: string, value: any): void {
    this.states.set(key, value);
    this.eventLog.push({
      event: 'stateUpdate',
      data: { key, value }
    });
  }
  
  getState(key: string): any {
    return this.states.get(key);
  }
  
  getEventLog(): Array<{ event: string, data?: any }> {
    return [...this.eventLog];
  }
  
  reset(): void {
    this.states.clear();
    this.eventLog = [];
  }
}
```

### Integration with Test Bed
```typescript
export class EnhancedSceneTestBed extends SceneTestBed {
  private stateTracker: SceneStateTracker;
  
  constructor(SceneClass: typeof Phaser.Scene) {
    super(SceneClass);
    this.stateTracker = new SceneStateTracker();
  }
  
  trackGameState(key: string, initialValue: any): void {
    this.stateTracker.trackState(key, initialValue);
  }
  
  updateGameState(key: string, value: any): void {
    this.stateTracker.updateState(key, value);
  }
  
  getGameState(key: string): any {
    return this.stateTracker.getState(key);
  }
  
  getStateChanges(): Array<{ event: string, data?: any }> {
    return this.stateTracker.getEventLog();
  }
}
```

## Scene Interaction Testing

### Input Simulation
```typescript
export class SceneInputSimulator {
  constructor(private scene: Phaser.Scene) {}
  
  simulateKeyPress(key: string): void {
    const keyEvent = {
      keyCode: key.charCodeAt(0),
      key: key,
      preventDefault: jest.fn()
    };
    this.scene.input.keyboard.emit('keydown', keyEvent);
  }
  
  simulateKeyRelease(key: string): void {
    const keyEvent = {
      keyCode: key.charCodeAt(0),
      key: key,
      preventDefault: jest.fn()
    };
    this.scene.input.keyboard.emit('keyup', keyEvent);
  }
  
  simulatePointerDown(x: number, y: number): void {
    const pointer = {
      x,
      y,
      isDown: true,
      worldX: x,
      worldY: y
    };
    this.scene.input.emit('pointerdown', pointer);
  }
  
  simulatePointerUp(x: number, y: number): void {
    const pointer = {
      x,
      y,
      isDown: false,
      worldX: x,
      worldY: y
    };
    this.scene.input.emit('pointerup', pointer);
  }
}
```

## Examples

### Testing Scene Initialization
```typescript
describe('MainMenuScene', () => {
  let testBed: EnhancedSceneTestBed;
  
  beforeEach(() => {
    testBed = new EnhancedSceneTestBed(MainMenuScene);
    testBed.trackGameState('menuItems', []);
  });
  
  test('should initialize menu items', () => {
    testBed.init();
    testBed.create();
    
    const menuItems = testBed.getGameState('menuItems');
    expect(menuItems.length).toBeGreaterThan(0);
  });
});
```

### Testing Scene Interactions
```typescript
describe('PlayerInteractions', () => {
  let testBed: EnhancedSceneTestBed;
  let inputSimulator: SceneInputSimulator;
  
  beforeEach(() => {
    testBed = new EnhancedSceneTestBed(GameScene);
    inputSimulator = new SceneInputSimulator(testBed.getScene());
    testBed.trackGameState('playerPosition', { x: 0, y: 0 });
  });
  
  test('should move player right on arrow key press', () => {
    testBed.create();
    const initialX = testBed.getGameState('playerPosition').x;
    
    inputSimulator.simulateKeyPress('ArrowRight');
    testBed.update(0, 16); // Simulate one frame
    
    const newX = testBed.getGameState('playerPosition').x;
    expect(newX).toBeGreaterThan(initialX);
  });
});
```

### Testing Scene Transitions
```typescript
describe('SceneTransitions', () => {
  let testBed: EnhancedSceneTestBed;
  
  beforeEach(() => {
    testBed = new EnhancedSceneTestBed(GameScene);
    testBed.trackGameState('currentScene', 'game');
  });
  
  test('should transition to combat scene', () => {
    testBed.create();
    const scene = testBed.getScene();
    
    scene.events.emit('startCombat');
    
    const stateChanges = testBed.getStateChanges();
    expect(stateChanges).toContainEqual({
      event: 'stateUpdate',
      data: { key: 'currentScene', value: 'combat' }
    });
  });
});
```

## Best Practices

1. **Scene Setup**
   - Initialize test bed before each test
   - Clean up resources after each test
   - Track relevant game state
   - Mock external dependencies

2. **State Management**
   - Track only necessary state
   - Use meaningful state keys
   - Reset state between tests
   - Verify state changes

3. **Input Testing**
   - Simulate realistic input sequences
   - Test input combinations
   - Verify input handling
   - Test edge cases

4. **Scene Transitions**
   - Test transition triggers
   - Verify cleanup procedures
   - Test state preservation
   - Validate loading states

## Version Control
- Version: 1.0.0
- Last Updated: [Current Date]
- Status: Active 