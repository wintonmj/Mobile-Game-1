# Game Loop State Management Integration

## Overview
This document details how state management is integrated into the game loop, covering scene state synchronization, entity state updates, input processing order, and event dispatch timing.

## Core Components

### 1. State Update Cycle
```typescript
interface StateUpdateConfig {
  updatePriority: number;
  syncInterval: number;
  batchSize: number;
}

class GameLoopStateManager {
  private stateService: StateService;
  private updateConfig: StateUpdateConfig;
  private lastSyncTime: number;
  
  constructor(stateService: StateService, config: StateUpdateConfig) {
    this.stateService = stateService;
    this.updateConfig = config;
    this.lastSyncTime = 0;
  }
  
  update(time: number, delta: number): void {
    // Check if it's time to sync
    if (time - this.lastSyncTime >= this.updateConfig.syncInterval) {
      this.synchronizeState();
      this.lastSyncTime = time;
    }
  }
  
  private synchronizeState(): void {
    // Implement state synchronization logic
  }
}
```

## State Management Components

### 1. Scene State Synchronization
```typescript
class SceneStateManager {
  private scene: Phaser.Scene;
  private stateService: StateService;
  
  constructor(scene: Phaser.Scene, stateService: StateService) {
    this.scene = scene;
    this.stateService = stateService;
  }
  
  synchronizeState(): void {
    // Get current scene state
    const sceneState = this.stateService.getState(state => state.scenes[this.scene.key]);
    
    // Update scene entities
    this.updateEntities(sceneState.entities);
    
    // Update scene environment
    this.updateEnvironment(sceneState.environment);
    
    // Update UI elements
    this.updateUI(sceneState.ui);
  }
  
  private updateEntities(entityStates: Record<string, EntityState>): void {
    // Implement entity state updates
  }
  
  private updateEnvironment(envState: EnvironmentState): void {
    // Implement environment updates
  }
  
  private updateUI(uiState: UIState): void {
    // Implement UI updates
  }
}
```

### 2. Entity State Updates
```typescript
interface EntityUpdateManager {
  updateEntity(entity: GameEntity, state: EntityState): void;
  queueStateUpdate(entityId: string, partialState: Partial<EntityState>): void;
  processPendingUpdates(): void;
}

class EntityStateManager implements EntityUpdateManager {
  private pendingUpdates: Map<string, Partial<EntityState>>;
  private stateService: StateService;
  
  constructor(stateService: StateService) {
    this.pendingUpdates = new Map();
    this.stateService = stateService;
  }
  
  updateEntity(entity: GameEntity, state: EntityState): void {
    // Update entity properties
    entity.position = state.position;
    entity.rotation = state.rotation;
    entity.scale = state.scale;
    
    // Update entity-specific state
    entity.updateFromState(state);
  }
  
  queueStateUpdate(entityId: string, partialState: Partial<EntityState>): void {
    const existing = this.pendingUpdates.get(entityId) || {};
    this.pendingUpdates.set(entityId, { ...existing, ...partialState });
  }
  
  processPendingUpdates(): void {
    // Process queued state updates
    for (const [entityId, state] of this.pendingUpdates) {
      this.stateService.updateState(
        gameState => gameState.entities[entityId],
        currentState => ({ ...currentState, ...state })
      );
    }
    this.pendingUpdates.clear();
  }
}
```

### 3. Input Processing Order
```typescript
class InputStateManager {
  private inputQueue: InputEvent[];
  private processingThreshold: number;
  
  processInputs(delta: number): void {
    // Process inputs in order
    while (this.inputQueue.length > 0 && this.canProcessMore()) {
      const input = this.inputQueue.shift();
      this.processInput(input);
    }
  }
  
  private processInput(input: InputEvent): void {
    // Convert input to state changes
    const stateChanges = this.mapInputToStateChanges(input);
    
    // Apply state changes
    this.applyStateChanges(stateChanges);
  }
  
  private canProcessMore(): boolean {
    // Check if we can process more inputs this frame
    return performance.now() - this.frameStartTime < this.processingThreshold;
  }
}
```

### 4. Event Dispatch Timing
```typescript
class EventDispatchManager {
  private eventQueue: GameEvent[];
  private stateService: StateService;
  private eventBus: EventBus;
  
  constructor(stateService: StateService, eventBus: EventBus) {
    this.stateService = stateService;
    this.eventBus = eventBus;
  }
  
  queueEvent(event: GameEvent): void {
    this.eventQueue.push(event);
  }
  
  processEvents(): void {
    // Process events in order
    for (const event of this.eventQueue) {
      // Update state based on event
      this.updateState(event);
      
      // Dispatch event to listeners
      this.eventBus.emit(event.type, event);
    }
    
    // Clear processed events
    this.eventQueue = [];
  }
  
  private updateState(event: GameEvent): void {
    // Apply event-specific state changes
    this.stateService.updateState(
      state => state,
      currentState => this.reduceEventToState(currentState, event)
    );
  }
}
```

## Integration with Game Loop

### 1. Update Order
1. Input Processing (Highest Priority)
   - Process queued inputs
   - Generate input events
   - Update input state

2. State Updates (High Priority)
   - Process entity state updates
   - Update scene state
   - Handle state transitions

3. Physics Updates (Medium Priority)
   - Update physics state
   - Handle collisions
   - Apply forces

4. Visual Updates (Low Priority)
   - Update sprites and animations
   - Handle particle effects
   - Update UI elements

### 2. State Synchronization Points
```typescript
class GameLoop {
  private stateManager: GameLoopStateManager;
  private entityManager: EntityStateManager;
  private inputManager: InputStateManager;
  private eventManager: EventDispatchManager;
  
  update(time: number, delta: number): void {
    // Process inputs first
    this.inputManager.processInputs(delta);
    
    // Update state
    this.stateManager.update(time, delta);
    
    // Process entity updates
    this.entityManager.processPendingUpdates();
    
    // Process events
    this.eventManager.processEvents();
    
    // Perform fixed updates
    this.fixedUpdate(time);
  }
  
  fixedUpdate(time: number): void {
    // Update physics and other fixed-timestep systems
  }
}
```

## Best Practices

### 1. State Update Optimization
- Batch state updates when possible
- Use dirty checking to avoid unnecessary updates
- Implement state diffing for efficient updates
- Cache frequently accessed state
- Use immutable state updates

### 2. Event Handling
- Process events in priority order
- Batch similar events
- Handle event conflicts
- Maintain event order consistency
- Implement event replay capability

### 3. Performance Considerations
- Monitor state update frequency
- Profile state synchronization impact
- Optimize state serialization
- Implement state compression
- Use efficient data structures

## Related Documentation
- [game-loop.md](../architecture/patterns/game-loop.md)
- [state-management.md](../architecture/patterns/state-management.md)
- [sprint1-implementation-plan.md](../architecture/decisions/sprint1-implementation-plan.md) 