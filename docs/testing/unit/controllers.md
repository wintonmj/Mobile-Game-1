# Controller Testing Guide

## Overview
This document provides comprehensive guidance for testing game controllers in our TypeScript-based RPG project. It covers testing strategies for input handling, state management, and scene control.

## Contents
- [Controller Testing Principles](#controller-testing-principles)
- [Test Organization](#test-organization)
- [Input Testing](#input-testing)
- [State Management Testing](#state-management-testing)
- [Scene Control Testing](#scene-control-testing)
- [Examples](#examples)

## Controller Testing Principles

### Core Principles
1. Test input handling and validation
2. Verify controller state management
3. Test scene transitions and updates
4. Validate event handling
5. Test error conditions and edge cases

### Test Coverage Requirements
- Controller logic requires 80% line coverage
- Focus on user interaction flows
- Test both success and failure paths
- Verify proper cleanup on scene transitions

## Test Organization

### File Structure
```
tests/unit/controllers/
├── player-controller.test.ts
├── game-controller.test.ts
├── scene-controller.test.ts
└── helpers/
    ├── input-mock.ts
    └── scene-mock.ts
```

### Test Suite Organization
```typescript
describe('PlayerController', () => {
  describe('input handling', () => {
    // Input processing tests
  });

  describe('movement', () => {
    // Movement logic tests
  });

  describe('actions', () => {
    // Action handling tests
  });

  describe('state updates', () => {
    // State management tests
  });
});
```

## Input Testing

### Keyboard Input
```typescript
describe('Keyboard Input', () => {
  let controller: PlayerController;
  let inputManager: InputManager;
  
  beforeEach(() => {
    inputManager = new InputManager();
    controller = new PlayerController(inputManager);
  });

  test('should handle movement keys', () => {
    // Simulate key press
    inputManager.emit('keydown', { key: 'ArrowRight' });
    
    expect(controller.movementVector.x).toBe(1);
    expect(controller.movementVector.y).toBe(0);
  });

  test('should handle multiple keys pressed', () => {
    // Simulate multiple keys
    inputManager.emit('keydown', { key: 'ArrowRight' });
    inputManager.emit('keydown', { key: 'ArrowUp' });
    
    expect(controller.movementVector.x).toBe(1);
    expect(controller.movementVector.y).toBe(-1);
  });

  test('should reset movement on key release', () => {
    // Press and release
    inputManager.emit('keydown', { key: 'ArrowRight' });
    inputManager.emit('keyup', { key: 'ArrowRight' });
    
    expect(controller.movementVector.x).toBe(0);
  });
});
```

### Touch Input
```typescript
describe('Touch Input', () => {
  test('should handle touch start', () => {
    const touch = {
      identifier: 1,
      clientX: 100,
      clientY: 100
    };
    
    controller.handleTouchStart({ touches: [touch] });
    
    expect(controller.touchStartPosition).toEqual({
      x: 100,
      y: 100
    });
  });

  test('should calculate touch movement delta', () => {
    // Start touch
    controller.handleTouchStart({
      touches: [{ identifier: 1, clientX: 100, clientY: 100 }]
    });
    
    // Move touch
    controller.handleTouchMove({
      touches: [{ identifier: 1, clientX: 150, clientY: 120 }]
    });
    
    expect(controller.movementVector).toEqual({
      x: 0.5, // Normalized delta
      y: 0.2
    });
  });
});
```

## State Management Testing

### Controller State
```typescript
describe('Controller State', () => {
  test('should track active input method', () => {
    // Keyboard input
    inputManager.emit('keydown', { key: 'ArrowRight' });
    expect(controller.activeInputMethod).toBe('keyboard');
    
    // Touch input
    controller.handleTouchStart({
      touches: [{ identifier: 1, clientX: 100, clientY: 100 }]
    });
    expect(controller.activeInputMethod).toBe('touch');
  });

  test('should maintain action states', () => {
    // Trigger action
    inputManager.emit('keydown', { key: 'Space' });
    
    expect(controller.isJumping).toBe(true);
    
    // Action cooldown
    jest.advanceTimersByTime(500);
    expect(controller.isJumping).toBe(false);
  });
});
```

### Scene Control
```typescript
describe('Scene Control', () => {
  test('should handle scene transitions', () => {
    const sceneManager = new SceneManager();
    controller.handleSceneTransition('combat');
    
    expect(sceneManager.currentScene).toBe('combat');
    expect(controller.isInputEnabled).toBe(false);
  });

  test('should cleanup on scene exit', () => {
    const cleanup = jest.spyOn(controller, 'cleanup');
    
    controller.handleSceneExit();
    
    expect(cleanup).toHaveBeenCalled();
    expect(controller.movementVector).toEqual({ x: 0, y: 0 });
  });
});
```

## Examples

### Complete Controller Test Suite
```typescript
import { PlayerController } from '../../../src/controllers/player.controller';
import { InputManager } from '../../../src/core/input.manager';
import { Vector2 } from '../../../src/types/vector2';

describe('PlayerController', () => {
  let controller: PlayerController;
  let inputManager: InputManager;
  let mockPlayer: jest.Mocked<Player>;
  
  beforeEach(() => {
    jest.useFakeTimers();
    inputManager = new InputManager();
    mockPlayer = createMockPlayer();
    controller = new PlayerController(inputManager, mockPlayer);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('movement handling', () => {
    test('should update player position based on input', () => {
      // Simulate right movement
      inputManager.emit('keydown', { key: 'ArrowRight' });
      
      controller.update(16); // 16ms frame
      
      expect(mockPlayer.setPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: 0
        })
      );
    });
    
    test('should handle diagonal movement', () => {
      // Simulate diagonal movement
      inputManager.emit('keydown', { key: 'ArrowRight' });
      inputManager.emit('keydown', { key: 'ArrowDown' });
      
      controller.update(16);
      
      const lastCall = mockPlayer.setPosition.mock.lastCall[0];
      expect(Vector2.magnitude(lastCall)).toBeCloseTo(1);
    });
  });
  
  describe('action handling', () => {
    test('should trigger player actions', () => {
      // Simulate action key
      inputManager.emit('keydown', { key: 'Space' });
      
      expect(mockPlayer.performAction).toHaveBeenCalledWith('jump');
    });
    
    test('should respect action cooldowns', () => {
      // First action
      inputManager.emit('keydown', { key: 'Space' });
      expect(mockPlayer.performAction).toHaveBeenCalledTimes(1);
      
      // Attempt action during cooldown
      inputManager.emit('keydown', { key: 'Space' });
      expect(mockPlayer.performAction).toHaveBeenCalledTimes(1);
      
      // After cooldown
      jest.advanceTimersByTime(1000);
      inputManager.emit('keydown', { key: 'Space' });
      expect(mockPlayer.performAction).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('state management', () => {
    test('should handle player state changes', () => {
      // Trigger state change
      mockPlayer.state = 'stunned';
      controller.update(16);
      
      expect(controller.isInputEnabled).toBe(false);
    });
    
    test('should resume input after state clear', () => {
      mockPlayer.state = 'stunned';
      controller.update(16);
      
      mockPlayer.state = 'normal';
      controller.update(16);
      
      expect(controller.isInputEnabled).toBe(true);
    });
  });
});
```

## Best Practices

1. **Input Testing**
   - Mock input events and managers
   - Test input combinations
   - Verify input state tracking
   - Test input method switching

2. **State Management**
   - Test state transitions
   - Verify state cleanup
   - Test state persistence
   - Validate state constraints

3. **Scene Control**
   - Test scene transitions
   - Verify cleanup procedures
   - Test scene state preservation
   - Validate scene loading

4. **Performance Considerations**
   - Use fake timers for time-dependent tests
   - Test frame-rate independence
   - Verify efficient input processing
   - Test memory cleanup

## Version Control
- Version: 1.0.0
- Last Updated: [Current Date]
- Status: Active 