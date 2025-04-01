# State Management Technical Design

## Document Purpose
This document provides a detailed technical design for state management in our browser-based RPG. It defines the patterns, implementation approaches, and best practices for handling game state, persistence, and browser storage optimization.

## Related Documents
- [MVPDesign.md](mdc:docs/design/MVPDesign.md) - MVP design specifications and requirements
- [MVPHighLevelArchitecture.md](mdc:docs/architecture/patterns/MVPHighLevelArchitecture.md) - Technical architecture overview
- [TechnicalStack.md](mdc:docs/architecture/TechnicalStack.md) - Technical stack implementation details

## Contents
1. State Management Architecture
2. State Organization and Hierarchy
3. State Persistence Strategy
4. Browser Storage Optimization
5. Implementation Patterns
6. State Synchronization
7. Performance Considerations
8. Examples and Usage Patterns

## 1. State Management Architecture

### 1.1 Core Architecture
The state management architecture follows a hybrid approach combining the service pattern with event-driven communication. This provides centralized state control while maintaining loose coupling between components.

```
src/
├── models/
│   └── state/               # State definitions
│       ├── game.state.ts    # Core game state interface
│       ├── player.state.ts  # Player state interface
│       ├── world.state.ts   # World state interface
│       └── ui.state.ts      # UI state interface
├── services/
│   └── state/
│       ├── state.service.ts # Central state management
│       ├── serialization.service.ts  # State serialization
│       └── persistence.service.ts    # State persistence
└── events/
    └── state/
        └── state.events.ts  # State change events
```

### 1.2 State Management Principles
1. **Single Source of Truth**: Core state is managed centrally through the StateService
2. **Immutable State Updates**: State changes follow immutability patterns for predictability
3. **Event-Driven Updates**: Components react to state changes through the event system
4. **Scoped State Access**: Services access only the state portions they need
5. **Lazy Loading**: State is loaded only when needed to optimize memory usage

## 2. State Organization and Hierarchy

### 2.1 State Hierarchy
The game state follows a hierarchical structure to organize different aspects of the game:

```
GameState
├── PlayerState
│   ├── CharacterState
│   │   ├── Stats
│   │   ├── Equipment
│   │   └── Abilities
│   ├── InventoryState
│   │   ├── Items
│   │   └── Resources
│   └── ProgressionState
│       ├── Level
│       ├── Experience
│       └── Achievements
├── WorldState
│   ├── RegionStates
│   │   ├── TownState
│   │   ├── DungeonState
│   │   └── OutdoorAreaStates
│   ├── NPCStates
│   ├── ResourceNodeStates
│   └── EnvironmentState
│       ├── TimeState
│       └── WeatherState
├── QuestState
│   ├── MainQuestProgress
│   └── SideQuestProgress
└── UIState
    ├── DialogState
    ├── MenuState
    └── NotificationState
```

### 2.2 State Interfaces
Each state component is defined by a TypeScript interface with clear property types:

```typescript
interface GameState {
  player: PlayerState;
  world: WorldState;
  quests: QuestState;
  ui: UIState;
  settings: GameSettings;
  version: string;
}

interface PlayerState {
  character: CharacterState;
  inventory: InventoryState;
  progression: ProgressionState;
  companions: CompanionState[];
}

interface WorldState {
  regions: Record<string, RegionState>;
  npcs: Record<string, NPCState>;
  resourceNodes: Record<string, ResourceNodeState>;
  environment: EnvironmentState;
}
```

## 3. State Persistence Strategy

### 3.1 Storage Strategy
The state persistence system uses a multi-tiered approach optimized for browser environments:

1. **LocalStorage**:
   - Used for critical game state (player progress, quest state)
   - Size optimized through selective serialization
   - Version-tracked for compatibility

2. **IndexedDB**:
   - Used for larger state components (world state, detailed entity states)
   - Supports chunked state storage for larger worlds
   - Handles asset references and modified asset states

3. **Memory-Only State**:
   - Transient UI state
   - Current scene-specific state
   - Temporary calculation results

### 3.2 Serialization Process
1. **Pre-serialization Processing**:
   - Remove unnecessary properties
   - Convert complex objects to serializable format
   - Optimize recursive structures

2. **Serialization**:
   - JSON serialization with custom type handling
   - Binary serialization for performance-critical data
   - Delta encoding for incremental saves

3. **Compression**:
   - Basic compression for string data
   - Reference-based deduplication
   - State chunking for partial loading/saving

### 3.3 Save/Load Flow
```
[Save Request] → [StateService] → [Pre-serialization] → [Serialization] → [Compression] → [Storage Service]

[Load Request] → [Storage Service] → [Decompression] → [Deserialization] → [State Validation] → [StateService]
```

## 4. Browser Storage Optimization

