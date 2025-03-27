# Object Placement Controller Design Document

## Test Considerations

### Test-Driven Approach
- **Unit tests for placement algorithms**: Test placement strategies with different dungeon configurations
- **Collision detection tests**: Ensure objects cannot be placed in the same position or invalid locations
- **Priority placement tests**: Verify preferred positions are used when available
- **Fallback behavior tests**: Ensure graceful handling when preferred positions aren't available
- **Boundary tests**: Test behavior at map edges and with full/near-full maps
- **Mock testing**: Use mock dungeons to test various scenarios without complex setups
- **State persistence tests**: Validate correct saving/loading of placement states

### Test Coverage Goals
- Cover all placement methods and strategies
- Test interaction with different object types (Player, NPCs, resources)
- Test behavior with different dungeon configurations
- Include edge cases like full maps or restricted areas
- Test performance with large numbers of objects

## High-Level Design

### Problem Statement
The current implementation uses hardcoded positions for player and NPCs, with manual calls to `ensureWalkable()`. This approach lacks flexibility, creates potential positioning conflicts, and duplicates code across different object types.

### Solution Overview
Create an **Object Placement Controller** that:
1. Manages positioning of all game objects (Player, NPCs, resources, items)
2. Ensures objects are placed in valid, non-overlapping positions
3. Respects placement priorities and preferences
4. Provides fallback strategies when preferred positions aren't available
5. Integrates with the existing MVC architecture
6. Efficiently handles large numbers of objects with spatial partitioning
7. Supports serialization for game state persistence
8. Provides flexible constraint systems for complex placement rules

### Why This Solution?
- **Follows MVC pattern**: Aligns with the existing architecture
- **Separation of concerns**: Removes placement logic from individual objects
- **Eliminates duplication**: Centralizes placement code in one controller
- **Extensibility**: Easy to add new object types and placement strategies
- **Maintainability**: Easier to debug and modify placement behavior in one place
- **Performance**: Optimized for handling many objects efficiently

## Component Design

### Grid Abstraction
Creates an abstraction layer for the underlying coordinate system:
- Decouples placement logic from specific coordinate implementations
- Allows for different grid types (square, hex, etc.)
- Provides conversion between game world and grid coordinates
- Handles grid cell size and boundaries

### Placeable Interface
Defines the contract for any object that can be placed in the game world:
- Provides position management (get/set)
- Defines size and collision properties
- Allows specification of placement preferences
- Includes serialization methods for state persistence

### PlacementConstraint System
Defines rules that govern valid placements:
- Basic constraints (walkable, not occupied)
- Proximity constraints (near/far from specific objects)
- Environmental constraints (terrain type, light level)
- Composite constraints (AND/OR combinations)

### Object Placement Controller
Core controller responsible for:
- Managing registration of placeable objects
- Finding valid positions based on object requirements and constraints
- Ensuring no placement conflicts
- Applying placement strategies based on object type
- Tracking occupied positions using spatial partitioning for performance
- Handling object removal and repositioning
- Supporting serialization for game saves
- Providing debugging visualization tools
- Handling deferred and batch placements

### Placement Strategy Pattern
Encapsulates different algorithms for placing objects:
- Random placement
- Grid-based placement
- Proximity-based placement (near/far from other objects)
- Zone-based placement (in specific dungeon areas)
- Weighted distribution placement

### Integration Points
- **GameController**: Owns the PlacementController and provides access
- **GameScene**: Uses PlacementController for NPCs and items
- **Player/NPC classes**: Implement Placeable interface
- **EventSystem**: For loose coupling between controller and placeables

## Function Specifications

### Grid Interface
```typescript
interface GridSystem {
  worldToGrid(x: number, y: number): GridPosition;
  gridToWorld(gridPos: GridPosition): Phaser.Math.Vector2;
  isValidPosition(gridPos: GridPosition): boolean;
  getCellSize(): { width: number, height: number };
  getNeighbors(gridPos: GridPosition): GridPosition[];
}

type GridPosition = { x: number, y: number };
```

### Placeable Interface
```typescript
interface Placeable {
  getPosition(): Phaser.Math.Vector2;
  setPosition(x: number, y: number): void;
  getPreferredPosition(): Phaser.Math.Vector2 | null;
  getPlacementPriority(): number; // Higher numbers = higher priority
  getPlacementConstraints(): PlacementConstraint[];
  serialize(): any; // For saving state
  deserialize(data: any): void; // For loading state
}
```

### PlacementConstraint Interface
```typescript
interface PlacementConstraint {
  isSatisfied(position: GridPosition, controller: ObjectPlacementController): boolean;
  getDescription(): string; // For debugging
}
```

