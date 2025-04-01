import { jest } from '@jest/globals';

class Scene {
  constructor(config) {
    Object.assign(this, config);
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