### 4.1 Storage Size Optimization
1. **Reference System**:
   - Store references to static assets rather than data
   - Use IDs instead of full object copies
   - Implement shared object pools

2. **Delta Encoding**:
   - Store only changes from default state
   - Track modifications with timestamps
   - Implement sparse arrays for large collections

3. **Aggressive Pruning**:
   - Remove unnecessary state data before saving
   - Clear debugging information
   - Exclude derived data that can be recalculated

### 4.2 Storage Quotas and Fallbacks
1. **Storage Limit Detection**:
   - Monitor available storage
   - Implement early warnings for nearing limits
   - Prioritize critical data when space is limited

2. **Fallback Strategies**:
   - Cloud save integration (future feature)
   - Export/import save data as files
   - Graceful degradation with partial saves

3. **Data Integrity**:
   - Checksums for saved data
   - Backup previous save before writing new save
   - Recovery system for corrupted saves

### 4.3 Concrete Examples for Browser Storage Optimization

```typescript
// Example: Delta encoding for world object states
function serializeWorldObject(object: WorldObject, baseline: WorldObject): SerializedDelta {
  const delta: Partial<WorldObject> = {};
  
  // Only store properties that differ from baseline
  for (const key in object) {
    if (JSON.stringify(object[key]) !== JSON.stringify(baseline[key])) {
      delta[key] = object[key];
    }
  }
  
  return {
    id: object.id,
    type: object.type,
    delta: delta
  };
}

// Example: Reference-based serialization
function serializeInventory(inventory: Inventory): SerializedInventory {
  return {
    id: inventory.id,
    items: inventory.items.map(item => ({
      itemId: item.id, // Reference to static item data
      count: item.count,
      modifications: item.modifications // Only store customizations
    }))
  };
}
```

## 5. Implementation Patterns

### 5.1 State Service Pattern
The StateService acts as the central manager for game state:

```typescript
// State service implementation pattern
class StateService {
  private gameState: GameState;
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initDefaultState();
  }
  
  // Get state with immutability
  getState<T>(selector: (state: GameState) => T): T {
    return selector(this.gameState);
  }
  
  // Update state with immutability
  updateState<T>(
    selector: (state: GameState) => T,
    updater: (selectedState: T) => T
  ): void {
    const selectedState = selector(this.gameState);
    const updatedSelectedState = updater(selectedState);
    
    // Create new state with the update
    this.gameState = this.createUpdatedState(
      this.gameState,
      selector,
      updatedSelectedState
    );
    
    // Emit state change event
    this.eventBus.emit('state.changed', {
      path: this.getSelectorPath(selector),
      newValue: updatedSelectedState
    });
  }
  
  // Save state to persistent storage
  async saveState(): Promise<void> {
    const serializedState = await this.serializationService.serialize(this.gameState);
    return this.persistenceService.saveGame(serializedState);
  }
  
  // Load state from persistent storage
  async loadState(saveId: string): Promise<void> {
    const serializedState = await this.persistenceService.loadGame(saveId);
    this.gameState = await this.serializationService.deserialize(serializedState);
    this.eventBus.emit('state.loaded', { gameState: this.gameState });
  }
}
```

### 5.2 State Machine Pattern
For complex state transitions, such as character states or quest progression:

```typescript
// State machine for character states
class CharacterStateMachine {
  private character: Character;
  private currentState: CharacterStateType;
  private stateService: StateService;
  
  constructor(character: Character, stateService: StateService) {
    this.character = character;
    this.stateService = stateService;
    this.currentState = CharacterStateType.IDLE;
  }
  
  // Transition to new state if valid
  transition(newState: CharacterStateType): boolean {
    // Check if transition is valid
    if (!this.isValidTransition(this.currentState, newState)) {
      return false;
    }
    
    // Execute exit actions for current state
    this.executeExitActions(this.currentState);
    
    // Update state
    const prevState = this.currentState;
    this.currentState = newState;
    
    // Execute entry actions for new state
    this.executeEntryActions(newState);
    
    // Update state in state service
    this.stateService.updateState(
      state => state.player.character.stateType,
      () => newState
    );
    
    return true;
  }
  
  // Get current state
  getCurrentState(): CharacterStateType {
    return this.currentState;
  }
  
  // State transition validation
  private isValidTransition(from: CharacterStateType, to: CharacterStateType): boolean {
    // Implementation of state transition rules
    const transitions = {
      [CharacterStateType.IDLE]: [
        CharacterStateType.WALKING,
        CharacterStateType.RUNNING,
        CharacterStateType.ATTACKING,
        CharacterStateType.INTERACTING
      ],
      [CharacterStateType.WALKING]: [
        CharacterStateType.IDLE,
        CharacterStateType.RUNNING,
        CharacterStateType.ATTACKING
      ],
      // Additional state transitions...
    };
    
    return transitions[from]?.includes(to) || false;
  }
}
```

