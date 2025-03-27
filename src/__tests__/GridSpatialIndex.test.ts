import { Dungeon } from '../models/Dungeon';
import { DungeonGridSystem } from '../models/DungeonGridSystem';
import { GridSpatialIndex } from '../models/GridSpatialIndex';

describe('GridSpatialIndex', () => {
  let dungeon: Dungeon;
  let gridSystem: DungeonGridSystem;
  let spatialIndex: GridSpatialIndex;

  beforeEach(() => {
    dungeon = new Dungeon(10, 10);
    gridSystem = new DungeonGridSystem(dungeon);
    spatialIndex = new GridSpatialIndex(gridSystem);
  });

  test('insert adds an object to the spatial index', () => {
    spatialIndex.insert('obj1', 32, 32);
    expect(spatialIndex.query(32, 32)).toEqual(['obj1']);
  });

  test('remove removes an object from the spatial index', () => {
    spatialIndex.insert('obj1', 32, 32);
    spatialIndex.remove('obj1');
    expect(spatialIndex.query(32, 32)).toEqual([]);
  });

  test('query returns objects at a specific position', () => {
    spatialIndex.insert('obj1', 32, 32);
    spatialIndex.insert('obj2', 64, 64);
    spatialIndex.insert('obj3', 32, 64);

    expect(spatialIndex.query(32, 32)).toEqual(['obj1']);
    expect(spatialIndex.query(64, 64)).toEqual(['obj2']);
    expect(spatialIndex.query(32, 64)).toEqual(['obj3']);
    expect(spatialIndex.query(100, 100)).toEqual([]);
  });

  test('query returns objects within an area', () => {
    spatialIndex.insert('obj1', 32, 32);
    spatialIndex.insert('obj2', 64, 64);
    spatialIndex.insert('obj3', 32, 64);

    // Query a 2x2 area
    const results = spatialIndex.query(32, 32, 64, 64);

    // Should find all three objects
    expect(results.length).toBe(3);
    expect(results).toContain('obj1');
    expect(results).toContain('obj2');
    expect(results).toContain('obj3');
  });

  test('clear removes all objects from the spatial index', () => {
    spatialIndex.insert('obj1', 32, 32);
    spatialIndex.insert('obj2', 64, 64);
    spatialIndex.clear();

    expect(spatialIndex.query(32, 32)).toEqual([]);
    expect(spatialIndex.query(64, 64)).toEqual([]);
  });

  test('objects with width and height occupy multiple cells', () => {
    // Insert an object with width and height spanning multiple cells
    const tileSize = dungeon.tileSize;
    spatialIndex.insert('obj1', 32, 32, tileSize * 2, tileSize * 2);

    // Should be present in all four cells it occupies
    expect(spatialIndex.query(32, 32)).toContain('obj1');
    expect(spatialIndex.query(32 + tileSize, 32)).toContain('obj1');
    expect(spatialIndex.query(32, 32 + tileSize)).toContain('obj1');
    expect(spatialIndex.query(32 + tileSize, 32 + tileSize)).toContain('obj1');
  });

  test('moving an object updates its position in the spatial index', () => {
    spatialIndex.insert('obj1', 32, 32);

    // Move the object to a new position
    spatialIndex.insert('obj1', 64, 64);

    // Should no longer be at the old position
    expect(spatialIndex.query(32, 32)).toEqual([]);

    // Should be at the new position
    expect(spatialIndex.query(64, 64)).toEqual(['obj1']);
  });
});
