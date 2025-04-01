/**
 * @file jest.setup.ts
 * @module jest/setup
 * @description Jest setup file that configures the test environment for Phaser.js game testing.
 * Provides mock implementations of browser APIs, canvas operations, and custom test matchers.
 * 
 * This file follows the solutions and patterns documented in the Jest Configuration Troubleshooting Guide,
 * particularly regarding custom matcher implementation, type safety, and browser environment mocking.
 * 
 * @see {@link config/jest/jest.config.js} Jest configuration
 * @see {@link docs/testing/jest-testing-strategy.md} Testing strategy and standards
 * @see {@link docs/testing/jest-configuration-troubleshooting.md} Troubleshooting guide and solutions
 * @see {@link docs/testing/helpers/test-utils.md} Test utility documentation
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} Scene mocking patterns
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} Mock implementation strategy
 * @see {@link docs/architecture/patterns/mvp-high-level-architecture.md} Technical architecture
 * @see {@link docs/design/mvp-design.md} MVP design specifications
 */

import { jest, expect } from '@jest/globals';

/**
 * Represents a 2D vector with x and y coordinates
 * @interface Vector2D
 * @since 1.0.0
 */
interface Vector2D {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Represents the state of a game scene
 * @interface GameState
 * @since 1.0.0
 */
interface GameState {
  /** Current scene identifier */
  scene: string;
  /** Current game status */
  status: string;
  /** Timestamp of the state */
  timestamp: number;
}

/**
 * Represents a physics body with basic properties
 * @interface PhysicsBody
 * @since 1.0.0
 */
interface PhysicsBody {
  /** Current velocity */
  velocity: unknown;
  /** Current acceleration */
  acceleration: unknown;
  /** Current position */
  position: unknown;
}

/**
 * Type guard for Vector2D interface
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a Vector2D
 */
const isVector2D = (value: unknown): value is Vector2D => {
  return typeof value === 'object' && value !== null &&
         'x' in value && typeof (value as Vector2D).x === 'number' &&
         'y' in value && typeof (value as Vector2D).y === 'number';
};

/**
 * Type guard for Jest mock functions
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a Jest mock function
 */
const isMockFunction = (value: unknown): value is jest.Mock => {
  return typeof value === 'object' && value !== null && 'mock' in value && typeof (value as jest.Mock).getMockName === 'function';
};

/**
 * Type guard for GameState interface
 * @param {unknown} state - Value to check
 * @returns {boolean} True if value is a GameState
 */
const isGameState = (state: unknown): state is GameState => {
  if (!state || typeof state !== 'object') return false;
  const requiredProps = ['scene', 'status', 'timestamp'];
  return requiredProps.every(prop => prop in state);
};

/**
 * Type guard for PhysicsBody interface
 * @param {unknown} obj - Value to check
 * @returns {boolean} True if value is a PhysicsBody
 */
const isPhysicsBody = (obj: unknown): obj is PhysicsBody => {
  if (!obj || typeof obj !== 'object') return false;
  const requiredProps = ['velocity', 'acceleration', 'position'];
  return requiredProps.every(prop => prop in obj);
};

/**
 * Custom Jest matchers for game-specific assertions
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#custom-matcher-extension-issues} Custom matcher implementation guide
 */
const matchers = {
  /**
   * Checks if a position is within game bounds
   * @param {unknown} received - Value to check
   * @param {{ width: number; height: number }} bounds - Game bounds
   * @returns {jest.CustomMatcherResult} Matcher result
   */
  toBeInGameBounds(received: unknown, bounds: { width: number; height: number }) {
    if (!isVector2D(received)) {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid Vector2D object`,
        pass: false
      };
    }

    const pass = received.x >= 0 && received.x <= bounds.width && 
                received.y >= 0 && received.y <= bounds.height;
    return {
      message: () => `expected position (${received.x}, ${received.y}) ${pass ? 'not ' : ''}to be within game bounds ${JSON.stringify(bounds)}`,
      pass
    };
  },

  /**
   * Checks if a mock was called with a specific game object type
   * @param {unknown} received - Mock function to check
   * @param {string} gameObjectType - Expected game object type
   * @returns {jest.CustomMatcherResult} Matcher result
   */
  toHaveBeenCalledWithGameObject(received: unknown, gameObjectType: string) {
    if (!isMockFunction(received)) {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a mock function`,
        pass: false
      };
    }

    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const arg = call[0];
      return arg && typeof arg === 'object' && 'type' in arg && arg.type === gameObjectType;
    });
    return {
      message: () => `expected ${received.getMockName()} ${pass ? 'not ' : ''}to have been called with a ${gameObjectType} game object`,
      pass
    };
  },

  /**
   * Checks if a value is a valid game state
   * @param {unknown} received - Value to check
   * @returns {jest.CustomMatcherResult} Matcher result
   */
  toBeValidGameState(received: unknown) {
    const pass = isGameState(received);
    return {
      message: () => `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to be a valid game state`,
      pass
    };
  },

  /**
   * Checks if a value has a valid physics body
   * @param {unknown} received - Value to check
   * @returns {jest.CustomMatcherResult} Matcher result
   */
  toHaveValidPhysicsBody(received: unknown) {
    const pass = isPhysicsBody(received);
    return {
      message: () => `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to have a valid physics body`,
      pass
    };
  }
};

