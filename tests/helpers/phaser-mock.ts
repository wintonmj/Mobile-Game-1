/**
 * Mock Phaser objects and types for testing
 */

import { jest } from '@jest/globals';

// Mock Phaser module
jest.mock('phaser', () => ({
  Scene: class {
    add = {
      image: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis() }),
      text: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis() })
    };
    
    cameras = {
      main: {
        centerX: 400,
        centerY: 300
      }
    };
    
    input = {
      keyboard: {
        on: jest.fn()
      },
      on: jest.fn()
    };
    
    scene = {
      start: jest.fn()
    };
  }
}));

export class MockScene {
  add = {
    image: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis() }),
    text: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis() })
  };
  
  cameras = {
    main: {
      centerX: 400,
      centerY: 300
    }
  };
  
  input = {
    keyboard: {
      on: jest.fn()
    },
    on: jest.fn()
  };
  
  scene = {
    start: jest.fn()
  };
}

export function createMockScene() {
  return {
    // Scene properties
    add: {
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      image: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
    },
    
    // Input
    input: {
      keyboard: {
        on: jest.fn(),
        off: jest.fn(),
        addKey: jest.fn().mockReturnValue({
          on: jest.fn(),
          isDown: false,
        }),
      },
    },
    
    // Scene management
    scene: {
      pause: jest.fn(),
      resume: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      launch: jest.fn(),
    },
    
    // Events
    events: {
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    
    // Data
    data: {
      set: jest.fn(),
      get: jest.fn(),
      values: {},
    },
    
    // Time
    time: {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn(),
        paused: false,
      }),
      delayedCall: jest.fn(),
    },
    
    // Lifecycle methods
    create: jest.fn(),
    update: jest.fn(),
    preload: jest.fn(),
    init: jest.fn(),
  };
} 