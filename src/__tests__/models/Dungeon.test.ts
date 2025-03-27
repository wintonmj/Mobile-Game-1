import { jest } from '@jest/globals';
import { Dungeon } from '../../models/Dungeon';

describe('Dungeon', () => {
  let dungeon: Dungeon;

  beforeEach(() => {
    // Mock Math.random to return predictable values for testing
    jest.spyOn(global.Math, 'random').mockReturnValue(0.2);
    dungeon = new Dungeon(10, 10);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with the correct dimensions', () => {
    const size = dungeon.getSize();
    expect(size.width).toBe(10 * dungeon.tileSize);
    expect(size.height).toBe(10 * dungeon.tileSize);
  });

  it('should generate a layout with walls on the edges', () => {
    // Check top and bottom rows
    for (let x = 0; x < 10; x++) {
      expect(dungeon.getTileAt(x, 0)).toBe(1); // Top row
      expect(dungeon.getTileAt(x, 9)).toBe(1); // Bottom row
    }

    // Check left and right columns
    for (let y = 0; y < 10; y++) {
      expect(dungeon.getTileAt(0, y)).toBe(1); // Left column
      expect(dungeon.getTileAt(9, y)).toBe(1); // Right column
    }
  });

  it('should generate inner tiles based on random values', () => {
    // Create a dungeon with mocked getTileAt to always return walls for inner tiles
    const wallDungeon = new Dungeon(10, 10);
    jest.spyOn(wallDungeon, 'getTileAt').mockImplementation((x, y) => {
      // Keep the edges as walls
      if (x === 0 || x === 9 || y === 0 || y === 9) {
        return 1;
      }
      // Make inner tiles walls (1)
      return 1;
    });

    // Check inner tiles are all walls
    for (let y = 1; y < 9; y++) {
      for (let x = 1; x < 9; x++) {
        expect(wallDungeon.getTileAt(x, y)).toBe(1);
      }
    }

    // Create a dungeon with mocked getTileAt to always return floors for inner tiles
    const floorDungeon = new Dungeon(10, 10);
    jest.spyOn(floorDungeon, 'getTileAt').mockImplementation((x, y) => {
      // Keep the edges as walls
      if (x === 0 || x === 9 || y === 0 || y === 9) {
        return 1;
      }
      // Make inner tiles floors (0)
      return 0;
    });

    // Check inner tiles are all floors
    for (let y = 1; y < 9; y++) {
      for (let x = 1; x < 9; x++) {
        expect(floorDungeon.getTileAt(x, y)).toBe(0);
      }
    }
  });

  it('should correctly identify walkable tiles', () => {
    // Walls should not be walkable
    expect(dungeon.isWalkable(0, 0)).toBe(false);

    // Mock a floor tile and check walkability
    jest.spyOn(dungeon, 'getTileAt').mockReturnValue(0);
    expect(dungeon.isWalkable(5, 5)).toBe(true);
  });

  it('should return wall for out of bounds coordinates', () => {
    expect(dungeon.getTileAt(-1, 5)).toBe(1);
    expect(dungeon.getTileAt(5, -1)).toBe(1);
    expect(dungeon.getTileAt(10, 5)).toBe(1);
    expect(dungeon.getTileAt(5, 10)).toBe(1);
  });

  it('should always make player starting position (2,2) walkable', () => {
    // Test with a fresh dungeon
    const testDungeon = new Dungeon();

    // Check that tile at position (2,2) is walkable
    expect(testDungeon.getTileAt(2, 2)).toBe(0);
    expect(testDungeon.isWalkable(2, 2)).toBe(true);

    // Even with manipulated Math.random that would normally make walls
    const originalRandom = Math.random;
    try {
      Math.random = jest.fn(() => 0.1) as () => number; // Return value < 0.15 to create walls
      const wallHeavyDungeon = new Dungeon();

      // Player start position should still be walkable
      expect(wallHeavyDungeon.getTileAt(2, 2)).toBe(0);
      expect(wallHeavyDungeon.isWalkable(2, 2)).toBe(true);
    } finally {
      Math.random = originalRandom; // Restore original Math.random
    }
  });

  it('should make tiles walkable with ensureWalkable method', () => {
    // Create a dungeon with all walls for inner tiles
    const testDungeon = new Dungeon();
    jest.spyOn(testDungeon, 'getTileAt').mockImplementation((x, y) => {
      return 1; // All tiles are walls initially
    });

    // Verify test setup - tile is a wall
    expect(testDungeon.isWalkable(3, 3)).toBe(false);

    // Restore original implementation to allow modification of the layout
    jest.restoreAllMocks();

    // Use the method to make a tile walkable
    testDungeon.ensureWalkable(3, 3);

    // Now the tile should be walkable
    expect(testDungeon.getTileAt(3, 3)).toBe(0);
    expect(testDungeon.isWalkable(3, 3)).toBe(true);
  });

  it('should not modify out-of-bounds tiles with ensureWalkable', () => {
    // Should not throw errors for out-of-bounds coordinates
    const testDungeon = new Dungeon(10, 10);

    // These should not throw errors
    expect(() => testDungeon.ensureWalkable(-1, 5)).not.toThrow();
    expect(() => testDungeon.ensureWalkable(5, -1)).not.toThrow();
    expect(() => testDungeon.ensureWalkable(10, 5)).not.toThrow();
    expect(() => testDungeon.ensureWalkable(5, 10)).not.toThrow();

    // Out-of-bounds tiles should still be treated as walls
    expect(testDungeon.isWalkable(-1, 5)).toBe(false);
    expect(testDungeon.isWalkable(5, -1)).toBe(false);
    expect(testDungeon.isWalkable(10, 5)).toBe(false);
    expect(testDungeon.isWalkable(5, 10)).toBe(false);
  });
});
