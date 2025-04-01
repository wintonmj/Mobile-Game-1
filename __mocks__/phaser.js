import { jest } from '@jest/globals';

class Scene {
  constructor(config) {
    Object.assign(this, config);
    
    // Set up add property with mock functions
    this.add = {
      sprite: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      })),
      image: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      })),
      text: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }))
    };

    // Set up input property with mock functions
    this.input = {
      keyboard: {
        on: jest.fn(),
        addKey: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          isDown: false
        }))
      },
      on: jest.fn()
    };

    // Set up events property with mock functions
    this.events = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn()
    };
  }
  
  update() {}
  create() {}
  preload() {}
  init() {}
}

const GameObjects = {
  Sprite: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  Image: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  Text: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
};

const Physics = {
  Arcade: {
    Sprite: jest.fn(),
    Group: jest.fn(),
    Body: jest.fn()
  }
};

const Scale = {
  NONE: 'NONE',
  FIT: 'FIT',
  RESIZE: 'RESIZE',
};

const Sound = {
  SoundManagerCreator: {
    create: jest.fn()
  },
  BaseSound: jest.fn()
};

const Input = {
  Keyboard: {
    Key: jest.fn(),
    KeyCodes: {
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40
    }
  }
};

const Display = {
  Canvas: {
    CanvasPool: {
      create: jest.fn(),
      remove: jest.fn(),
    },
  },
};

const Game = jest.fn().mockImplementation(() => ({
  destroy: jest.fn()
}));

const AUTO = 0;
const CANVAS = 1;
const WEBGL = 2;
const HEADLESS = 3;

export {
  Scene,
  Game,
  GameObjects,
  Physics,
  Scale,
  Sound,
  Input,
  Display,
  AUTO,
  CANVAS,
  WEBGL,
  HEADLESS
}; 