### 5.3 Observer Pattern for State Changes
Components observe state changes through the event system:

```typescript
// Component subscribing to state changes
class PlayerHUDComponent {
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    
    // Subscribe to relevant state changes
    this.eventBus.on('state.changed', this.handleStateChange.bind(this));
  }
  
  private handleStateChange(event: StateChangeEvent): void {
    // Check if the change affects this component
    if (event.path === 'player.character.health' ||
        event.path === 'player.character.mana') {
      this.updateDisplay();
    }
  }
  
  private updateDisplay(): void {
    // Update UI based on new state
  }
}
```

## 6. State Synchronization

### 6.1 Scene State Synchronization
When transitioning between scenes, state must be synchronized:

```typescript
// Scene state synchronization pattern
class GameScene extends Phaser.Scene {
  private stateService: StateService;
  private sceneEntities: Map<string, Entity> = new Map();
  
  constructor(stateService: StateService) {
    super({ key: 'GameScene' });
    this.stateService = stateService;
  }
  
  create(): void {
    // Load scene state from global state
    const sceneState = this.stateService.getState(
      state => state.world.regions[this.getCurrentRegionId()]
    );
    
    // Create entities based on state
    this.createEntitiesFromState(sceneState);
    
    // Subscribe to relevant state changes
    this.subscribeToStateChanges();
  }
  
  private createEntitiesFromState(sceneState: RegionState): void {
    // Create NPCs, objects, etc. from state
    sceneState.npcs.forEach(npcState => {
      const npc = this.createNPC(npcState);
      this.sceneEntities.set(npcState.id, npc);
    });
    
    // Similar for other entity types
  }
  
  private subscribeToStateChanges(): void {
    // Handle state changes relevant to this scene
    this.stateService.eventBus.on('state.changed', (event: StateChangeEvent) => {
      if (event.path.startsWith(`world.regions.${this.getCurrentRegionId()}`)) {
        this.syncEntityWithState(event);
      }
    });
  }
  
  private syncEntityWithState(event: StateChangeEvent): void {
    const pathParts = event.path.split('.');
    const entityId = pathParts[3]; // Assuming path like world.regions.region1.entities.entity1
    
    const entity = this.sceneEntities.get(entityId);
    if (entity) {
      entity.updateFromState(event.newValue);
    }
  }
}
```

### 6.2 Entity State Binding
Individual entities bind to their state representation:

```typescript
// Entity state binding pattern
class GameEntity {
  protected id: string;
  protected stateService: StateService;
  
  constructor(id: string, stateService: StateService) {
    this.id = id;
    this.stateService = stateService;
  }
  
  // Get entity state from game state
  protected getEntityState<T>(): T {
    return this.stateService.getState(state => {
      // Navigate to this entity's state based on ID and type
      // Implementation depends on state structure
    });
  }
  
  // Update entity state
  protected updateEntityState<T>(updater: (state: T) => T): void {
    this.stateService.updateState(
      state => {
        // Navigate to this entity's state based on ID and type
      },
      updater
    );
  }
  
  // Sync visual representation with state
  updateFromState(newState: any): void {
    // Update visual properties based on state
    this.x = newState.position.x;
    this.y = newState.position.y;
    this.setTexture(newState.appearance.texture);
    // Additional property updates
  }
}
```

## 7. Performance Considerations

### 7.1 Memory Optimization
1. **Lazy State Loading**:
   - Load region states only when entering a region
   - Unload inactive region states when memory pressure is high
   - Stream large state components asynchronously

2. **State Pooling**:
   - Use object pools for frequently created/destroyed state objects
   - Reuse state containers when possible
   - Implement flyweight pattern for shared state

3. **Memory Analysis**:
   - Track state size and memory usage
   - Set memory budgets for different state categories
   - Implement memory pressure detection

### 7.2 Computation Optimization
1. **Memoization**:
   - Cache derived state calculations
   - Invalidate caches only when dependencies change
   - Use selector patterns with equality checking

2. **Batched Updates**:
   - Batch multiple state changes in a single update
   - Defer non-critical state updates
   - Group related state changes

3. **State Access Patterns**:
   - Optimize state traversal for common access patterns
   - Index frequently accessed state properties
   - Flatten deep state hierarchies when appropriate

## 8. Examples and Usage Patterns

### 8.1 Player State Management

```typescript
// Accessing and updating player state
class PlayerController {
  private stateService: StateService;
  
  constructor(stateService: StateService) {
    this.stateService = stateService;
  }
  
  // Update player position
  updatePosition(x: number, y: number): void {
    this.stateService.updateState(
      state => state.player.character.position,
      position => ({ ...position, x, y })
    );
  }
  
  // Add item to inventory
  addItemToInventory(itemId: string, count: number): void {
    this.stateService.updateState(
      state => state.player.inventory,
      inventory => {
        const existingItem = inventory.items.find(item => item.id === itemId);
        
        if (existingItem) {
          // Update existing item
          return {
            ...inventory,
            items: inventory.items.map(item => 
              item.id === itemId 
                ? { ...item, count: item.count + count }
                : item
            )
          };
        } else {
          // Add new item
          return {
            ...inventory,
            items: [...inventory.items, { id: itemId, count }]
          };
        }
      }
    );
  }
}
```

