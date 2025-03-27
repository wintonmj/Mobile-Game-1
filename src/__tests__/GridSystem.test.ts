import { Dungeon } from '../models/Dungeon';
import { DungeonGridSystem } from '../models/DungeonGridSystem';
import { GridPosition } from '../models/interfaces/GridSystem';

describe('DungeonGridSystem', () => {
  let dungeon: Dungeon;
  let gridSystem: DungeonGridSystem;

  beforeEach(() => {
    dungeon = new Dungeon(10, 10); // Create a 10x10 dungeon
    gridSystem = new DungeonGridSystem(dungeon);

    // Make some specific positions walkable for testing
    dungeon.ensureWalkable(1, 1);
    dungeon.ensureWalkable(2, 2);
    dungeon.ensureWalkable(3, 3);
  });

  test('worldToGrid converts world coordinates to grid coordinates', () => {
    const tileSize = dungeon.tileSize;

    // Test several positions
    expect(gridSystem.worldToGrid(0, 0)).toEqual({ x: 0, y: 0 });
    expect(gridSystem.worldToGrid(tileSize, tileSize)).toEqual({ x: 1, y: 1 });
    expect(gridSystem.worldToGrid(tileSize * 2 + 5, tileSize * 3 + 10)).toEqual({ x: 2, y: 3 });

    // Test position in the middle of a tile
    expect(
      gridSystem.worldToGrid(tileSize * 4 + tileSize / 2, tileSize * 5 + tileSize / 2)
    ).toEqual({ x: 4, y: 5 });
  });

  test('gridToWorld converts grid coordinates to world coordinates', () => {
    const tileSize = dungeon.tileSize;

    // World coordinates should be the center of the grid cell
    expect(gridSystem.gridToWorld({ x: 0, y: 0 })).toEqual({
      x: tileSize / 2,
      y: tileSize / 2,
    });

    expect(gridSystem.gridToWorld({ x: 2, y: 3 })).toEqual({
      x: tileSize * 2 + tileSize / 2,
      y: tileSize * 3 + tileSize / 2,
    });
  });

  test('isValidPosition returns true for walkable positions', () => {
    // These positions were made walkable in beforeEach
    expect(gridSystem.isValidPosition({ x: 1, y: 1 })).toBe(true);
    expect(gridSystem.isValidPosition({ x: 2, y: 2 })).toBe(true);
    expect(gridSystem.isValidPosition({ x: 3, y: 3 })).toBe(true);
  });

  test('isValidPosition returns false for unwalkable positions', () => {
    // Edge positions should be walls
    expect(gridSystem.isValidPosition({ x: 0, y: 0 })).toBe(false);
    expect(gridSystem.isValidPosition({ x: 0, y: 5 })).toBe(false);
    expect(gridSystem.isValidPosition({ x: 9, y: 9 })).toBe(false);
  });

  test('getCellSize returns the correct tile size', () => {
    expect(gridSystem.getCellSize()).toEqual({
      width: dungeon.tileSize,
      height: dungeon.tileSize,
    });
  });

  test('getNeighbors returns adjacent walkable positions', () => {
    // Make some positions walkable to test neighbors
    dungeon.ensureWalkable(2, 1);
    dungeon.ensureWalkable(3, 2);
    dungeon.ensureWalkable(2, 3);
    dungeon.ensureWalkable(1, 2);

    const neighbors = gridSystem.getNeighbors({ x: 2, y: 2 });

    // Should find 4 walkable neighbors
    expect(neighbors.length).toBe(4);

    // Check that all expected neighbors are present
    const expectedNeighbors: GridPosition[] = [
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 2 },
    ];

    expectedNeighbors.forEach((expected) => {
      const found = neighbors.some((pos) => pos.x === expected.x && pos.y === expected.y);
      expect(found).toBe(true);
    });
  });
});
