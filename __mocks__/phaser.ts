/**
 * Basic Phaser.js mock implementation for Jest.
 * Provides minimal implementations of core Phaser classes and systems.
 * 
 * @module phaser-jest-mock
 * 
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} for understanding the role of this basic mock implementation
 * @see {@link docs/testing/mocking/mocking-strategies.md} for implementation patterns and best practices
 * 
 * This mock provides basic implementations that are automatically used by Jest.
 * For more advanced, configurable mocks, use the helper functions in tests/helpers/phaser-mock.ts.
 */

import { jest } from '@jest/globals';

interface SceneConfig {
  key?: string;
  [key: string]: any;
}

/**
 * Mock Scene class providing basic game object factory methods.
 */
class Scene {
  add: {
    sprite: jest.Mock;
    image: jest.Mock;
    text: jest.Mock;
  };
  input: {
    keyboard: {
      on: jest.Mock;
      addKey: jest.Mock;
    };
    on: jest.Mock;
  };
  events: {
    emit: jest.Mock;
    on: jest.Mock;
    once: jest.Mock;
    off: jest.Mock;
  };

  constructor(config: SceneConfig) {
    Object.assign(this, config);
    
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

    this.events = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn()
    };
  }
  
  update(): void {}
  create(): void {}
  preload(): void {}
  init(): void {}
}

interface GameObject {
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setScale: jest.Mock;
  setDepth: jest.Mock;
  setAlpha: jest.Mock;
  setTint: jest.Mock;
  on: jest.Mock;
}

interface SpriteGameObject extends GameObject {
  play: jest.Mock;
}

interface TextGameObject extends GameObject {
  setStyle: jest.Mock;
  setText: jest.Mock;
}

const GameObjects = {
  Sprite: jest.fn().mockImplementation((): SpriteGameObject => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),

  Image: jest.fn().mockImplementation((): GameObject => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),

  Text: jest.fn().mockImplementation((): TextGameObject => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
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
} as const;

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

interface GameConfig {
  type?: number;
  width?: number;
  height?: number;
  scene?: typeof Scene;
  [key: string]: any;
}

interface GameInstance {
  destroy: jest.Mock;
}

const Game = jest.fn().mockImplementation(function(this: GameInstance, config: GameConfig): GameInstance {
  return {
    destroy: jest.fn()
  };
}) as jest.MockedFunction<(config: GameConfig) => GameInstance>;

// Render type constants
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
  HEADLESS,
  // Types
  SceneConfig,
  GameConfig,
  GameObject,
  SpriteGameObject,
  TextGameObject,
  GameInstance
}; 