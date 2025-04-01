# Core Game Services API Documentation

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team

## Overview
This document provides an overview of the core service architecture, interface standards, and relationships between services. All type definitions referenced in this document are centralized in [`types.ts`](./types.ts).

## Related Documentation
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [Scene Service API](./scene-service-api.md)
- [Storage Service API](./storage-service-api.md)
- [Configuration Service API](./config-service-api.md)
- [TypeScript Standards](../standards/typescript.mdc)
- [Sprint 1 Implementation Plan](../../architecture/decisions/sprint1-implementation-plan.md)

## Service Architecture

### Interface Hierarchy
All services must implement the base `IGameService` interface and may implement additional interfaces based on their functionality:

```typescript
import { 
  IGameService, 
  IUpdatableService, 
  IDependentService, 
  IPausableService,
  IEventBus,
  GameEventMap
} from './types';

// Example service implementing multiple interfaces
export class ConfigurationService implements IGameService {
  // Implementation
}
```

### Core Services Relationship Diagram (Sprint 1)
```
ServiceRegistry (manages) ─────┐
         │                    │
         v                    v
     EventBus         Sprint 1 Services
         │                    │
         │                    ├── ConfigurationService
         ├─────────────────> ├── SceneService
         │                    └── StorageService
         │
         └─> Enables communication between services

Future Services (Post Sprint 1):
- AssetService
- AudioService
- InputService
- UIService
- GameStateService
- PhysicsService
- AIService
```

## Event Communication
Services should use the type-safe event system provided by the EventBus:

```typescript
import { IEventBus, GameEventMap } from './types';

class GameService implements IGameService {
  private eventBus: IEventBus;
  
  constructor() {
    this.eventBus = ServiceRegistry.getInstance().get<IEventBus>('eventBus');
  }
  
  private handleStateChange(data: GameEventMap['state.changed']): void {
    // Handle state change event
    console.log(`State changed: ${data.previousState} -> ${data.currentState}`);
  }
  
  public async init(): Promise<void> {
    // Subscribe to events
    this.eventBus.on('state.changed', this.handleStateChange.bind(this));
  }
  
  public destroy(): void {
    // Clean up event listeners
    this.eventBus.off('state.changed', this.handleStateChange.bind(this));
  }
}
```

## Service Implementation Checklist
1. **Interface Implementation**
   - [ ] Implement `IGameService` base interface
   - [ ] Implement additional interfaces as needed
   - [ ] Use proper TypeScript type declarations

2. **Thread Safety**
   - [ ] Use singleton pattern with locks
   - [ ] Handle concurrent initialization
   - [ ] Protect shared resources

3. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Provide detailed error messages
   - [ ] Handle async errors properly

4. **Event Communication**
   - [ ] Use type-safe event emission
   - [ ] Clean up event listeners
   - [ ] Handle event errors

## Change History
- v2.0.0 (2024-03-31)
  - Updated service hierarchy to reflect Sprint 1 scope
  - Added reference to Sprint 1 Implementation Plan
  - Clarified current vs future services
  - Updated example to use ConfigurationService
- v1.0.0 (2024-03-01)
  - Initial documentation

## Error Handling

### Error Types
- **ServiceRegistrationError**: This error type is used when there is an issue with service registration.
- **ServiceDependencyError**: This error type is used when there is an issue with service dependencies.
- **ServiceOperationError**: This error type is used when there is an issue with service operations.
- **ServiceStateError**: This error type is used when there is an issue with service state.
- **ServiceThreadError**: This error type is used when there is an issue with service threads.

### Usage Examples
- **ServiceRegistrationError**: This error type is used when there is an issue with service registration.
- **ServiceDependencyError**: This error type is used when there is an issue with service dependencies.
- **ServiceOperationError**: This error type is used when there is an issue with service operations.
- **ServiceStateError**: This error type is used when there is an issue with service state.
- **ServiceThreadError**: This error type is used when there is an issue with service threads.

## Error Handling Patterns and Best Practices
- **ServiceRegistrationError**: This error type is used when there is an issue with service registration.
- **ServiceDependencyError**: This error type is used when there is an issue with service dependencies.
- **ServiceOperationError**: This error type is used when there is an issue with service operations.
- **ServiceStateError**: This error type is used when there is an issue with service state.
- **ServiceThreadError**: This error type is used when there is an issue with service threads.

## Event System Documentation

### GameEventMap Events

#### System Events
- **system.initialized**
  - **Type**: `{ timestamp: number }`
  - **Description**: Emitted when the game system completes initialization
  - **Usage**: Use to trigger post-initialization logic or synchronize startup sequences
  - **Example**:
  ```typescript
  eventBus.on('system.initialized', ({ timestamp }) => {
    console.log(`System initialized at: ${new Date(timestamp)}`);
  });
  ```

