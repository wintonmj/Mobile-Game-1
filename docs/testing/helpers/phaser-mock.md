# Phaser.js Mocking Utilities

## Overview
This document provides comprehensive documentation for mocking Phaser.js components in unit tests. These utilities help create isolated test environments for game components that depend on Phaser.js functionality.

## Contents
- [Mock Factories](#mock-factories)
- [Scene Mocking](#scene-mocking)
- [Game Object Mocking](#game-object-mocking)
- [Input Mocking](#input-mocking)
- [Examples](#examples)

## Mock Factories

### Scene Factory
```typescript
// tests/helpers/factories/scene.factory.ts
export function createMockScene(config: Partial<SceneConfig> = {}): jest.Mocked<Phaser.Scene> {
  return {
    add: {
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis()
      }),
      text: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis()
      })
    },
    physics: {
      add: {
        sprite: jest.fn().mockReturnValue({
          setVelocity: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis()
        })
      }
    },
    input: {
      keyboard: {
        addKey: jest.fn().mockReturnValue({
          isDown: false,
          on: jest.fn()
        })
      }
    },
    events: {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn()
    },
    ...config
  } as unknown as jest.Mocked<Phaser.Scene>;
}
```

### Game Object Factory
```typescript
export function createMockGameObject(config: Partial<GameObject> = {}): jest.Mocked<GameObject> {
  return {
    x: 0,
    y: 0,
    setPosition: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    ...config
  } as unknown as jest.Mocked<GameObject>;
}
```

## Scene Mocking

### Basic Scene Mock
```typescript
describe('GameScene', () => {
  let scene: jest.Mocked<Phaser.Scene>;
  
  beforeEach(() => {
    scene = createMockScene();
  });
  
  test('should create player sprite', () => {
    const gameScene = new GameScene();
    gameScene.create.call(scene);
    
    expect(scene.add.sprite).toHaveBeenCalledWith(0, 0, 'player');
  });
});
```

### Scene with Physics
```typescript
describe('Physics Integration', () => {
  test('should setup physics for player', () => {
    const scene = createMockScene({
      physics: {
        add: {
          sprite: jest.fn().mockReturnValue({
            setVelocity: jest.fn().mockReturnThis(),
            setBounce: jest.fn().mockReturnThis(),
            setCollideWorldBounds: jest.fn().mockReturnThis()
          })
        }
      }
    });
    
    const gameScene = new GameScene();
    gameScene.create.call(scene);
    
    expect(scene.physics.add.sprite).toHaveBeenCalled();
  });
});
```

## Game Object Mocking

### Sprite Mocking
```typescript
export function createMockSprite(config: Partial<Phaser.GameObjects.Sprite> = {}): jest.Mocked<Phaser.GameObjects.Sprite> {
  return {
    x: 0,
    y: 0,
    setTexture: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    ...config
  } as unknown as jest.Mocked<Phaser.GameObjects.Sprite>;
}
```

### Text Object Mocking
```typescript
export function createMockText(config: Partial<Phaser.GameObjects.Text> = {}): jest.Mocked<Phaser.GameObjects.Text> {
  return {
    setText: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    ...config
  } as unknown as jest.Mocked<Phaser.GameObjects.Text>;
}
```

## Input Mocking

### Keyboard Input
```typescript
export function createMockKeyboard(): jest.Mocked<Phaser.Input.Keyboard.KeyboardPlugin> {
  return {
    addKey: jest.fn().mockReturnValue({
      isDown: false,
      on: jest.fn(),
      off: jest.fn()
    }),
    createCursorKeys: jest.fn().mockReturnValue({
      up: { isDown: false },
      down: { isDown: false },
      left: { isDown: false },
      right: { isDown: false }
    }),
    on: jest.fn(),
    off: jest.fn()
  } as unknown as jest.Mocked<Phaser.Input.Keyboard.KeyboardPlugin>;
}
```

### Touch Input
```typescript
export function createMockPointer(): jest.Mocked<Phaser.Input.Pointer> {
  return {
    x: 0,
    y: 0,
    isDown: false,
    getDuration: jest.fn().mockReturnValue(0),
    getDistance: jest.fn().mockReturnValue(0),
    getAngle: jest.fn().mockReturnValue(0),
    ...config
  } as unknown as jest.Mocked<Phaser.Input.Pointer>;
}
```

## Examples

### Testing Player Movement
```typescript
describe('Player Movement', () => {
  let scene: jest.Mocked<Phaser.Scene>;
  let player: jest.Mocked<Phaser.GameObjects.Sprite>;
  
  beforeEach(() => {
    player = createMockSprite();
    scene = createMockScene({
      add: {
        sprite: jest.fn().mockReturnValue(player)
      }
    });
  });
  
  test('should move player right', () => {
    const playerController = new PlayerController(scene);
    const keyboard = createMockKeyboard();
    keyboard.createCursorKeys().right.isDown = true;
    
    playerController.update();
    
    expect(player.setPosition).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number)
    );
  });
});
```

### Testing Scene Transitions
```typescript
describe('Scene Transitions', () => {
  test('should transition to new scene', () => {
    const scene = createMockScene();
    const sceneManager = new SceneManager(scene);
    
    sceneManager.transitionTo('combat');
    
    expect(scene.events.emit).toHaveBeenCalledWith(
      'sceneTransition',
      expect.objectContaining({
        from: expect.any(String),
        to: 'combat'
      })
    );
  });
});
```

## Best Practices

1. **Mock Creation**
   - Create minimal viable mocks
   - Only mock what's necessary
   - Use type-safe mocks
   - Keep mock implementations simple

2. **Scene Testing**
   - Mock only required scene components
   - Test scene lifecycle methods
   - Verify event handling
   - Test scene transitions

3. **Game Object Testing**
   - Test object creation and destruction
   - Verify property updates
   - Test event handling
   - Validate object interactions

4. **Input Testing**
   - Test input state changes
   - Verify input event handling
   - Test input combinations
   - Validate input cleanup

## Version Control
- Version: 1.0.0
- Last Updated: [Current Date]
- Status: Active 