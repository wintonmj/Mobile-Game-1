# Event Bus API Documentation

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team

## Overview
The `EventBus` provides a centralized event management system for communication between game components and services. It implements a publish-subscribe pattern (pub/sub) allowing loosely coupled communication between different parts of the game.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [TypeScript Standards](../standards/typescript.mdc)

## Core Interface

```typescript
import { 
  IGameService,
  GameEventMap,
  ServiceError,
  ServiceThreadError,
  ServiceStateError
} from './types';

/**
 * Event bus system for game-wide communication
 * @interface IEventBus
 * @extends IGameService
 */
interface IEventBus extends IGameService {
  /**
   * Subscribe to an event
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   * @returns Function to call to unsubscribe
   */
  on<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): () => void;
  
  /**
   * Unsubscribe from an event
   * @param eventName Name of the event to unsubscribe from
   * @param callback Function to remove from listeners
   */
  off<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): void;
  
  /**
   * Emit an event to all subscribers
   * @param eventName Name of the event to emit
   * @param data Data to pass to event handlers
   */
  emit<K extends keyof GameEventMap>(
    eventName: K, 
    data: GameEventMap[K]
  ): void;
  
  /**
   * Subscribe to an event and automatically unsubscribe after it fires once
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   * @returns Function to call to unsubscribe before the event fires
   */
  once<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): () => void;
  
  /**
   * Throttle event emissions to prevent performance issues
   * @param eventName Name of the event to throttle
   * @param milliseconds Maximum frequency of event emission in milliseconds
   */
  throttle(eventName: keyof GameEventMap, milliseconds: number): void;
  
  /**
   * Create a scoped event bus that prefixes all events with a namespace
   * @param scope Namespace to prefix events with
   * @returns Scoped event bus instance
   */
  createScope(scope: string): IScopedEventBus;
}

/**
 * Scoped event bus for namespace-specific events
 * @interface IScopedEventBus
 * @extends Omit<IEventBus, 'createScope'>
 */
interface IScopedEventBus extends Omit<IEventBus, 'createScope'> {
  /**
   * The scope/namespace of this event bus
   */
  readonly scope: string;
}

/**
 * Implementation of the Event Bus
 */
export class EventBus implements IEventBus {
  private static instance: EventBus | null = null;
  private static instanceLock = false;
  private initialized = false;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private throttledEvents: Map<string, { lastFired: number; interval: number }> = new Map();
  private wildcardCache: Map<string, RegExp> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      if (EventBus.instanceLock) {
        throw new ServiceThreadError('EventBus', 'getInstance');
      }
      EventBus.instanceLock = true;
      try {
        EventBus.instance = new EventBus();
      } finally {
        EventBus.instanceLock = false;
      }
    }
    return EventBus.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      throw new ServiceStateError('EventBus', 'not initialized', 'initialized');
    }
    
    try {
      this.eventListeners.clear();
      this.throttledEvents.clear();
      this.wildcardCache.clear();
      this.initialized = true;
    } catch (error) {
      throw new ServiceError('Failed to initialize EventBus', error as Error);
    }
  }

  public destroy(): void {
    this.eventListeners.clear();
    this.throttledEvents.clear();
    this.wildcardCache.clear();
    this.initialized = false;
  }

  public on<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): () => void {
    if (!this.initialized) {
      throw new ServiceStateError('EventBus', 'initialized', 'not initialized');
    }

    if (!this.eventListeners.has(eventName as string)) {
      this.eventListeners.set(eventName as string, new Set());
    }

    const listeners = this.eventListeners.get(eventName as string)!;
    listeners.add(callback as any);

    return () => this.off(eventName, callback);
  }

  public off<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): void {
    if (!this.initialized) {
      throw new ServiceStateError('EventBus', 'initialized', 'not initialized');
    }

    const listeners = this.eventListeners.get(eventName as string);
    if (listeners) {
      listeners.delete(callback as any);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventName as string);
      }
    }
  }

  public emit<K extends keyof GameEventMap>(
    eventName: K,
    data: GameEventMap[K]
  ): void {
    if (!this.initialized) {
      throw new ServiceStateError('EventBus', 'initialized', 'not initialized');
    }

    const throttleInfo = this.throttledEvents.get(eventName as string);
    if (throttleInfo) {
      const now = Date.now();
      if (now - throttleInfo.lastFired < throttleInfo.interval) {
        return;
      }
      throttleInfo.lastFired = now;
    }

    const listeners = this.eventListeners.get(eventName as string);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  public once<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): () => void {
    const wrappedCallback = (data: GameEventMap[K]) => {
      this.off(eventName, wrappedCallback as any);
      callback(data);
    };

    return this.on(eventName, wrappedCallback as any);
  }

  public throttle(eventName: keyof GameEventMap, milliseconds: number): void {
    if (!this.initialized) {
      throw new ServiceStateError('EventBus', 'initialized', 'not initialized');
    }

    this.throttledEvents.set(eventName as string, {
      lastFired: 0,
      interval: milliseconds
    });
  }

  public createScope(scope: string): IScopedEventBus {
    return new ScopedEventBus(this, scope);
  }
}

/**
 * Implementation of a scoped event bus
 */
class ScopedEventBus implements IScopedEventBus {
  constructor(
    private eventBus: IEventBus,
    public readonly scope: string
  ) {}

  private getScopedEventName<K extends keyof GameEventMap>(eventName: K): K {
    return `${this.scope}.${eventName}` as K;
  }

  public on<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): () => void {
    return this.eventBus.on(this.getScopedEventName(eventName), callback);
  }

  public off<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): void {
    this.eventBus.off(this.getScopedEventName(eventName), callback);
  }

  public emit<K extends keyof GameEventMap>(
    eventName: K,
    data: GameEventMap[K]
  ): void {
    this.eventBus.emit(this.getScopedEventName(eventName), data);
  }

  public once<K extends keyof GameEventMap>(
    eventName: K,
    callback: (data: GameEventMap[K]) => void
  ): () => void {
    return this.eventBus.once(this.getScopedEventName(eventName), callback);
  }

  public throttle(eventName: keyof GameEventMap, milliseconds: number): void {
    this.eventBus.throttle(this.getScopedEventName(eventName), milliseconds);
  }

  public async init(): Promise<void> {
    // No initialization needed for scoped bus
  }

  public destroy(): void {
    // No cleanup needed for scoped bus
  }
}
```