- **system.error**
  - **Type**: `{ error: Error; context: string }`
  - **Description**: Emitted when a system-level error occurs
  - **Usage**: Use for error tracking, logging, and graceful error handling
  - **Example**:
  ```typescript
  eventBus.on('system.error', ({ error, context }) => {
    logger.error(`Error in ${context}: ${error.message}`);
  });
  ```

#### Game State Events
- **game.stateChanged**
  - **Type**: `{ previousState: GameState; currentState: GameState }`
  - **Description**: Emitted when the game state transitions
  - **Possible States**: 'menu' | 'playing' | 'paused' | 'loading' | 'gameOver'
  - **Usage**: Use to react to game state changes and update UI/systems accordingly
  - **Example**:
  ```typescript
  eventBus.on('game.stateChanged', ({ previousState, currentState }) => {
    console.log(`Game state changed from ${previousState} to ${currentState}`);
    if (currentState === 'paused') {
      this.pauseGameSystems();
    }
  });
  ```

- **game.paused**
  - **Type**: `{ reason: string }`
  - **Description**: Emitted when the game enters a paused state
  - **Usage**: Use to pause game systems, show pause menu, or handle pause-specific logic
  - **Example**:
  ```typescript
  eventBus.on('game.paused', ({ reason }) => {
    console.log(`Game paused: ${reason}`);
    this.showPauseMenu();
  });
  ```

- **game.resumed**
  - **Type**: `{ timestamp: number }`
  - **Description**: Emitted when the game resumes from a paused state
  - **Usage**: Use to resume game systems and hide pause-related UI
  - **Example**:
  ```typescript
  eventBus.on('game.resumed', ({ timestamp }) => {
    console.log(`Game resumed at: ${new Date(timestamp)}`);
    this.hidePauseMenu();
  });
  ```

#### Player Events
- **player.healthChanged**
  - **Type**: `{ previousHealth: number; currentHealth: number; cause: string }`
  - **Description**: Emitted when the player's health value changes
  - **Usage**: Use to update health UI, play effects, or trigger game state changes
  - **Example**:
  ```typescript
  eventBus.on('player.healthChanged', ({ previousHealth, currentHealth, cause }) => {
    this.updateHealthUI(currentHealth);
    if (currentHealth < previousHealth) {
      this.playDamageEffect();
    }
  });
  ```

- **player.died**
  - **Type**: `{ cause: string; position: Vector2 }`
  - **Description**: Emitted when the player's health reaches zero or death conditions are met
  - **Usage**: Use to trigger death sequences, game over state, or respawn logic
  - **Example**:
  ```typescript
  eventBus.on('player.died', ({ cause, position }) => {
    console.log(`Player died at (${position.x}, ${position.y}) due to ${cause}`);
    this.triggerGameOver();
  });
  ```

#### Scene Events
- **scene.loading**
  - **Type**: `{ sceneKey: string; params?: Record<string, unknown> }`
  - **Description**: Emitted when a new scene begins loading
  - **Usage**: Use to show loading screens or prepare scene transitions
  - **Example**:
  ```typescript
  eventBus.on('scene.loading', ({ sceneKey, params }) => {
    console.log(`Loading scene: ${sceneKey}`);
    this.showLoadingScreen();
  });
  ```

- **scene.loaded**
  - **Type**: `{ sceneKey: string; loadTime: number }`
  - **Description**: Emitted when a scene completes loading
  - **Usage**: Use to hide loading screens or trigger post-load sequences
  - **Example**:
  ```typescript
  eventBus.on('scene.loaded', ({ sceneKey, loadTime }) => {
    console.log(`Scene ${sceneKey} loaded in ${loadTime}ms`);
    this.hideLoadingScreen();
  });
  ```

### Best Practices for Event Usage

1. **Type Safety**
   - Always use the typed event interfaces when subscribing to events
   - Leverage TypeScript's type checking for event payloads
   - Use the `GameEventMap` type for autocomplete and type validation

2. **Event Cleanup**
   - Always unsubscribe from events when components are destroyed
   - Use the returned unsubscribe function from `eventBus.on()`
   - Consider using `eventBus.once()` for one-time event handlers

3. **Performance Considerations**
   - Use event throttling for high-frequency events
   - Keep event payloads small and focused
   - Consider using scoped event buses for localized communication

4. **Error Handling**
   - Always handle potential errors in event callbacks
   - Use try-catch blocks in event handlers
   - Emit system.error events when appropriate

### Example Service Implementation with Events

