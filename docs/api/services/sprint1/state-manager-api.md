# State Manager Service API Documentation

## Overview
The State Manager Service is a core service responsible for managing and coordinating state machines across the game system. It provides centralized state management, persistence, and synchronization capabilities.

## Table of Contents
1. [Service Registration](#service-registration)
2. [Core Functionality](#core-functionality)
3. [State Machine Management](#state-machine-management)
4. [State Persistence](#state-persistence)
5. [State Synchronization](#state-synchronization)
6. [Integration Examples](#integration-examples)

## Service Registration

### Registration with Service Registry
```typescript
class StateManagerService implements IGameService {
  private static instance: StateManagerService;
  
  public static getInstance(): StateManagerService {
    if (!StateManagerService.instance) {
      StateManagerService.instance = new StateManagerService();
    }
    return StateManagerService.instance;
  }
  
  async init(): Promise<void> {
    // Initialize state management system
    await this.initializeStorage();
    this.setupEventHandlers();
  }
  
  destroy(): void {
    // Cleanup resources
    this.clearStateMachines();
    this.unsubscribeFromEvents();
  }
}

// Register with service registry
ServiceRegistry.getInstance().register('state', StateManagerService.getInstance());
```

## Core Functionality

### Service Interface
```typescript
interface IStateManagerService {
  // State machine management
  createStateMachine<T extends string>(config: StateConfig<T>): IStateMachine<T>;
  registerStateMachine(id: string, machine: IStateMachine<any>): void;
  getStateMachine(id: string): IStateMachine<any> | undefined;
  
  // State persistence
  saveState(id: string): Promise<void>;
  loadState(id: string): Promise<void>;
  
  // State synchronization
  syncStates(sourceId: string, targetId: string): void;
  linkStateMachines(ids: string[]): void;
}
```

### Event System Integration
```typescript
interface StateManagerEvents {
  'state.created': (id: string, machine: IStateMachine<any>) => void;
  'state.changed': (id: string, event: StateChangeEvent<any>) => void;
  'state.error': (id: string, error: Error) => void;
  'state.sync': (source: string, target: string) => void;
}
```

## State Machine Management

### Creating State Machines
```typescript
class StateManagerService implements IStateManagerService {
  private machines: Map<string, IStateMachine<any>> = new Map();
  
  createStateMachine<T extends string>(
    config: StateConfig<T>
  ): IStateMachine<T> {
    const machine = new EntityStateMachine(config);
    
    // Set up event forwarding
    machine.onStateChange((event) => {
      this.eventBus.emit('state.changed', machine.id, event);
    });
    
    return machine;
  }
  
  registerStateMachine(id: string, machine: IStateMachine<any>): void {
    if (this.machines.has(id)) {
      throw new Error(`State machine with id ${id} already exists`);
    }
    
    this.machines.set(id, machine);
    this.eventBus.emit('state.created', id, machine);
  }
}
```

### Managing State Machines
```typescript
class StateManagerService implements IStateManagerService {
  getStateMachine(id: string): IStateMachine<any> | undefined {
    return this.machines.get(id);
  }
  
  removeStateMachine(id: string): void {
    const machine = this.machines.get(id);
    if (machine) {
      machine.destroy();
      this.machines.delete(id);
    }
  }
  
  clearStateMachines(): void {
    this.machines.forEach((machine) => machine.destroy());
    this.machines.clear();
  }
}
```

## State Persistence

### Storage Integration
```typescript
class StateManagerService implements IStateManagerService {
  private storage: StateStorage;
  
  private async initializeStorage(): Promise<void> {
    this.storage = new LocalStateStorage();
    await this.storage.init();
  }
  
  async saveState(id: string): Promise<void> {
    const machine = this.getStateMachine(id);
    if (!machine) {
      throw new Error(`No state machine found with id ${id}`);
    }
    
    const data = machine.serialize();
    await this.storage.save(id, data);
  }
  
  async loadState(id: string): Promise<void> {
    const data = await this.storage.load(id);
    const machine = this.getStateMachine(id);
    
    if (machine) {
      machine.deserialize(data);
    }
  }
}
```

### Persistence Configuration
```typescript
interface PersistenceConfig {
  autoSave: boolean;
  saveInterval: number;
  maxSaves: number;
  version: number;
}

class StateManagerService implements IStateManagerService {
  configurePersistence(config: PersistenceConfig): void {
    this.persistenceConfig = config;
    
    if (config.autoSave) {
      this.setupAutoSave(config.saveInterval);
    }
  }
  
  private setupAutoSave(interval: number): void {
    setInterval(() => {
      this.machines.forEach((_, id) => this.saveState(id));
    }, interval);
  }
}
```

## State Synchronization

### Local State Synchronization
```typescript
class StateManagerService implements IStateManagerService {
  syncStates(sourceId: string, targetId: string): void {
    const source = this.getStateMachine(sourceId);
    const target = this.getStateMachine(targetId);
    
    if (!source || !target) {
      throw new Error('Source or target state machine not found');
    }
    
    this.stateSync.syncState(source, target);
    this.eventBus.emit('state.sync', sourceId, targetId);
  }
  
  linkStateMachines(ids: string[]): void {
    const machines = ids
      .map(id => this.getStateMachine(id))
      .filter((machine): machine is IStateMachine<any> => !!machine);
    
    this.stateSync.linkStates(machines);
  }
}
```

### Network State Synchronization
```typescript
class NetworkStateManagerService extends StateManagerService {
  private networkSync: NetworkStateSync;
  
  constructor() {
    super();
    this.networkSync = new NetworkStateSync();
    this.setupNetworkHandlers();
  }
  
  private setupNetworkHandlers(): void {
    networkManager.onStateUpdate((data) => {
      const { id, state } = data;
      const machine = this.getStateMachine(id);
      
      if (machine) {
        this.networkSync.receiveState(state);
      }
    });
  }
  
  protected override async saveState(id: string): Promise<void> {
    await super.saveState(id);
    
    // Sync with network if online
    if (networkManager.isConnected) {
      const machine = this.getStateMachine(id);
      if (machine) {
        this.networkSync.sendState(machine.serialize());
      }
    }
  }
}
```

## Integration Examples

### Basic Usage
```typescript
// Get state manager service
const stateManager = ServiceRegistry.getInstance()
  .getService<IStateManagerService>('state');

// Create a player state machine
const playerStateMachine = stateManager.createStateMachine({
  initialState: 'idle',
  states: {
    idle: {
      allowedTransitions: ['walking', 'jumping']
    },
    walking: {
      allowedTransitions: ['idle', 'running']
    },
    // ... other states
  }
});

// Register the state machine
stateManager.registerStateMachine('player', playerStateMachine);

// Handle state changes
stateManager.on('state.changed', (id, event) => {
  console.log(`State machine ${id} changed state:`, event);
  updateGameState(id, event);
});
```

### Advanced Integration
```typescript
// Create a networked game state manager
class GameStateManager {
  private stateManager: IStateManagerService;
  
  constructor() {
    this.stateManager = ServiceRegistry.getInstance()
      .getService<IStateManagerService>('state');
    
    this.setupStateManagement();
  }
  
  private setupStateManagement(): void {
    // Configure persistence
    this.stateManager.configurePersistence({
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      maxSaves: 5,
      version: 1
    });
    
    // Set up state machines
    this.setupPlayerState();
    this.setupGameWorldState();
    this.setupInventoryState();
    
    // Link related state machines
    this.stateManager.linkStateMachines([
      'player',
      'inventory',
      'equipment'
    ]);
  }
  
  private setupPlayerState(): void {
    const playerState = this.stateManager.createStateMachine({
      initialState: PlayerState.IDLE,
      states: {
        [PlayerState.IDLE]: {
          allowedTransitions: [
            PlayerState.WALKING,
            PlayerState.JUMPING
          ],
          onEnter: () => this.handlePlayerIdle()
        },
        // ... other states
      }
    });
    
    this.stateManager.registerStateMachine('player', playerState);
  }
  
  async saveGameState(): Promise<void> {
    await Promise.all([
      this.stateManager.saveState('player'),
      this.stateManager.saveState('gameWorld'),
      this.stateManager.saveState('inventory')
    ]);
  }
  
  async loadGameState(): Promise<void> {
    await Promise.all([
      this.stateManager.loadState('player'),
      this.stateManager.loadState('gameWorld'),
      this.stateManager.loadState('inventory')
    ]);
  }
}
```

## Related Documentation
- [State Management API](../../state/state-management.md)
- [State Testing Guidelines](../../../testing/unit/state.md)
- [Service Registry Documentation](./service-registry-api.md) 