## Event Payload Typing

For type-safe event handling, events should have explicitly defined payload types:

```typescript
/**
 * Type definition for event payload mapping
 * Maps event names to their expected payload types
 */
interface GameEventMap {
  // Game state events
  'game.initialized': { timestamp: number };
  'game.paused': { reason: string };
  'game.resumed': { timestamp: number };
  'game.save.request': { slotId: number };
  'game.saved': { slotId: number, timestamp: number, success: boolean };
  
  // Player events
  'player.damaged': { amount: number, source: string, currentHealth: number };
  'player.levelup': { level: number, attributePoints: number };
  'player.item.acquired': { itemId: string, quantity: number };
  
  // Scene events
  'scene.loading': { sceneKey: string, params?: any };
  'scene.loaded': { sceneKey: string };
  'scene.transition.start': { from: string, to: string, params?: any };
  'scene.transition.complete': { from: string, to: string };
  
  // UI events
  'ui.dialog.open': { dialogId: string, content: any };
  'ui.dialog.close': { dialogId: string };
  'ui.notification': { message: string, type: 'info' | 'warning' | 'error' };
  
  // Input events
  'input.key.down': { key: string, repeat: boolean };
  'input.key.up': { key: string };
  'input.tap': { x: number, y: number };
  'input.drag': { x: number, y: number };
  
  // Error events
  'error': ServiceError;
  'error.network': NetworkError;
  'error.storage': StorageError;
}

/**
 * Type-safe event emitter function
 * @param K Event name (keyof GameEventMap)
 * @param T Event payload type
 */
emit<K extends keyof GameEventMap>(eventName: K, data: GameEventMap[K]): void;

/**
 * Type-safe event subscriber function
 * @param K Event name (keyof GameEventMap)
 * @param T Event payload type
 */
on<K extends keyof GameEventMap>(eventName: K, callback: (data: GameEventMap[K]) => void): () => void;
```

## Event Naming Conventions

To maintain consistency throughout the codebase, events should follow these naming conventions:

1. **Namespace Pattern**: `category.subcategory.action`
   - Examples: `player.health.changed`, `scene.main.loaded`

2. **Standard Categories**:
   - `player.*` - Player-related events
   - `game.*` - Game state events
   - `ui.*` - User interface events
   - `scene.*` - Scene transitions and management
   - `input.*` - User input events
   - `network.*` - Multiplayer/network events
   - `audio.*` - Sound-related events
   - `resource.*` - Asset loading events
   - `error.*` - Error events

