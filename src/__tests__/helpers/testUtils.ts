import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';

/**
 * Creates a standard mock scene that can be used across tests
 */
export function createMockScene() {
  return {
    game: {
      loop: { delta: 16 } // 16ms = ~60fps
    },
    add: {
      graphics: jest.fn().mockReturnValue({
        clear: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        beginPath: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        closePath: jest.fn().mockReturnThis(),
        strokePath: jest.fn().mockReturnThis(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
      }),
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis(),
      }),
    },
    input: {
      keyboard: {
        createCursorKeys: jest.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false },
          shift: { isDown: false },
          space: { isDown: false }
        }),
        addKeys: jest.fn().mockReturnValue({
          w: { isDown: false },
          a: { isDown: false },
          s: { isDown: false },
          d: { isDown: false },
          shift: { isDown: false },
          space: { isDown: false },
          '1': { isDown: false },
          '2': { isDown: false },
          '3': { isDown: false },
          '4': { isDown: false },
          '5': { isDown: false },
          '6': { isDown: false },
          e: { isDown: false },
          r: { isDown: false }
        })
      }
    },
    updatePlayerSprite: jest.fn(),
    playerView: {
      onActionComplete: jest.fn()
    },
    time: {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn(),
      }),
      delayedCall: jest.fn(),
    },
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };
}

/**
 * Creates a standard mock player that can be used across tests
 */
export function createMockPlayer() {
  return {
    setPosition: jest.fn(),
    getPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
    setDirection: jest.fn(),
    getDirection: jest.fn().mockReturnValue('down'),
    setAction: jest.fn(),
    getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE),
    getSpeed: jest.fn().mockReturnValue(200),
    toggleWalking: jest.fn(),
    isWalkingMode: jest.fn().mockReturnValue(false),
    getStatus: jest.fn().mockReturnValue({
      position: { x: 100, y: 100 },
      direction: 'down',
      action: Actions.IDLE
    }),
  };
}

/**
 * Creates standard mock input controller functions that can be used across tests
 */
export function createMockInputController() {
  return {
    init: jest.fn(),
    update: jest.fn(),
    getMovementVector: jest.fn().mockReturnValue({ x: 0, y: 0 }),
    getMovementDirection: jest.fn().mockReturnValue(null),
    isMoving: jest.fn().mockReturnValue(false),
    isRunning: jest.fn().mockReturnValue(false),
    isActionPressed: jest.fn().mockReturnValue(false),
  };
} 