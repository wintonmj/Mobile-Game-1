import { jest } from '@jest/globals';

// Mock browser environment for Phaser
const mock = () => {
  const canvas = {
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

  const context = canvas.getContext('2d');
  
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return canvas;
      }
      return {};
    },
    documentElement: {
      style: {},
    },
  };
  
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
  };
  
  global.Image = class {
    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      });
    }
  };
  
  global.HTMLCanvasElement = class {};
  global.ImageData = class {};
};

mock(); 