3. **Event Pairs**: For actions with a start and end, use matching pairs:
   - `scene.loading` / `scene.loaded`
   - `game.saving` / `game.saved`

4. **Request Events**: For actions requested by one service but performed by another:
   - `*.request` suffix for the request: `save.request`, `item.equip.request`
   - Regular event for confirmation: `game.saved`, `item.equipped`

## Optimization Strategies

### Throttling and Debouncing

For high-frequency events, the EventBus provides throttling mechanisms to prevent performance issues:

```typescript
// Example: Throttle high-frequency input events
eventBus.throttle('input.drag', 16); // ~60fps
eventBus.throttle('input.mousemove', 33); // ~30fps

// Example: Create debounced event handler
function createDebouncedHandler<T>(
  eventName: string,
  handler: (data: T) => void,
  delay: number
): (data: T) => void {
  let timeoutId: number | null = null;
  
  return (data: T) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      handler(data);
      timeoutId = null;
    }, delay) as unknown as number;
  };
}

// Usage
const debouncedHandler = createDebouncedHandler('ui.search', handleSearch, 300);
eventBus.on('ui.search', debouncedHandler);
```

## Scoping and Organization

### Game-Wide vs Scene-Specific Events

The EventBus supports both global and scoped events:

```typescript
// Global EventBus (accessible from anywhere)
const eventBus = ServiceRegistry.getInstance().get<IEventBus>('events');

// Create a scene-specific scoped EventBus
class MainScene extends Phaser.Scene {
  private sceneEvents: IScopedEventBus;
  
  constructor() {
    super({ key: 'MainScene' });
  }
  
  create() {
    const eventBus = ServiceRegistry.getInstance().get<IEventBus>('events');
    this.sceneEvents = eventBus.createScope('scene.main');
    
    // These events will be prefixed with 'scene.main.'
    this.sceneEvents.on('player.spawned', this.handlePlayerSpawn);
    
    // Emit a scoped event
    this.sceneEvents.emit('initialized', { timestamp: Date.now() });
    // Equivalent to: eventBus.emit('scene.main.initialized', { timestamp: Date.now() });
  }
  
  destroy() {
    // Clean up scene-specific event handlers
    this.sceneEvents.off('player.spawned', this.handlePlayerSpawn);
  }
}
```

## Usage Examples

### Basic Event Communication

```typescript
// Get event bus instance
const eventBus = EventBus.getInstance();

// Subscribe to an event
const unsubscribe = eventBus.on('player.healthChanged', (data) => {
  console.log(`Player health changed from ${data.previousHealth} to ${data.currentHealth}`);
});

// Emit an event
eventBus.emit('player.healthChanged', {
  previousHealth: 100,
  currentHealth: 90,
  cause: 'damage'
});

// Unsubscribe when done
unsubscribe();
```

### Using Scoped Events

```typescript
// Create a scoped event bus for UI events
const uiEventBus = eventBus.createScope('ui');

// Subscribe to scoped events
uiEventBus.on('dialog.open', (data) => {
  console.log(`Opening dialog: ${data.dialogId}`);
});

// Emit scoped events
uiEventBus.emit('dialog.open', {
  dialogId: 'main-menu',
  content: { title: 'Main Menu' }
});
```

### Event Throttling

```typescript
// Throttle frequent events
eventBus.throttle('input.drag', 16); // Limit to ~60fps

// Event will only be emitted at most once every 16ms
eventBus.emit('input.drag', { x: 100, y: 200 });
```

## Best Practices

1. **Type Safety**
   - Use the GameEventMap for type-safe events
   - Define event payloads clearly
   - Avoid using any type
   - Use proper type guards

2. **Performance**
   - Use throttling for frequent events
   - Clean up listeners when done
   - Use scoped events to reduce overhead
   - Avoid complex event handlers

3. **Error Handling**
   - Handle errors in event listeners
   - Use proper error types
   - Log errors appropriately
   - Maintain service state

4. **Thread Safety**
   - Use thread-safe singleton pattern
   - Handle concurrent initialization
   - Protect event listener collections
   - Use proper locking

## Change History
- v2.0.0 (2024-03-31)
  - Added event throttling support
  - Implemented scoped events
  - Added type-safe event definitions
  - Improved error handling
- v1.0.0 (2024-03-01)
  - Initial implementation 