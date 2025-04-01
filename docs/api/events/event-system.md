# Event System Documentation

## Overview
This document provides comprehensive documentation for the game's event system, defining event types, payload structures, handling requirements, and best practices. The implementation follows the MVP design requirements while maintaining extensibility for future features outlined in the vision design.

## Related Documents
- [MVPDesign.md](../../design/MVPDesign.md) - MVP feature requirements
- [VisionDesign.md](../../design/VisionDesign.md) - Long-term vision and extensibility
- [EventBusAPI.md](../services/sprint1/event-bus-api.md) - Technical implementation details
- [TestingStandards.md](../../testing/testing-standards.md) - Testing requirements

## Event System Architecture

### Core Components
1. **EventBus Service**
   - Centralized event management
   - Type-safe event emission and handling
   - Scoped event support
   - Performance optimization features

2. **Event Types**
   - System events
   - Game state events
   - Player events
   - Scene events
   - UI events
   - Resource events

### Event Categories

#### 1. System Events
```typescript
interface SystemEvents {
  'system.initialized': { timestamp: number };
  'system.error': { error: Error; context: string };
  'system.ready': { services: string[] };
}
```

#### 2. Game State Events
```typescript
interface GameStateEvents {
  'game.stateChanged': { 
    previousState: GameState; 
    currentState: GameState 
  };
  'game.paused': { reason: string };
  'game.resumed': { timestamp: number };
  'game.saved': { slot: number; timestamp: number };
}
```

#### 3. Player Events
```typescript
interface PlayerEvents {
  'player.healthChanged': { 
    previousHealth: number; 
    currentHealth: number; 
    cause: string 
  };
  'player.died': { 
    cause: string; 
    position: Vector2 
  };
  'player.levelUp': {
    newLevel: number;
    previousLevel: number;
  };
}
```

#### 4. Scene Events
```typescript
interface SceneEvents {
  'scene.loading': { 
    sceneKey: string; 
    params?: Record<string, unknown> 
  };
  'scene.loaded': { 
    sceneKey: string; 
    loadTime: number 
  };
  'scene.transition.start': { from: string; to: string };
  'scene.transition.complete': { from: string; to: string };
}
```

## Event Handling Requirements

### 1. Event Subscription
```typescript
// Type-safe event subscription
eventBus.on('player.healthChanged', (data) => {
  // TypeScript ensures data has correct shape
  console.log(`Health changed from ${data.previousHealth} to ${data.currentHealth}`);
});

// One-time event handling
eventBus.once('game.initialized', (data) => {
  console.log(`Game initialized at ${data.timestamp}`);
});
```

### 2. Event Emission
```typescript
// Emit events with type checking
eventBus.emit('player.healthChanged', {
  previousHealth: 100,
  currentHealth: 90,
  cause: 'damage'
});
```

### 3. Error Handling
- All event handlers must implement proper error handling
- Errors should be caught and reported via system.error event
- Critical errors should trigger appropriate game state changes

```typescript
try {
  // Event handling logic
} catch (error) {
  eventBus.emit('system.error', {
    error,
    context: 'player.healthChanged handler'
  });
}
```

## Event Propagation Rules

### 1. Event Bubbling
- Scene-specific events can bubble up to global scope
- Parent scenes can intercept child scene events
- Event propagation can be stopped at any level

### 2. Event Scoping
```typescript
// Create scoped event bus for specific scene
const sceneEvents = eventBus.createScope('mainMenu');

// Events will be prefixed: 'mainMenu.buttonClicked'
sceneEvents.emit('buttonClicked', { buttonId: 'start' });
```

## Performance Requirements

### 1. Event Throttling
```typescript
// Throttle high-frequency events
eventBus.throttle('player.position', 16); // ~60fps
eventBus.throttle('input.move', 32); // ~30fps
```

### 2. Event Batching
```typescript
// Batch multiple related events
eventBus.batchEmit([
  {
    name: 'inventory.itemAdded',
    payload: { itemId: 'potion', quantity: 1 }
  },
  {
    name: 'ui.inventoryUpdated',
    payload: { slot: 5 }
  }
]);
```

## Event Filtering Patterns

### 1. Event Filters
```typescript
// Filter events based on conditions
eventBus.on('player.damaged', (data) => {
  if (data.amount > 10) {
    // Handle significant damage
  }
});
```

### 2. Event Transformations
```typescript
// Transform events before handling
eventBus.transform('player.experience', (data) => ({
  ...data,
  totalNeeded: calculateExpForLevel(data.level + 1)
}));
```

## Event Debugging Patterns

### 1. Debug Logging
```typescript
// Enable debug mode for specific events
eventBus.debug(['player.*', 'scene.*']);

// Log all events in development
if (isDevelopment) {
  eventBus.on('*', (eventName, data) => {
    console.log(`[Event] ${eventName}:`, data);
  });
}
```

### 2. Event Monitoring
```typescript
// Monitor event frequency
eventBus.monitor('player.position', {
  sampleRate: 1000,
  threshold: 60
});
```

## Integration with Save System

### 1. State Persistence
- Event system state can be serialized for save files
- Event subscriptions are rebuilt on game load
- Pending events can be persisted if needed

### 2. Event History
```typescript
// Record event history for debugging
eventBus.enableHistory({
  maxEvents: 1000,
  includePatterns: ['player.*', 'game.*'],
  excludePatterns: ['debug.*']
});
```

## Testing Requirements

### 1. Unit Testing
```typescript
describe('EventBus', () => {
  test('should emit and receive events', () => {
    const handler = jest.fn();
    eventBus.on('test.event', handler);
    eventBus.emit('test.event', { data: 'test' });
    expect(handler).toHaveBeenCalledWith({ data: 'test' });
  });
});
```

### 2. Integration Testing
```typescript
test('should coordinate player and inventory updates', async () => {
  const playerService = new PlayerService(eventBus);
  const inventoryService = new InventoryService(eventBus);
  
  playerService.pickupItem('health-potion');
  
  await waitForEvent('inventory.updated');
  expect(inventoryService.getItem('health-potion')).toBeDefined();
});
```

## Future Extensibility

### 1. Planned Extensions
- Network event synchronization
- Event replay system for debugging
- Advanced event filtering and routing
- Performance monitoring and optimization
- Event-driven AI behavior systems

### 2. Integration Points
- Multiplayer event synchronization
- Save system event persistence
- Analytics and telemetry
- Advanced debugging tools

## Version History
- v1.0.0 (2024-04-01)
  - Initial event system documentation
  - Core event types and handling patterns
  - Basic performance requirements
  - MVP feature support 