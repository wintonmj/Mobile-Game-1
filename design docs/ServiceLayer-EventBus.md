# Event Bus Service

## Problem Statement

Our mobile game architecture currently faces several challenges related to component communication:

1. **Tight coupling between components** - Components directly reference each other, making them difficult to test and reuse
2. **Rigid communication patterns** - Direct method calls create inflexible dependencies between components
3. **No centralized event handling** - Events are handled differently across the codebase
4. **Difficulty tracing interactions** - The flow of information between components is hard to trace and debug
5. **Limited extension points** - Adding new reactions to existing events requires modifying original components
6. **One-to-many communication complexity** - Broadcasting updates to multiple components is implemented inconsistently

## Role in Service Layer Architecture

The EventBusService is a **core foundational service** in our architecture that:

1. **Enables loose coupling** - Components communicate through events without direct references
2. **Centralizes event handling** - Provides a consistent pattern for all event-based communication
3. **Facilitates debugging** - Offers tools to inspect and monitor event flow
4. **Supports the observer pattern** - Makes it easy to implement one-to-many communication
5. **Creates extension points** - New components can respond to existing events without modifying original code

The EventBusService will be implemented in **Phase 1** alongside the Registry, as it's a fundamental building block for decoupled communication between other services and components.

## Interface Definition

```typescript
export interface Subscription {
  unsubscribe(): void;
}

export interface IEventBusService {
  // Core event methods
  emit<T>(event: string, data?: T): void;
  on<T>(event: string, callback: (data?: T) => void): Subscription;
  off(event: string, callback: Function): void;
  once<T>(event: string, callback: (data?: T) => void): Subscription;
  
  // Utility methods
  getEventNames(): string[];
  clearAllEvents(): void;
  
  // Debugging helpers
  enableLogging(enabled: boolean): void;
  getSubscriberCount(event: string): number;
}
```

## Test-Driven Development Approach

### 1. Test Plan

We'll implement the EventBusService using TDD with these test categories:

1. **Basic Event Operations**
   - Test emitting events
   - Test subscribing to events
   - Test unsubscribing from events
   - Test one-time event subscription

2. **Event Patterns**
   - Test event namespacing (e.g., 'player.move', 'player.attack')
   - Test wildcard subscriptions (e.g., 'player.*')
   - Test event bubbling (optional enhancement)
   - Test priority-based event handling (optional enhancement)

3. **Error Handling**
   - Test error handling in event callbacks
   - Test invalid event names
   - Test type safety with TypeScript generics

4. **Performance**
   - Test with large numbers of subscribers
   - Test with high frequency of events
   - Test memory usage patterns

5. **Debugging**
   - Test event logging
   - Test subscriber counting
   - Test event name listing

### 2. Sample Test Cases

```typescript
// __tests__/services/EventBusService.test.ts
import { EventBusService } from '../../services/EventBusService';

describe('EventBusService', () => {
  let eventBus: EventBusService;
  
  beforeEach(() => {
    eventBus = new EventBusService();
  });
  
  describe('Basic Event Operations', () => {
    test('should allow subscribing to events', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      // Act
      eventBus.on(eventName, callback);
      
      // Assert
      expect(eventBus.getSubscriberCount(eventName)).toBe(1);
    });
    
    test('should trigger callbacks when events are emitted', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      const payload = { test: 'data' };
      
      eventBus.on(eventName, callback);
      
      // Act
      eventBus.emit(eventName, payload);
      
      // Assert
      expect(callback).toHaveBeenCalledWith(payload);
    });
    
    test('should stop receiving events after unsubscribing', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      const subscription = eventBus.on(eventName, callback);
      
      // Act - unsubscribe and emit
      subscription.unsubscribe();
      eventBus.emit(eventName, {});
      
      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should receive event only once with once()', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      eventBus.once(eventName, callback);
      
      // Act - emit twice
      eventBus.emit(eventName, { count: 1 });
      eventBus.emit(eventName, { count: 2 });
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ count: 1 });
    });
  });
  
  describe('Event Patterns', () => {
    test('should support wildcard event subscriptions', () => {
      // Arrange
      const callback = jest.fn();
      
      // Act
      eventBus.on('player.*', callback);
      eventBus.emit('player.move', { x: 10, y: 20 });
      eventBus.emit('player.attack', { target: 'enemy' });
      eventBus.emit('enemy.move', { x: 5, y: 5 }); // Should not trigger callback
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(2);
    });
    
    test('should support hierarchical event names', () => {
      // Arrange
      const rootCallback = jest.fn();
      const specificCallback = jest.fn();
      
      // Act
      eventBus.on('game', rootCallback);
      eventBus.on('game.level.complete', specificCallback);
      
      eventBus.emit('game', { status: 'running' });
      eventBus.emit('game.level.complete', { level: 1 });
      
      // Assert
      expect(rootCallback).toHaveBeenCalledTimes(1);
      expect(specificCallback).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Error Handling', () => {
    test('should continue processing other subscribers if one throws an error', () => {
      // Arrange
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const successCallback = jest.fn();
      const eventName = 'error.test';
      
      console.error = jest.fn(); // Mock console.error
      
      // Act
      eventBus.on(eventName, errorCallback);
      eventBus.on(eventName, successCallback);
      eventBus.emit(eventName);
      
      // Assert
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('Debugging', () => {
    test('should list all event names', () => {
      // Arrange
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      eventBus.on('event3', () => {});
      
      // Act
      const eventNames = eventBus.getEventNames();
      
      // Assert
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toContain('event3');
      expect(eventNames.length).toBe(3);
    });
    
    test('should count subscribers correctly', () => {
      // Arrange
      const event = 'counting.test';
      
      eventBus.on(event, () => {});
      eventBus.on(event, () => {});
      const sub = eventBus.on(event, () => {});
      
      // Act & Assert
      expect(eventBus.getSubscriberCount(event)).toBe(3);
      
      // Remove one
      sub.unsubscribe();
      expect(eventBus.getSubscriberCount(event)).toBe(2);
    });
    
    test('should clear all events', () => {
      // Arrange
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      
      // Act
      eventBus.clearAllEvents();
      
      // Assert
      expect(eventBus.getEventNames().length).toBe(0);
      expect(eventBus.getSubscriberCount('event1')).toBe(0);
    });
  });
  
  describe('Performance', () => {
    test('should handle many subscribers efficiently', () => {
      // Arrange
      const event = 'perf.test';
      const subscribers = 1000;
      let callCount = 0;
      
      // Add many subscribers
      for (let i = 0; i < subscribers; i++) {
        eventBus.on(event, () => { callCount++; });
      }
      
      // Act
      const startTime = performance.now();
      eventBus.emit(event);
      const endTime = performance.now();
      
      // Assert
      expect(callCount).toBe(subscribers);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});
```

