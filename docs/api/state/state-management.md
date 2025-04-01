# State Management API Documentation

## Overview
This document provides comprehensive documentation for the state management system, including state machines, state transitions, persistence mechanisms, and synchronization patterns.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [State Machine API](#state-machine-api)
3. [State Transitions](#state-transitions)
4. [State Persistence](#state-persistence)
5. [State Synchronization](#state-synchronization)
6. [Integration Guidelines](#integration-guidelines)

## Core Concepts

### State Machine
The state machine is the core component responsible for managing entity states and transitions.

```typescript
interface IStateMachine<T extends string> {
  currentState: T;
  previousState: T | null;
  
  // Core methods
  setState(newState: T): void;
  canTransitionTo(targetState: T): boolean;
  
  // Event handlers
  onStateChange(handler: StateChangeHandler<T>): void;
  onTransitionError(handler: TransitionErrorHandler): void;
}
```

### State Configuration
States are configured using a declarative approach:

```typescript
interface StateConfig<T extends string> {
  initialState: T;
  states: {
    [K in T]: {
      allowedTransitions: T[];
      onEnter?: () => void;
      onExit?: () => void;
      validate?: () => boolean;
    }
  };
}
```

## State Machine API

### Creating a State Machine
```typescript
class EntityStateMachine implements IStateMachine<EntityState> {
  constructor(config: StateConfig<EntityState>) {
    this.config = config;
    this.currentState = config.initialState;
  }
  
  // Implementation methods
  setState(newState: EntityState): void {
    if (this.canTransitionTo(newState)) {
      const oldState = this.currentState;
      this.currentState = newState;
      this.notifyStateChange(oldState, newState);
    }
  }
  
  canTransitionTo(targetState: EntityState): boolean {
    return this.config.states[this.currentState]
      .allowedTransitions.includes(targetState);
  }
}
```

### State Change Events
```typescript
interface StateChangeEvent<T extends string> {
  previousState: T;
  currentState: T;
  timestamp: number;
}

type StateChangeHandler<T extends string> = 
  (event: StateChangeEvent<T>) => void;
```

## State Transitions

### Transition Configuration
```typescript
interface TransitionConfig<T extends string> {
  from: T;
  to: T;
  condition?: () => boolean;
  action?: () => void;
  rollback?: () => void;
}
```

### Transition Validation
```typescript
interface TransitionValidator<T extends string> {
  validate(from: T, to: T): boolean;
  getValidTransitions(from: T): T[];
  validateConditions(from: T, to: T): boolean;
}
```

### Error Handling
```typescript
class TransitionError extends Error {
  constructor(
    public fromState: string,
    public toState: string,
    public reason: string
  ) {
    super(`Invalid transition from ${fromState} to ${toState}: ${reason}`);
  }
}
```

## State Persistence

### Serialization Interface
```typescript
interface StatePersistence<T extends string> {
  serialize(): StateData;
  deserialize(data: StateData): void;
  validate(data: StateData): boolean;
}

interface StateData {
  version: number;
  state: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}
```

### Storage Integration
```typescript
interface StateStorage {
  save(key: string, data: StateData): Promise<void>;
  load(key: string): Promise<StateData>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## State Synchronization

### Local Synchronization
```typescript
interface StateSync {
  syncState(source: IStateMachine<any>, target: IStateMachine<any>): void;
  linkStates(machines: IStateMachine<any>[]): void;
  unlinkStates(machines: IStateMachine<any>[]): void;
}
```

### Network Synchronization
```typescript
interface NetworkStateSync extends StateSync {
  sendState(state: StateData): void;
  receiveState(state: StateData): void;
  reconcile(localState: StateData, serverState: StateData): StateData;
}
```

## Integration Guidelines

### Basic Integration
```typescript
// Create a state machine for an entity
const playerStateMachine = new EntityStateMachine({
  initialState: EntityState.IDLE,
  states: {
    [EntityState.IDLE]: {
      allowedTransitions: [EntityState.WALKING, EntityState.JUMPING],
      onEnter: () => console.log('Entered IDLE state'),
    },
    [EntityState.WALKING]: {
      allowedTransitions: [EntityState.IDLE, EntityState.RUNNING],
      validate: () => player.stamina > 0,
    },
    // ... other states
  }
});

// Handle state changes
playerStateMachine.onStateChange((event) => {
  console.log(`State changed from ${event.previousState} to ${event.currentState}`);
  updateAnimation(event.currentState);
});
```

### Advanced Integration
```typescript
// Create a networked state machine
class NetworkedPlayerState extends EntityStateMachine 
  implements NetworkStateSync {
  
  constructor(config: StateConfig<EntityState>) {
    super(config);
    this.setupNetworking();
  }
  
  private setupNetworking(): void {
    // Setup network sync
    networkManager.onStateUpdate((serverState) => {
      this.receiveState(serverState);
    });
  }
  
  // Implement network sync methods
  sendState(state: StateData): void {
    networkManager.sendStateUpdate(state);
  }
  
  receiveState(state: StateData): void {
    const reconciled = this.reconcile(this.serialize(), state);
    this.deserialize(reconciled);
  }
  
  reconcile(local: StateData, server: StateData): StateData {
    // Implement reconciliation logic
    return server; // Server authority in this example
  }
}
```

## Error Handling Best Practices

### Validation Errors
```typescript
// Implement comprehensive error checking
class StateValidator<T extends string> implements TransitionValidator<T> {
  validate(from: T, to: T): boolean {
    // Check basic transition validity
    if (!this.isValidTransition(from, to)) {
      throw new TransitionError(from, to, 'Invalid transition path');
    }
    
    // Check conditions
    if (!this.validateConditions(from, to)) {
      throw new TransitionError(from, to, 'Transition conditions not met');
    }
    
    return true;
  }
  
  private isValidTransition(from: T, to: T): boolean {
    return this.getValidTransitions(from).includes(to);
  }
}
```

### Recovery Strategies
```typescript
class ResilientStateMachine<T extends string> extends EntityStateMachine<T> {
  setState(newState: T): void {
    try {
      super.setState(newState);
    } catch (error) {
      if (error instanceof TransitionError) {
        this.handleTransitionError(error);
      } else {
        throw error;
      }
    }
  }
  
  private handleTransitionError(error: TransitionError): void {
    // Log error
    console.error(`State transition failed: ${error.message}`);
    
    // Attempt recovery
    this.attemptRecovery(error);
  }
  
  private attemptRecovery(error: TransitionError): void {
    // Implement recovery strategy
    // For example, return to last known good state
    if (this.previousState) {
      this.forceState(this.previousState);
    }
  }
}
```

## Related Documentation
- [State Testing Guidelines](../../testing/unit/state.md)
- [State Manager Service API](../services/sprint1/state-manager-api.md)
- [Game Architecture Overview](../../architecture/patterns/mvp-high-level-architecture.md) 