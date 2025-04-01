# Event Testing Guide

## Overview
This document provides detailed guidance for testing event-based functionality in our game, focusing on the EventBus system and event-driven communication patterns. It aligns with our Jest testing strategy and the EventBus API specifications.

## Related Documentation
- [Jest Testing Strategy](../../testing/jest-testing-strategy.md)
- [Event Bus API](../../api/services/sprint1/event-bus-api.md)
- [Sprint 1 Implementation Plan](../../architecture/decisions/sprint1-implementation-plan.md)

## Contents
1. [Test Categories](#test-categories)
2. [Coverage Requirements](#coverage-requirements)
3. [Testing Patterns](#testing-patterns)
4. [Event Testing Utilities](#event-testing-utilities)
5. [Common Test Scenarios](#common-test-scenarios)
6. [Documentation Standards](#documentation-standards)
7. [Best Practices](#best-practices)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
9. [Integration Testing Patterns](#integration-testing-patterns)

## Coverage Requirements

### Event System Coverage Targets
- Core Event Bus: 95% line coverage
- Event Handlers: 90% line coverage
- Event Utilities: 85% line coverage

### Critical Areas Requiring 100% Coverage
- Event registration and unregistration
- Event emission and handling
- Error handling in event system
- Event scoping and bubbling
- Memory management and cleanup

### Coverage Configuration
```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    'src/core/events/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    'src/events/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
};
```

## Test Categories

### 1. Core Event Bus Functionality
Test the fundamental operations of the EventBus:

```typescript
/**
 * Tests for EventBus core functionality
 * 
 * @group unit
 * @group events
 * @coverage-target 95%
 */
import { EventBus } from '../../../src/core/EventBus';
import type { IEventBus, EventMap } from '../../../src/interfaces/IEventBus';

describe('EventBus Core Functionality', () => {
  let eventBus: IEventBus<EventMap>;
  
  beforeEach(async () => {
    eventBus = EventBus.getInstance();
    await eventBus.init();
  });
  
  afterEach(async () => {
    await eventBus.destroy();
  });
  
  /**
   * Verifies basic event emission and handling
   * 
   * @event player.damaged
   */
  test('should emit and receive events', () => {
    // Arrange
    const handler = jest.fn();
    eventBus.on('player.damaged', handler);
    
    // Act
    eventBus.emit('player.damaged', { amount: 10, source: 'enemy' });
    
    // Assert
    expect(handler).toHaveBeenCalledWith({
      amount: 10,
      source: 'enemy'
    });
  });
  
  /**
   * Verifies event unsubscription
   * 
   * @event player.damaged
   */
  test('should unsubscribe from events correctly', () => {
    // Arrange
    const handler = jest.fn();
    const unsubscribe = eventBus.on('player.damaged', handler);
    
    // Act
    unsubscribe();
    eventBus.emit('player.damaged', { amount: 10, source: 'enemy' });
    
    // Assert
    expect(handler).not.toHaveBeenCalled();
  });
});
```

### 2. Event Type Safety
Verify type safety for event payloads:

```typescript
/**
 * Tests for event type safety
 */
describe('Event Type Safety', () => {
  test('should enforce type safety for event payloads', () => {
    interface LevelUpEvent {
      level: number;
      attributePoints: number;
    }
    
    // This test will fail at compile time if types are incorrect
    eventBus.on<LevelUpEvent>('player.levelup', (data) => {
      // TypeScript should infer correct types
      const level: number = data.level;
      const points: number = data.attributePoints;
    });
  });
});
```

### 3. Event Throttling
Test event throttling functionality:

```typescript
describe('Event Throttling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should throttle high-frequency events', () => {
    // Arrange
    const handler = jest.fn();
    eventBus.on('input.drag', handler);
    eventBus.throttle('input.drag', 16);
    
    // Act - Emit multiple events rapidly
    for (let i = 0; i < 10; i++) {
      eventBus.emit('input.drag', { x: i, y: i });
    }
    
    // Assert - Should be called only once due to throttling
    expect(handler).toHaveBeenCalledTimes(1);
    
    // Advance time past throttle interval
    jest.advanceTimersByTime(16);
    
    // Emit another event
    eventBus.emit('input.drag', { x: 100, y: 100 });
    
    // Should now be called twice
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
```

### 4. Scoped Events
Test event scoping functionality:

```typescript
describe('Scoped Events', () => {
  test('should handle scoped events correctly', () => {
    // Arrange
    const scopedBus = eventBus.createScope('ui');
    const handler = jest.fn();
    
    scopedBus.on('dialog.open', handler);
    
    // Act
    scopedBus.emit('dialog.open', { dialogId: 'test' });
    
    // Assert
    expect(handler).toHaveBeenCalledWith({ dialogId: 'test' });
    
    // Global events shouldn't trigger scoped handlers
    eventBus.emit('dialog.open', { dialogId: 'other' });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

## Testing Patterns

### 1. Event Spy Pattern
Use Jest spies to track event emissions:

```typescript
function createEventSpy<K extends keyof GameEventMap>(
  eventBus: IEventBus,
  eventName: K
): jest.Mock {
  const spy = jest.fn();
  eventBus.on(eventName, spy);
  return spy;
}

test('should track event emissions', () => {
  const damageSpy = createEventSpy(eventBus, 'player.damaged');
  
  // Trigger some action that should emit the event
  player.takeDamage(10);
  
  expect(damageSpy).toHaveBeenCalledWith({
    amount: 10,
    source: 'test',
    currentHealth: 90
  });
});
```

### 2. Event Sequence Testing
Test sequences of related events:

```typescript
test('should emit correct sequence of events during combat', async () => {
  const eventSequence: string[] = [];
  
  // Track multiple event types
  eventBus.on('combat.start', () => eventSequence.push('start'));
  eventBus.on('player.attack', () => eventSequence.push('attack'));
  eventBus.on('enemy.damaged', () => eventSequence.push('damage'));
  eventBus.on('combat.end', () => eventSequence.push('end'));
  
  // Trigger combat sequence
  await combatService.executeCombatRound();
  
  expect(eventSequence).toEqual(['start', 'attack', 'damage', 'end']);
});
```

## Event Testing Utilities

### 1. Event Collector
Create a utility to collect and verify events:

```typescript
class EventCollector {
  private events: Array<{ name: string; data: any }> = [];
  
  constructor(private eventBus: IEventBus) {}
  
  start<K extends keyof GameEventMap>(eventName: K): void {
    this.eventBus.on(eventName, (data) => {
      this.events.push({ name: eventName, data });
    });
  }
  
  getEvents(): Array<{ name: string; data: any }> {
    return [...this.events];
  }
  
  clear(): void {
    this.events = [];
  }
}

test('should collect all damage events', () => {
  const collector = new EventCollector(eventBus);
  collector.start('player.damaged');
  
  // Trigger multiple damage events
  player.takeDamage(10);
  player.takeDamage(20);
  
  const events = collector.getEvents();
  expect(events).toHaveLength(2);
  expect(events[0].data.amount).toBe(10);
  expect(events[1].data.amount).toBe(20);
});
```

## Common Test Scenarios

### 1. Error Handling
Test error handling in event listeners:

```typescript
test('should handle errors in event listeners gracefully', () => {
  // Arrange
  const errorHandler = jest.fn();
  const throwingHandler = () => { throw new Error('Test error'); };
  
  eventBus.on('test.event', throwingHandler);
  eventBus.on('error', errorHandler);
  
  // Act
  eventBus.emit('test.event', {});
  
  // Assert
  expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
});
```

### 2. Memory Management
Test for proper cleanup of event listeners:

```typescript
test('should clean up event listeners on destroy', () => {
  // Arrange
  const handler = jest.fn();
  eventBus.on('test.event', handler);
  
  // Act
  eventBus.destroy();
  eventBus.emit('test.event', {});
  
  // Assert
  expect(handler).not.toHaveBeenCalled();
});
```

## Documentation Standards

### Test Documentation
Each test file should include:

1. **File Header**
```typescript
/**
 * Tests for EventBus system
 * 
 * @group unit
 * @group events
 * @coverage-target 95%
 * @author Your Name
 * @lastModified 2024-04-01
 */
```

2. **Test Group Documentation**
```typescript
describe('EventBus', () => {
  /**
   * Tests for event scoping functionality
   * 
   * Critical paths:
   * 1. Scope creation
   * 2. Event isolation
   * 3. Scope cleanup
   * 4. Event bubbling
   */
  describe('event scoping', () => {
    // Tests
  });
});
```

3. **Individual Test Documentation**
```typescript
/**
 * Verifies that scoped events:
 * 1. Only trigger handlers in their scope
 * 2. Don't leak to parent scopes
 * 3. Can be bubbled up when configured
 * 4. Are cleaned up properly
 * 
 * @event scoped.event
 * @error EventScopeError
 */
test('should handle scoped events correctly', () => {
  // Test implementation
});
```

## Best Practices

1. **Isolated Tests**
   - Reset the EventBus before each test
   - Clean up listeners after tests
   - Use unique event names for testing

2. **Type Safety**
   - Use TypeScript to enforce event payload types
   - Test with incorrect payload types to ensure type checking
   - Document expected payload shapes

3. **Performance Testing**
   - Test throttling with high-frequency events
   - Verify memory usage with many listeners
   - Test event emission under load

4. **Integration Testing**
   - Test event flow between components
   - Verify event handling in scene transitions
   - Test service communication via events

## Anti-Patterns to Avoid

1. **Testing Implementation Details**
   - Don't test private event bus internals
   - Focus on observable behavior
   - Test through public API only

2. **Tight Coupling**
   - Avoid direct dependencies on EventBus implementation
   - Use interfaces for testing
   - Mock event bus when testing other components

3. **Incomplete Cleanup**
   - Always clean up listeners in tests
   - Verify no memory leaks
   - Reset event bus state between tests

## Version History
- v1.0.0 (2024-03-31)
  - Initial documentation
  - Aligned with EventBus API v2.0.0
  - Added comprehensive test patterns and examples

## Integration Testing Patterns

### 1. Component Communication
```typescript
describe('component communication', () => {
  /**
   * Tests event-based communication between components
   * 
   * @integration
   */
  test('should coordinate player and inventory updates', async () => {
    // Arrange
    const playerService = new PlayerService(eventBus);
    const inventoryService = new InventoryService(eventBus);
    await Promise.all([
      playerService.init(),
      inventoryService.init()
    ]);
    
    // Act - Player picks up item
    playerService.pickupItem('health-potion');
    
    // Assert - Verify inventory updated
    const inventory = await inventoryService.getPlayerInventory();
    expect(inventory.items).toContainEqual({
      id: 'health-potion',
      quantity: 1
    });
  });
});
```

### 2. Scene Transitions
```typescript
describe('scene transitions', () => {
  /**
   * Tests event handling during scene transitions
   * 
   * @integration
   */
  test('should maintain state during scene transitions', async () => {
    // Arrange
    const gameScene = new GameScene(eventBus);
    const uiScene = new UIScene(eventBus);
    
    // Act - Trigger scene transition
    gameScene.pauseGame();
    
    // Assert - Verify UI updated
    expect(uiScene.isPauseMenuVisible()).toBe(true);
    expect(gameScene.isGamePaused()).toBe(true);
  });
});
```

### 3. Service Orchestration
```typescript
describe('service orchestration', () => {
  /**
   * Tests service coordination through events
   */
});

### 4. Scene Lifecycle Events
```typescript
describe('scene lifecycle events', () => {
  /**
   * Tests scene lifecycle event handling
   * 
   * @integration
   */
  test('should handle scene lifecycle events correctly', async () => {
    // Arrange
    const scene = new GameScene(eventBus);
    const lifecycleEvents: string[] = [];
    
    // Track lifecycle events
    eventBus.on('scene.init', () => lifecycleEvents.push('init'));
    eventBus.on('scene.preload', () => lifecycleEvents.push('preload'));
    eventBus.on('scene.create', () => lifecycleEvents.push('create'));
    eventBus.on('scene.update', () => lifecycleEvents.push('update'));
    eventBus.on('scene.shutdown', () => lifecycleEvents.push('shutdown'));
    eventBus.on('scene.destroy', () => lifecycleEvents.push('destroy'));
    
    // Act
    await scene.initialize();
    await scene.startScene();
    await scene.shutdown();
    
    // Assert
    expect(lifecycleEvents).toEqual([
      'init',
      'preload',
      'create',
      'update',
      'shutdown',
      'destroy'
    ]);
  });
  
  test('should preserve state during scene transitions', async () => {
    // Arrange
    const gameData = { score: 100, level: 2 };
    const sourceScene = new GameScene(eventBus);
    const targetScene = new MenuScene(eventBus);
    
    // Act
    eventBus.emit('scene.transition', {
      from: sourceScene,
      to: targetScene,
      data: gameData
    });
    
    // Assert
    expect(targetScene.getData()).toEqual(gameData);
  });
});

### 5. Asset Loading Events
```typescript
describe('asset loading events', () => {
  /**
   * Tests asset loading event handling
   * 
   * @integration
   */
  test('should track asset loading progress', async () => {
    // Arrange
    const scene = new GameScene(eventBus);
    const loadingProgress: number[] = [];
    const loadedAssets: string[] = [];
    
    eventBus.on('assets.progress', (progress) => loadingProgress.push(progress));
    eventBus.on('assets.loaded', (asset) => loadedAssets.push(asset));
    
    // Act
    await scene.preloadAssets();
    
    // Assert
    expect(loadingProgress).toContain(0);   // Start
    expect(loadingProgress).toContain(100); // Complete
    expect(loadedAssets).toContain('player-sprite');
    expect(loadedAssets).toContain('background-music');
  });
  
  test('should handle asset loading errors', async () => {
    // Arrange
    const scene = new GameScene(eventBus);
    const errorHandler = jest.fn();
    
    eventBus.on('assets.error', errorHandler);
    
    // Act
    await scene.loadInvalidAsset();
    
    // Assert
    expect(errorHandler).toHaveBeenCalledWith({
      asset: 'invalid-asset',
      error: expect.any(Error)
    });
  });
});

### 6. High-Frequency Event Performance Testing
```typescript
describe('high-frequency event performance', () => {
  /**
   * Tests performance of high-frequency event handling
   * 
   * @performance
   */
  test('should handle rapid input events efficiently', async () => {
    // Arrange
    const inputHandler = jest.fn();
    const startTime = performance.now();
    eventBus.on('input.move', inputHandler);
    
    // Act - Simulate 1000 rapid input events
    for (let i = 0; i < 1000; i++) {
      eventBus.emit('input.move', { x: Math.random(), y: Math.random() });
    }
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Assert
    expect(processingTime).toBeLessThan(100); // Should process in under 100ms
    expect(inputHandler).toHaveBeenCalledTimes(1000);
  });
  
  test('should maintain performance with many subscribers', async () => {
    // Arrange
    const subscriberCount = 100;
    const handlers = Array.from({ length: subscriberCount }, () => jest.fn());
    
    // Add many subscribers
    handlers.forEach(handler => eventBus.on('game.update', handler));
    
    // Act - Measure time for single event emission
    const startTime = performance.now();
    eventBus.emit('game.update', { deltaTime: 16 });
    const endTime = performance.now();
    
    // Assert
    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(5); // Should process in under 5ms
    handlers.forEach(handler => {
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
  
  test('should handle event batching efficiently', async () => {
    // Arrange
    const batchHandler = jest.fn();
    eventBus.onBatch('particle.update', batchHandler, { 
      maxBatchSize: 100,
      maxDelay: 16 
    });
    
    // Act - Emit many particle updates rapidly
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      eventBus.emit('particle.update', { 
        id: i,
        position: { x: Math.random(), y: Math.random() }
      });
    }
    
    // Wait for batching
    await new Promise(resolve => setTimeout(resolve, 20));
    const endTime = performance.now();
    
    // Assert
    expect(batchHandler).toHaveBeenCalled();
    expect(endTime - startTime).toBeLessThan(50); // Process in under 50ms
    
    // Verify batch sizes
    const calls = batchHandler.mock.calls;
    calls.forEach(call => {
      expect(call[0].length).toBeLessThanOrEqual(100); // Max batch size
    });
  });
});
```