// Extend Jest's expect with custom matchers
expect.extend(matchers);

/**
 * Extends Jest's Matchers interface with custom game-specific matchers
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#custom-matcher-extension-issues} Custom matcher type extensions
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Checks if a position is within specified game bounds
       * @param {{ width: number; height: number }} bounds - Game bounds to check against
       */
      toBeInGameBounds(bounds: { width: number; height: number }): R;
      /**
       * Checks if a mock was called with a specific game object type
       * @param {string} gameObjectType - Expected game object type
       */
      toHaveBeenCalledWithGameObject(gameObjectType: string): R;
      /** Checks if a value is a valid game state */
      toBeValidGameState(): R;
      /** Checks if a value has a valid physics body */
      toHaveValidPhysicsBody(): R;
    }
  }
}

/**
 * Canvas context mock interface for 2D rendering context.
 * Provides mock implementations of essential canvas operations used by Phaser.
 * 
 * @interface MockCanvasRenderingContext2D
 * @see {@link __mocks__/phaser.ts} Phaser mock implementation
 * @see {@link tests/helpers/phaser-mock.ts} Phaser mock helpers
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#phaser-mock-issues} Phaser mocking solutions
 */
interface MockCanvasRenderingContext2D {
  /** Fill rectangle operation mock */
  fillRect: jest.Mock;
  /** Clear rectangle operation mock */
  clearRect: jest.Mock;
  /** Get image data operation mock */
  getImageData: jest.Mock;
  /** Put image data operation mock */
  putImageData: jest.Mock;
  /** Create image data operation mock */
  createImageData: jest.Mock;
  /** Set transform operation mock */
  setTransform: jest.Mock;
  /** Draw image operation mock */
  drawImage: jest.Mock;
  /** Save context state mock */
  save: jest.Mock;
  /** Restore context state mock */
  restore: jest.Mock;
  /** Translate operation mock */
  translate: jest.Mock;
  /** Rotate operation mock */
  rotate: jest.Mock;
  /** Scale operation mock */
  scale: jest.Mock;
  /** Begin path operation mock */
  beginPath: jest.Mock;
  /** Move to operation mock */
  moveTo: jest.Mock;
  /** Line to operation mock */
  lineTo: jest.Mock;
  /** Close path operation mock */
  closePath: jest.Mock;
  /** Stroke operation mock */
  stroke: jest.Mock;
  /** Fill operation mock */
  fill: jest.Mock;
  /** Optional pixel data */
  data?: {
    data: Uint8ClampedArray;
  };
}

/**
 * Mock canvas interface with required Phaser properties.
 * Implements the minimum canvas functionality needed for Phaser rendering.
 * 
 * @interface MockCanvas
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#phaser-mock-issues} Canvas mocking solutions
 */