### 3. Implementation Strategy

1. **Start with core functionality**
   - Implement basic event subscription and emission
   - Add unsubscription support
   - Make tests pass with minimal implementation

2. **Add event patterns**
   - Implement wildcard subscriptions
   - Add support for hierarchical events
   - Test with realistic event scenarios

3. **Implement error handling**
   - Add try/catch for subscriber callbacks
   - Implement logging for errors
   - Ensure event processing continues after errors

4. **Add debugging support**
   - Implement event listing
   - Add subscriber counting
   - Create event logging mechanism

5. **Optimize for performance**
   - Optimize data structures for fast lookup
   - Add event batching for high-frequency events
   - Profile and optimize key operations

### 4. Acceptance Criteria

The EventBusService implementation will be considered complete when:

1. All tests pass consistently
2. The interface is fully implemented
3. Wildcard event subscriptions work correctly
4. Error handling is robust
5. Performance testing shows it can handle the expected event load
6. It provides useful debugging information
7. Documentation is complete with usage examples
8. Memory leaks are prevented through proper cleanup

## Integration with Game Architecture

The EventBusService will be used throughout our codebase to facilitate communication between components:

1. **Controller-to-Service Communication**
   - Controllers emit events that services respond to
   - Services emit events that controllers can listen for

2. **Inter-Service Communication**
   - Services communicate with each other through events
   - Avoids direct references between services

3. **Game Object Communication**
   - Game objects emit events about their state changes
   - Other objects respond to these events

4. **UI Updates**
   - Game state changes emit events
   - UI components listen for these events and update accordingly

## Sample Usage Patterns

### Player Movement Example

```typescript
// Controller emits movement events
class PlayerController {
  private eventBus: IEventBusService;
  
  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
  }
  
  public movePlayer(x: number, y: number): void {
    // Emit movement event
    this.eventBus.emit('player.move', { x, y });
  }
}

// Service listens for movement events
class MovementService {
  private eventBus: IEventBusService;
  private physicsService: IPhysicsService;
  
  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
    this.physicsService = registry.getService<IPhysicsService>('physics');
    
    // Subscribe to movement events
    this.eventBus.on('player.move', this.handlePlayerMove.bind(this));
  }
  
  private handlePlayerMove(data: { x: number, y: number }): void {
    // Process movement with physics
    const collision = this.physicsService.moveWithCollision(player, data.x, data.y);
    
    // Emit result events
    if (collision) {
      this.eventBus.emit('player.collision', { x: data.x, y: data.y });
    } else {
      this.eventBus.emit('player.moved', { x: data.x, y: data.y });
    }
  }
}
```

### Animation Trigger Example

```typescript
// Weapon service emits attack events
class WeaponService {
  private eventBus: IEventBusService;
  
  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
  }
  
  public useWeapon(weaponId: string): void {
    // Get weapon data, calculate effects, etc.
    
    // Emit weapon use event
    this.eventBus.emit('weapon.used', { 
      weaponId, 
      animationKey: 'sword_swing' 
    });
  }
}

// Animation service listens for events that should trigger animations
class AnimationService implements IAnimationService {
  private eventBus: IEventBusService;
  
  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
    
    // Subscribe to events that trigger animations
    this.eventBus.on('weapon.used', this.handleWeaponAnimation.bind(this));
    this.eventBus.on('player.moved', this.handleMovementAnimation.bind(this));
    this.eventBus.on('enemy.damaged', this.handleDamageAnimation.bind(this));
  }
  
  private handleWeaponAnimation(data: { weaponId: string, animationKey: string }): void {
    // Play the appropriate animation
    this.playAnimation(playerSprite, data.animationKey);
  }
  
  // Other handler methods...
}
```

## Performance Considerations

1. **Event filtering**: Implement efficient filtering for wildcard subscriptions
2. **Memory usage**: Prevent memory leaks by cleaning up subscriptions
3. **Emission performance**: Optimize event emission for high-frequency events
4. **Subscription lookup**: Use efficient data structures for subscriber management

## Migration Strategy

1. **Identify key interactions**: Start by identifying direct component interactions to replace
2. **Create event catalog**: Develop a standardized naming scheme for events
3. **Implement core events**: Begin with the most critical event-based interactions
4. **Refactor controllers**: Update controllers to use event-based communication
5. **Update services**: Modify services to emit and respond to events 