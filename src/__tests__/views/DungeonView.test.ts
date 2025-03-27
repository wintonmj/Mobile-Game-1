import { jest } from '@jest/globals';
import { DungeonView } from '../../views/DungeonView';
import { Dungeon, TileType } from '../../models/Dungeon';

// Mock Phaser
jest.mock('phaser', () => {
  return {
    GameObjects: {
      Graphics: class {
        clear = jest.fn().mockReturnThis();
        lineStyle = jest.fn().mockReturnThis();
        beginPath = jest.fn().mockReturnThis();
        moveTo = jest.fn().mockReturnThis();
        lineTo = jest.fn().mockReturnThis();
        closePath = jest.fn().mockReturnThis();
        strokePath = jest.fn().mockReturnThis();
        fillStyle = jest.fn().mockReturnThis();
        fillRect = jest.fn().mockReturnThis();
      },
    },
  };
});

describe('DungeonView', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockScene: any;
  let mockGraphics: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  let mockDungeon: jest.Mocked<Dungeon>;
  let dungeonView: DungeonView;

  beforeEach(() => {
    // Set up mock graphics object
    /* eslint-disable @typescript-eslint/no-explicit-any */
    mockGraphics = {
      clear: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      beginPath: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      closePath: jest.fn().mockReturnThis(),
      strokePath: jest.fn().mockReturnThis(),
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Set up mock scene
    mockScene = {
      add: {
        graphics: jest.fn().mockReturnValue(mockGraphics),
      },
    };

    // Mock dungeon methods
    mockDungeon = {
      getSize: jest.fn().mockReturnValue({ width: 300, height: 300 }),
      tileSize: 30,
      getTileAt: jest.fn(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (...args: any[]) => {
          const x = args[0] as number;
          const y = args[1] as number;
          // Make a checkerboard pattern for testing
          return (x + y) % 2 === 0 ? 0 : (1 as TileType);
        }
      ),
      isWalkable: jest.fn(),
      generateLayout: jest.fn(),
      width: 10,
      height: 10,
      layout: [],
    } as unknown as jest.Mocked<Dungeon>;

    // Create dungeon view
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    dungeonView = new DungeonView(mockScene as any, mockDungeon);
  });

  it('should create graphics in constructor', () => {
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  it('should clear graphics when rendering', () => {
    dungeonView.render();
    expect(mockGraphics.clear).toHaveBeenCalled();
  });

  it('should draw grid lines', () => {
    dungeonView.render();

    // Should draw horizontal and vertical grid lines
    expect(mockGraphics.lineStyle).toHaveBeenCalledWith(1, 0x333333, 0.5);
    expect(mockGraphics.beginPath).toHaveBeenCalled();
    expect(mockGraphics.moveTo).toHaveBeenCalled();
    expect(mockGraphics.lineTo).toHaveBeenCalled();
    expect(mockGraphics.strokePath).toHaveBeenCalled();
  });

  it('should draw tiles based on dungeon data', () => {
    dungeonView.render();

    // Should get tile data for each position
    expect(mockDungeon.getTileAt).toHaveBeenCalled();

    // Should draw rectangles for each tile
    expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x666666); // Wall
    expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x444444); // Floor
    expect(mockGraphics.fillRect).toHaveBeenCalled();
  });
});