### 8.2 World State Persistence

```typescript
// Persist and load world state
class WorldPersistenceManager {
  private stateService: StateService;
  private persistenceService: PersistenceService;
  
  constructor(stateService: StateService, persistenceService: PersistenceService) {
    this.stateService = stateService;
    this.persistenceService = persistenceService;
  }
  
  // Save current region state
  async saveCurrentRegion(): Promise<void> {
    const currentRegionId = this.stateService.getState(
      state => state.player.currentRegionId
    );
    
    const regionState = this.stateService.getState(
      state => state.world.regions[currentRegionId]
    );
    
    // Optimize state before saving
    const optimizedState = this.optimizeStateForStorage(regionState);
    
    // Save to storage
    await this.persistenceService.saveRegionState(currentRegionId, optimizedState);
  }
  
  // Load a region state
  async loadRegion(regionId: string): Promise<void> {
    // Check if already in memory
    const inMemory = this.stateService.getState(
      state => !!state.world.regions[regionId]
    );
    
    if (!inMemory) {
      // Load from storage
      const storedState = await this.persistenceService.loadRegionState(regionId);
      
      if (storedState) {
        // Update game state with loaded region
        this.stateService.updateState(
          state => state.world.regions,
          regions => ({
            ...regions,
            [regionId]: storedState
          })
        );
      } else {
        // Load default state for this region
        this.loadDefaultRegionState(regionId);
      }
    }
  }
  
  // Optimize state for storage by removing unnecessary data
  private optimizeStateForStorage(regionState: RegionState): OptimizedRegionState {
    return {
      ...regionState,
      // Remove transient or easily recalculated data
      temporaryEffects: undefined,
      derivedData: undefined,
      // Store only modified entities
      entities: this.getModifiedEntities(regionState.entities)
    };
  }
}
```

### 8.3 Save System Integration with Browser Storage

```typescript
// Browser storage with IndexedDB implementation
class BrowserStorageService implements PersistenceService {
  private db: IDBDatabase;
  
  async init(): Promise<void> {
    this.db = await this.openDatabase();
  }
  
  // Save game state
  async saveGame(gameState: SerializedGameState): Promise<void> {
    // Split state into chunks for storage efficiency
    const chunks = this.chunkState(gameState);
    
    // Store in transaction to ensure atomicity
    const transaction = this.db.transaction(['gameState'], 'readwrite');
    const store = transaction.objectStore('gameState');
    
    // Clear previous save
    await this.clearObjectStore(store);
    
    // Store chunks
    for (const [key, value] of Object.entries(chunks)) {
      await this.storeObject(store, key, value);
    }
    
    // Store metadata
    await this.storeObject(store, 'metadata', {
      version: gameState.version,
      timestamp: Date.now(),
      chunkKeys: Object.keys(chunks)
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  // Load game state
  async loadGame(saveId: string): Promise<SerializedGameState> {
    const transaction = this.db.transaction(['gameState'], 'readonly');
    const store = transaction.objectStore('gameState');
    
    // Load metadata first
    const metadata = await this.getObject(store, 'metadata');
    
    if (!metadata) {
      throw new Error('Save metadata not found');
    }
    
    // Load all chunks
    const chunks = {};
    for (const key of metadata.chunkKeys) {
      chunks[key] = await this.getObject(store, key);
    }
    
    // Reassemble state
    return this.reassembleState(chunks, metadata);
  }
  
  // Check available storage
  async getAvailableStorage(): Promise<StorageEstimate> {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate();
    }
    
    return { usage: undefined, quota: undefined };
  }
  
  // Helper to chunk state for efficient storage
  private chunkState(state: SerializedGameState): Record<string, any> {
    const chunks = {
      'player': state.player,
      'settings': state.settings,
      'quests': state.quests,
      'ui': state.ui
    };
    
    // Split world into regions for separate storage
    if (state.world) {
      chunks['world_meta'] = {
        environment: state.world.environment,
        globalState: state.world.globalState
      };
      
      // Store each region separately
      if (state.world.regions) {
        for (const [regionId, regionState] of Object.entries(state.world.regions)) {
          chunks[`world_region_${regionId}`] = regionState;
        }
      }
    }
    
    return chunks;
  }
}
```

This detailed state management design provides a solid foundation for the game's persistence, browser optimization, and state handling needs. It addresses the key requirements from the MVP design while providing concrete implementation patterns that can be followed during development. 