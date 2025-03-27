// This file is run before each test and configures the test environment
import { jest } from '@jest/globals';

// Import the mock directly
import MockPhaser from './mocks/phaser';

// Import our model-context-protocol helpers
import { ModelContextTest } from './helpers/modelContextTest';

// Mock Phaser for all tests - use ESM compatible syntax
jest.mock('phaser', () => MockPhaser);

// Configure global Jest behavior
beforeEach(() => {
  jest.clearAllMocks();

  // Initialize model-context-protocol for browser error tracking
  ModelContextTest.init();
});

// Clean up after each test
afterEach(() => {
  // Clean up model-context-protocol
  ModelContextTest.cleanup();
});

// Disable console errors during tests to keep output clean
// Uncomment if test output becomes too noisy
// console.error = jest.fn();