### ObjectPlacementController
```typescript
class ObjectPlacementController {
  constructor(gridSystem: GridSystem);

  // Registration
  registerObject(object: Placeable): void;
  unregisterObject(object: Placeable): void;
  
  // Position management
  placeObject(object: Placeable): boolean;
  placeObjects(objects: Placeable[]): void;
  queuePlacement(object: Placeable): void; // For deferred placement
  processPendingPlacements(): void;
  
  // Position validation
  isPositionValid(x: number, y: number, constraints?: PlacementConstraint[]): boolean;
  isPositionOccupied(x: number, y: number): boolean;
  
  // Position finding
  findValidPosition(constraints: PlacementConstraint[], preferredX?: number, preferredY?: number): Phaser.Math.Vector2;
  findValidPositionNear(x: number, y: number, radius: number, constraints?: PlacementConstraint[]): Phaser.Math.Vector2;
  
  // Placement strategies
  usePlacementStrategy(object: Placeable, strategy: PlacementStrategy): boolean;
  
  // Error recovery
  getNextBestPosition(object: Placeable): Phaser.Math.Vector2; // When preferred positions fail
  
  // Spatial partitioning
  getSpatialIndex(): SpatialIndex; // For optimized position lookups
  
  // State management
  serialize(): any; // For saving placement state
  deserialize(data: any): void; // For loading placement state
  reset(): void; // Clear all placement data
  
  // Dynamic recalculation
  invalidateArea(x: number, y: number, width: number, height: number): void; // When map changes
  recalculatePositions(area?: {x: number, y: number, width: number, height: number}): void;
  
  // Debugging
  visualizeValidPositions(constraints: PlacementConstraint[]): void; // Debug helper
  visualizeOccupiedPositions(): void; // Debug helper
}
```

### SpatialIndex Interface
```typescript
interface SpatialIndex {
  insert(id: string, x: number, y: number, width?: number, height?: number): void;
  remove(id: string): void;
  query(x: number, y: number, width?: number, height?: number): string[]; // Returns IDs
  clear(): void;
}
```

### PlacementStrategy Interface
```typescript
interface PlacementStrategy {
  findPosition(controller: ObjectPlacementController, object: Placeable): Phaser.Math.Vector2 | null;
  getName(): string; // For debugging and serialization
}
```

### Implementation Details

#### State Management
1. Controller maintains internal state of all object placements
2. Provides serialization/deserialization methods for game saves
3. Implements reset capabilities for level transitions
4. Handles persistence across game sessions

#### Spatial Partitioning for Performance
1. Uses quadtree or grid-based spatial indexing for efficient position queries
2. Avoids O(n) lookups when checking occupied positions
3. Optimized for both sparse and dense object distributions
4. Provides spatial queries for finding nearby objects efficiently

#### Registration Flow
1. Objects register with the controller on creation
2. Controller maintains a registry of placed objects and their positions
3. When objects are destroyed, they unregister from the controller
4. Loose coupling via events to avoid circular dependencies

#### Placement Algorithm
1. Check if the object has a preferred position
2. Validate position against all applicable constraints
3. If preferred position is valid, place object there
4. If preferred position is invalid, use fallback strategy:
   - Try positions near preferred position in expanding radius
   - Apply constraint-based filtering to potential positions
   - If no nearby position works, try random valid positions
5. If placement fails, queue for later placement or use error recovery strategy
6. If placement is successful, mark position as occupied in spatial index

#### Error Recovery
1. Define fallback mechanisms for failed placements
2. Implement priority-based conflict resolution
3. Provide options to relax constraints gradually
4. Allow for explicit handling of placement failures

#### Priority Handling
1. Sort objects by placement priority
2. Place high-priority objects first
3. Low-priority objects work around existing high-priority placements
4. Support deferred placement for non-critical objects

#### Constraint System
1. Implement a flexible constraint framework
2. Support compound constraints (AND, OR, NOT)
3. Allow custom constraint implementations
4. Provide common constraints out of the box (proximity, terrain, density)

#### Dynamic Recalculation
1. Track areas affected by game world changes
2. Efficiently recalculate only affected positions
3. Support prioritized recalculation for critical objects
4. Provide batch recalculation for performance

## Integration Plan

1. Create the Grid abstraction and implementation
2. Implement the SpatialIndex for performance optimization
3. Create the Placeable interface and constraint system
4. Develop the ObjectPlacementController with core functionality
5. Implement basic placement strategies
6. Add serialization support for game state persistence
7. Create visualization and debugging tools
8. Update Player class to implement Placeable
9. Update NPC classes to implement Placeable
10. Modify GameController to create and expose the ObjectPlacementController
11. Update GameScene to use the controller for NPC placement
12. Add unit tests for all components
13. Refactor existing code to remove hardcoded positions
14. Add performance tests with large numbers of objects 