```typescript
class GameService implements IGameService {
  private readonly eventBus: IEventBus;
  private unsubscribe: (() => void)[] = [];

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
  }

  public async init(): Promise<void> {
    // Subscribe to events
    this.unsubscribe.push(
      this.eventBus.on('game.stateChanged', this.handleStateChange.bind(this)),
      this.eventBus.on('player.died', this.handlePlayerDeath.bind(this))
    );
  }

  public destroy(): void {
    // Clean up all event subscriptions
    this.unsubscribe.forEach(unsub => unsub());
    this.unsubscribe = [];
  }

  private handleStateChange({ previousState, currentState }: GameEventMap['game.stateChanged']): void {
    // Handle state change
  }

  private handlePlayerDeath({ cause, position }: GameEventMap['player.died']): void {
    // Handle player death
  }
}
```

## TypeScript Utility Types
1. Add more TypeScript utility types for common service patterns
2. Document type safety best practices
3. Include examples of generic service implementations
4. Add type guard examples for service type checking

## Service Lifecycle Documentation

### Service Initialization Order
```
ServiceRegistry (manages) ─────┐
         │                    │
         v                    v
     EventBus         Sprint 1 Services
         │                    │
         │                    ├── ConfigurationService
         ├─────────────────> ├── SceneService
         │                    └── StorageService
         │
         └─> Enables communication between services
```

### Dependency Resolution Process
```
ServiceRegistry (manages) ─────┐
         │                    │
         v                    v
     EventBus         Sprint 1 Services
         │                    │
         │                    ├── ConfigurationService
         ├─────────────────> ├── SceneService
         │                    └── StorageService
         │
         └─> Enables communication between services
```

### Proper Service Cleanup
```
ServiceRegistry (manages) ─────┐
         │                    │
         v                    v
     EventBus         Sprint 1 Services
         │                    │
         │                    ├── ConfigurationService
         ├─────────────────> ├── SceneService
         │                    └── StorageService
         │
         └─> Enables communication between services
```

## Testing Considerations

### Interface Testing Requirements

#### IGameService Interface
- **Initialization Testing**
  ```typescript
  describe('IGameService implementation', () => {
    test('init() should complete initialization', async () => {
      await service.init();
      expect(service.isInitialized()).toBe(true);
    });

    test('destroy() should clean up resources', async () => {
      await service.init();
      await service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });
  ```

#### IUpdatableService Interface
- **Update Cycle Testing**
  ```typescript
  describe('IUpdatableService implementation', () => {
    test('update() should process frame updates', () => {
      const deltaTime = 16.67; // Simulate 60fps
      service.update(deltaTime);
      // Verify state updates occurred
    });

    test('update() should handle variable time steps', () => {
      service.update(16.67);  // Normal frame
      service.update(33.33);  // Slow frame
      service.update(8.33);   // Fast frame
      // Verify consistent behavior across different time steps
    });
  });
  ```

#### IDependentService Interface
- **Dependency Resolution Testing**
  ```typescript
  describe('IDependentService implementation', () => {
    test('getDependencies() should return required services', () => {
      const deps = service.getDependencies();
      expect(deps).toContain('eventBus');
      // Verify all required dependencies are listed
    });

    test('should handle missing dependencies gracefully', () => {
      // Test initialization with missing dependencies
      expect(() => service.init()).rejects.toThrow(ServiceDependencyError);
    });
  });
  ```

#### IPausableService Interface
- **Pause State Testing**
  ```typescript
  describe('IPausableService implementation', () => {
    test('pause() should suspend operations', () => {
      service.pause();
      expect(service.isPaused()).toBe(true);
      // Verify operations are suspended
    });

    test('resume() should restore operations', () => {
      service.pause();
      service.resume();
      expect(service.isPaused()).toBe(false);
      // Verify operations are restored
    });
  });
  ```

### Sprint 1 Core Services Testing

#### ConfigService Testing
- Test configuration loading from different sources
- Verify environment override handling
- Test validation of configuration values
- Verify configuration change notifications
- Test error handling for invalid configurations

#### StorageService Testing
- Test data persistence operations
- Verify data retrieval functionality
- Test migration handling
- Verify error recovery mechanisms
- Test concurrent storage operations

#### SceneService Testing
- Test scene registration process
- Verify scene transition handling
- Test asset loading states
- Verify scene lifecycle events
- Test error handling during transitions

### Testing Best Practices
1. **Mock Dependencies**
   - Use typed mocks for service dependencies
   - Mock EventBus for event testing
   - Create consistent mock factories

2. **State Verification**
   - Test all possible state transitions
   - Verify state consistency after operations
   - Test concurrent state modifications

3. **Error Handling**
   - Test all error conditions
   - Verify error recovery mechanisms
   - Test error event emissions

4. **Event Testing**
   - Verify correct event emissions
   - Test event handler registration
   - Verify event unsubscription

5. **Resource Management**
   - Test resource initialization
   - Verify proper cleanup
   - Test memory leak prevention

For detailed testing patterns and implementation examples, refer to [Service Unit Testing Guide](../testing/unit/services.md).