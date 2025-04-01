/**
 * Mock Phaser objects and types for testing
 */

import { jest } from '@jest/globals';
import { Scene } from 'phaser';

export function createMockScene() {
  const mockScene = {
    // Scene properties
    add: {
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
      })),
    },
    
    // Input
    input: {
      keyboard: {
        on: jest.fn(),
        off: jest.fn(),
        addKey: jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          isDown: false,
        })),
      },
      on: jest.fn(),
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
      addEvent: jest.fn().mockImplementation(() => ({
        remove: jest.fn(),
        paused: false,
      })),
      delayedCall: jest.fn(),
    },
    
    // Cameras
    cameras: {
      main: {
        centerX: 400,
        centerY: 300,
      },
    },
    
    // Lifecycle methods
    create: jest.fn(),
    update: jest.fn(),
    preload: jest.fn(),
    init: jest.fn(),
  };

  return mockScene;
}

// Mock Phaser module
jest.mock('phaser', () => ({
  Scene: class MockScene extends Scene {
    constructor(config: any) {
      super(config);
      Object.assign(this, createMockScene());
    }
  }
})); 