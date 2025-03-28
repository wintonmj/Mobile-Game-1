// Mock Phaser module for testing
import { jest } from '@jest/globals';

const MockPhaser = {
  Game: jest.fn().mockImplementation(() => ({
    scale: {
      setMode: jest.fn(),
      resize: jest.fn(),
    },
    loop: {
      delta: 16, // ~60fps
    },
  })),
  Scene: jest.fn().mockImplementation(() => ({
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
    load: {
      image: jest.fn(),
      audio: jest.fn(),
      json: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
    },
    input: {
      keyboard: {
        createCursorKeys: jest.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false },
          shift: { isDown: false },
          space: { isDown: false },
        }),
        addKeys: jest.fn().mockReturnValue({
          w: { isDown: false },
          a: { isDown: false },
          s: { isDown: false },
          d: { isDown: false },
          shift: { isDown: false },
          space: { isDown: false },
        }),
      },
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
  })),
  GameObjects: {
    Graphics: jest.fn().mockImplementation(() => ({
      clear: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      beginPath: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      closePath: jest.fn().mockReturnThis(),
      strokePath: jest.fn().mockReturnThis(),
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
    })),
    Sprite: jest.fn().mockImplementation(() => ({
      setPosition: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    Text: jest.fn().mockImplementation(() => ({
      setPosition: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    Container: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        UP: 38,
        LEFT: 37,
        DOWN: 40,
        RIGHT: 39,
        SHIFT: 16,
        SPACE: 32,
        ONE: 49,
        TWO: 50,
        THREE: 51,
        FOUR: 52,
        FIVE: 53,
        SIX: 54,
        E: 69,
        R: 82,
      },
      Key: jest.fn().mockImplementation(() => ({
        isDown: false,
      })),
    },
  },
  Animations: {
    Animation: jest.fn(),
    AnimationFrame: jest.fn(),
  },
  AUTO: 'auto',
  Scale: {
    FIT: 'FIT',
    RESIZE: 'RESIZE',
    CENTER_BOTH: 'CENTER_BOTH',
  },
  Physics: {
    Arcade: {
      World: jest.fn(),
      Sprite: jest.fn(),
      Body: jest.fn(),
    },
  },
  WEBGL: 'WEBGL',
  CANVAS: 'CANVAS',
};

export default MockPhaser;
