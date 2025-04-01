/**
 * @file jest.setup.ts
 * @description Jest setup file that configures the test environment for Phaser.js game testing.
 * Provides mock implementations of browser APIs, canvas operations, and custom test matchers.
 * 
 * @see {@link config/jest/jest.config.js} - Jest configuration
 * @see {@link docs/testing/jest-testing-strategy.md} - Testing strategy and standards
 * @see {@link docs/testing/helpers/test-utils.md} - Test utility documentation
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} - Scene mocking patterns
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} - Mock implementation strategy
 * @see {@link docs/architecture/patterns/mvp-high-level-architecture.md} - Technical architecture
 * @see {@link docs/design/mvp-design.md} - MVP design specifications
 */

import { jest } from '@jest/globals';

/**
 * Canvas context mock interface for 2D rendering context.
 * Provides mock implementations of essential canvas operations used by Phaser.
 * 
 * @see {@link __mocks__/phaser.ts} - Phaser mock implementation
 * @see {@link tests/helpers/phaser-mock.ts} - Phaser mock helpers
 */
interface MockCanvasRenderingContext2D {
  fillRect: jest.Mock;
  clearRect: jest.Mock;
  getImageData: jest.Mock;
  putImageData: jest.Mock;
  createImageData: jest.Mock;
  setTransform: jest.Mock;
  drawImage: jest.Mock;
  save: jest.Mock;
  restore: jest.Mock;
  translate: jest.Mock;
  rotate: jest.Mock;
  scale: jest.Mock;
  beginPath: jest.Mock;
  moveTo: jest.Mock;
  lineTo: jest.Mock;
  closePath: jest.Mock;
  stroke: jest.Mock;
  fill: jest.Mock;
  data?: {
    data: Uint8ClampedArray;
  };
}

/**
 * Mock canvas interface with required Phaser properties.
 * Implements the minimum canvas functionality needed for Phaser rendering.
 */
interface MockCanvas {
  getContext(contextId: '2d'): MockCanvasRenderingContext2D;
  style: Partial<CSSStyleDeclaration>;
  width: number;
  height: number;
}

/**
 * Test game object interface for consistent mock implementations.
 * Defines the minimum required properties and methods for game object testing.
 * 
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} - Scene mocking patterns
 */
interface TestGameObject {
  type: string;
  x: number;
  y: number;
  setPosition: jest.Mock;
  setScale: jest.Mock;
  setOrigin: jest.Mock;
  destroy: jest.Mock;
}

/**
 * Test scene interface for scene mocking.
 * Provides mock implementations of essential scene systems.
 * 
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} - Scene mocking patterns
 */
interface TestScene {
  add: {
    sprite: jest.Mock;
    image: jest.Mock;
    text: jest.Mock;
  };
  physics: {
    add: {
      sprite: jest.Mock;
      group: jest.Mock;
    };
    world: {
      setBounds: jest.Mock;
      on: jest.Mock;
    };
  };
  events: {
    emit: jest.Mock;
    on: jest.Mock;
    once: jest.Mock;
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
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} - Mock implementation strategy
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
 * Custom matchers for game testing.
 * Extends Jest's expect with game-specific assertions.
 * 
 * @see {@link docs/testing/helpers/test-utils.md} - Test utility documentation
 */
expect.extend({
  toBeInGameBounds(received: { x: number; y: number }, bounds: { width: number; height: number }) {
    const pass = received.x >= 0 && received.x <= bounds.width && 
                received.y >= 0 && received.y <= bounds.height;
    return {
      message: () => `expected position (${received.x}, ${received.y}) ${pass ? 'not ' : ''}to be within game bounds ${JSON.stringify(bounds)}`,
      pass
    };
  },

  toHaveBeenCalledWithGameObject(received: jest.Mock, gameObjectType: string) {
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

  toBeValidGameState(received: unknown) {
    const isValidGameState = (state: unknown): boolean => {
      if (!state || typeof state !== 'object') return false;
      const requiredProps = ['scene', 'status', 'timestamp'];
      return requiredProps.every(prop => prop in state);
    };
    const pass = isValidGameState(received);
    return {
      message: () => `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to be a valid game state`,
      pass
    };
  },

  toHaveValidPhysicsBody(received: unknown) {
    const isValidPhysicsBody = (obj: unknown): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      const requiredProps = ['velocity', 'acceleration', 'position'];
      return requiredProps.every(prop => prop in obj);
    };
    const pass = isValidPhysicsBody(received);
    return {
      message: () => `expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to have a valid physics body`,
      pass
    };
  }
});

/**
 * Global test utilities for creating test objects.
 * Provides factory functions for common test scenarios.
 * 
 * @see {@link tests/helpers/test-utils.ts} - Test utility implementations
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