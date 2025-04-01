import { jest } from '@jest/globals';

/**
 * Canvas context mock interface for 2D rendering context
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
 * Mock canvas interface with required Phaser properties
 */
interface MockCanvas {
  getContext(contextId: '2d'): MockCanvasRenderingContext2D;
  style: Partial<CSSStyleDeclaration>;
  width: number;
  height: number;
}

/**
 * Sets up the mock browser environment for Phaser
 * Includes canvas, document, window, and image mocks
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