interface MockCanvas {
  /** Get rendering context */
  getContext(contextId: '2d'): MockCanvasRenderingContext2D;
  /** Canvas style properties */
  style: Partial<CSSStyleDeclaration>;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

/**
 * Test game object interface for consistent mock implementations.
 * Defines the minimum required properties and methods for game object testing.
 * 
 * @interface TestGameObject
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} Scene mocking patterns
 */
interface TestGameObject {
  /** Game object type identifier */
  type: string;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Position setter mock */
  setPosition: jest.Mock;
  /** Scale setter mock */
  setScale: jest.Mock;
  /** Origin setter mock */
  setOrigin: jest.Mock;
  /** Destroy method mock */
  destroy: jest.Mock;
}

/**
 * Test scene interface for scene mocking.
 * Provides mock implementations of essential scene systems.
 * 
 * @interface TestScene
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} Scene mocking patterns
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#phaser-scene-testing-issues} Scene testing solutions
 */
interface TestScene {
  /** Game object factory */
  add: {
    /** Sprite creation mock */
    sprite: jest.Mock;
    /** Image creation mock */
    image: jest.Mock;
    /** Text creation mock */
    text: jest.Mock;
  };
  /** Physics system */
  physics: {
    /** Physics object factory */
    add: {
      /** Physics sprite creation mock */
      sprite: jest.Mock;
      /** Physics group creation mock */
      group: jest.Mock;
    };
    /** Physics world configuration */
    world: {
      /** Set world bounds mock */
      setBounds: jest.Mock;
      /** World event handler mock */
      on: jest.Mock;
    };
  };
  /** Scene event system */
  events: {
    /** Event emission mock */
    emit: jest.Mock;
    /** Event subscription mock */
    on: jest.Mock;
    /** One-time event subscription mock */
    once: jest.Mock;
    /** Event unsubscription mock */
    off: jest.Mock;
  };
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInGameBounds(bounds: { width: number; height: number }): R;
      toHaveBeenCalledWithGameObject(gameObjectType: string): R;
      toBeValidGameState(): R;
      toHaveValidPhysicsBody(): R;
    }
  }

  // Declare global test utilities
  var createTestGameObject: (type: string, x?: number, y?: number) => TestGameObject;
  var createTestScene: () => TestScene;
}

/**
 * Sets up the mock browser environment for Phaser.
 * Includes canvas, document, window, and image mocks.
 * 
 * @function setupMockBrowserEnvironment
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#phaser-mock-issues} Browser environment mocking
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} Mock implementation strategy
 */
const setupMockBrowserEnvironment = (): void => {
  const canvas: MockCanvas = {
    getContext: () => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      data: { data: new Uint8ClampedArray(4) },
    }),
    style: {},
    width: 800,
    height: 600,
  };

  // Mock document
  global.document = {
    createElement: (tag: string): MockCanvas | Record<string, never> => {
      if (tag === 'canvas') {
        return canvas;
      }
      return {};
    },
    documentElement: {
      style: {},
    },
  } as unknown as Document;

  // Mock window
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    devicePixelRatio: 1,
    innerWidth: 800,
    innerHeight: 600,
    performance: {
      now: jest.fn(),
    },
    URL: {
      createObjectURL: jest.fn(),
      revokeObjectURL: jest.fn(),
    },
    requestAnimationFrame: jest.fn(),
    cancelAnimationFrame: jest.fn(),
  } as unknown as Window & typeof globalThis;

  // Mock Image with minimum required properties
  class MockImage {
    onload?: () => void;
    width: number = 0;
    height: number = 0;
    
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      });
    }
  }

  global.Image = MockImage as unknown as typeof Image;
  global.HTMLCanvasElement = class {} as unknown as typeof HTMLCanvasElement;
  global.ImageData = class {} as unknown as typeof ImageData;
};

// Initialize mock environment
setupMockBrowserEnvironment();

/**
 * Global test utilities for creating test objects.
 * Provides factory functions for common test scenarios.
 * 
 * @namespace GlobalTestUtilities
 * @see {@link tests/helpers/test-utils.ts} Test utility implementations
 * @see {@link docs/testing/jest-configuration-troubleshooting.md#test-organization} Test organization patterns
 */

/**
 * Creates a test game object with basic properties and mock methods
 * @param {string} type - The type of game object to create
 * @param {number} [x=0] - Initial x coordinate
 * @param {number} [y=0] - Initial y coordinate
 * @returns {TestGameObject} A mock game object
 */
global.createTestGameObject = (type: string, x = 0, y = 0): TestGameObject => ({
  type,
  x,
  y,
  setPosition: jest.fn().mockReturnThis(),
  setScale: jest.fn().mockReturnThis(),
  setOrigin: jest.fn().mockReturnThis(),
  destroy: jest.fn()
});

/**
 * Creates a test scene with mock systems and methods
 * @returns {TestScene} A mock scene with all required systems
 */
global.createTestScene = (): TestScene => ({
  add: {
    sprite: jest.fn().mockReturnValue(global.createTestGameObject('sprite')),
    image: jest.fn().mockReturnValue(global.createTestGameObject('image')),
    text: jest.fn().mockReturnValue(global.createTestGameObject('text'))
  },
  physics: {
    add: {
      sprite: jest.fn().mockReturnValue(global.createTestGameObject('physics-sprite')),
      group: jest.fn()
    },
    world: {
      setBounds: jest.fn(),
      on: jest.fn()
    }
  },
  events: {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn()
  }
}); 