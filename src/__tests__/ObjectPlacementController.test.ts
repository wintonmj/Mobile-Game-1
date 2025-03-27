import { Dungeon } from '../models/Dungeon';
import { ObjectPlacementController } from '../controllers/ObjectPlacementController';
import { Placeable } from '../models/interfaces/Placeable';

// Create a simple MockPlaceable class for testing
class MockPlaceable implements Placeable {
  private x: number = 0;
  private y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getPreferredPosition(): { x: number; y: number } | null {
    return { x: this.x, y: this.y };
  }

  public getPlacementPriority(): number {
    return 1;
  }

  public getPlacementConstraints() {
    return [];
  }
}

describe('ObjectPlacementController', () => {
  let dungeon: Dungeon;
  let controller: ObjectPlacementController;

  beforeEach(() => {
    // Create a test dungeon with some walkable areas
    dungeon = new Dungeon(10, 10);
    controller = new ObjectPlacementController(dungeon);

    // Ensure specific positions are walkable for testing
    for (let x = 1; x < 9; x++) {
      for (let y = 1; y < 9; y++) {
        dungeon.ensureWalkable(x, y);
      }
    }
  });

  test('registerObject assigns a unique ID', () => {
    const obj1 = new MockPlaceable();
    const obj2 = new MockPlaceable();

    const id1 = controller.registerObject(obj1);
    const id2 = controller.registerObject(obj2);

    // IDs should be unique
    expect(id1).not.toEqual(id2);

    // Registering the same object again should return the same ID
    const id1Again = controller.registerObject(obj1);
    expect(id1).toEqual(id1Again);
  });

  test('placeObject places object at valid position', () => {
    const tileSize = dungeon.tileSize;
    const obj = new MockPlaceable(tileSize * 2, tileSize * 2);

    // Place the object
    const result = controller.placeObject(obj);

    // Should succeed because the position is valid
    expect(result).toBe(true);

    // Position should remain the same
    const position = obj.getPosition();
    expect(position.x).toBe(tileSize * 2);
    expect(position.y).toBe(tileSize * 2);
  });

  test('placeObject finds alternative position if current is invalid', () => {
    const tileSize = dungeon.tileSize;

    // Create object at an invalid position (on a wall)
    const obj = new MockPlaceable(0, 0);

    // Place the object
    const result = controller.placeObject(obj);

    // Should succeed by finding an alternative position
    expect(result).toBe(true);

    // Position should be changed to a valid position
    const position = obj.getPosition();
    expect(position.x).not.toBe(0);
    expect(position.y).not.toBe(0);

    // New position should be in a walkable area
    const gridPos = controller.getGridSystem().worldToGrid(position.x, position.y);
    expect(dungeon.isWalkable(gridPos.x, gridPos.y)).toBe(true);
  });

  test('unregisterObject removes an object from the controller', () => {
    const obj = new MockPlaceable();
    const id = controller.registerObject(obj);

    // Unregister the object
    controller.unregisterObject(obj);

    // Registering again should generate a new ID
    const newId = controller.registerObject(obj);
    expect(newId).not.toEqual(id);
  });
});
