// This file is run before each test and configures the test environment
import { jest } from '@jest/globals';
import { setupFakeTimers, restoreRealTimers } from './helpers/timerTestUtils';

// Import our model-context-protocol helpers
import { ModelContextTest } from './helpers/modelContextTest';

import { fsMock } from './mocks/fs';

// Mock Phaser for all tests - provide mock directly to avoid circular references
jest.mock('phaser', () => ({
  Game: jest.fn().mockImplementation(() => ({
    scale: {
      setMode: jest.fn(),
      resize: jest.fn(),
    },
    loop: {
      delta: 16, // ~60fps
    },
  })),
  Scene: jest.fn(),
  GameObjects: {
    Graphics: jest.fn(),
    Sprite: jest.fn(),
    Text: jest.fn(),
    Container: jest.fn(),
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        UP: 38,
        LEFT: 37,
        DOWN: 40,
        RIGHT: 39,
        SHIFT: 16,
        SPACE: 32,
      },
    },
  },
  AUTO: 'auto',
  Scale: {
    FIT: 'FIT',
    RESIZE: 'RESIZE',
    CENTER_BOTH: 'CENTER_BOTH',
  },
  Physics: {
    Arcade: {
      World: jest.fn(),
      Sprite: jest.fn(),
      Body: jest.fn(),
    },
  },
  WEBGL: 'WEBGL',
  CANVAS: 'CANVAS',
}));

// Configure global Jest behavior
beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up fake timers with modern timers
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'setImmediate'],
    legacyFakeTimers: false
  });

  // Initialize model-context-protocol for browser error tracking
  ModelContextTest.init();
});

// Clean up after each test
afterEach(() => {
  // Clean up model-context-protocol
  ModelContextTest.cleanup();
  
  // Restore file system mock
  fsMock.restore();
  
  // Clear all timers and restore real timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Clear any remaining promises
  jest.clearAllMocks();
});

// Configure Jest timeout for all tests
jest.setTimeout(10000);

// Disable console errors during tests to keep output clean
// Uncomment if test output becomes too noisy
// console.error = jest.fn();

/**
 * Jest setup file to provide global test lifecycle hooks
 *
 * This file should be referenced in jest.config.js under setupFilesAfterEnv
 */

// Add any other global test setup here
