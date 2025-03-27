import { jest } from '@jest/globals';
import { Dungeon, TileType } from '../../models/Dungeon';
import { Player } from '../../models/Player';
import { Actions } from '../../models/Actions';
import { InputController } from '../../controllers/InputController';

/**
 * Creates a mock Phaser scene for testing
 */
export function createMockScene() {
  const mockGraphics = {
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

  const mockLoop = { delta: 16 }; // 16ms = ~60fps

  return {
    add: {
      graphics: jest.fn().mockReturnValue(mockGraphics),
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn(),
        setOrigin: jest.fn(),
        play: jest.fn(),
        on: jest.fn(),
      }),
    },
    game: {
      loop: mockLoop,
    },
    updatePlayerSprite: jest.fn(),
    playerView: {
      onActionComplete: jest.fn(),
    },
    graphics: mockGraphics,
  };
}

/**
 * Creates a mock Dungeon with customizable dimensions and tile patterns
 */
export function createMockDungeon(
  width = 10,
  height = 10,
  tileSize = 32,
  tilePattern: (x: number, y: number) => TileType = (x, y) => ((x + y) % 2 === 0 ? 0 : 1)
) {
  return {
    getSize: jest.fn().mockReturnValue({ width: width * tileSize, height: height * tileSize }),
    tileSize,
    getTileAt: jest.fn(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (...args: any[]) => {
        const x = args[0] as number;
        const y = args[1] as number;
        return tilePattern(x, y);
      }
    ),
    isWalkable: jest.fn(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (...args: any[]) => {
        const x = args[0] as number;
        const y = args[1] as number;
        return tilePattern(x, y) === 0;
      }
    ),
    width,
    height,
  } as unknown as jest.Mocked<Dungeon>;
}

/**
 * Creates a mock Player for testing
 */
export function createMockPlayer() {
  return {
    setPosition: jest.fn(),
    getPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
    setDirection: jest.fn(),
    getDirection: jest.fn().mockReturnValue('down'),
    toggleWalking: jest.fn(),
    isWalkingMode: jest.fn().mockReturnValue(false),
    getSpeed: jest.fn().mockReturnValue(200),
    setAction: jest.fn(),
    getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE),
    toggleCarrying: jest.fn(),
    takeDamage: jest.fn(),
    getStatus: jest.fn().mockReturnValue({
      position: { x: 100, y: 100 },
      direction: 'down',
      action: Actions.IDLE,
    }),
  } as unknown as jest.Mocked<Player>;
}

/**
 * Creates a mock InputController for testing
 */
export function createMockInputController(_scene: Phaser.Scene, _player: Player) {
  return {
    init: jest.fn(),
    update: jest.fn(),
    getMovementVector: jest.fn().mockReturnValue({ x: 0, y: 0 }),
    getMovementDirection: jest.fn().mockReturnValue(null),
    isMoving: jest.fn().mockReturnValue(false),
    isRunning: jest.fn().mockReturnValue(false),
    isActionPressed: jest.fn().mockReturnValue(false),
  } as unknown as jest.Mocked<InputController>;
}

/**
 * Sets up Jest to mock all required Phaser components
 */
export function setupPhaserMocks() {
  // Use our dedicated Phaser mock instead of creating one inline
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  jest.mock('phaser', () => require('../mocks/phaser').default);
}
