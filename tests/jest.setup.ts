import { jest } from '@jest/globals';

// Mock Image class
class Image {
  onload: () => void = () => {};
  onerror: () => void = () => {};
  src: string = '';
  width: number = 0;
  height: number = 0;
}
(global as any).Image = Image;

// Mock window properties used by Phaser
(global as any).window = {
  focus: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  location: {
    hash: '',
  },
  navigator: {
    userAgent: 'node',
  },
  ontouchstart: undefined,
  document: {},
  Image: Image
};

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn()
  })),
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  width: 800,
  height: 600
};

// Mock document properties used by Phaser
(global as any).document = {
  createElement: jest.fn((tag: string) => {
    if (tag === 'canvas') return mockCanvas;
    return {};
  }),
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  documentElement: {
    style: {}
  }
};

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = jest.fn((callback: () => void) => setTimeout(callback, 0));
(global as any).cancelAnimationFrame = jest.fn();

// Assign window to global
(global as any).window.document = (global as any).document; 