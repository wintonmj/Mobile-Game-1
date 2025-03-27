// @ts-nocheck
import { jest } from '@jest/globals';

// Create a simple mock store for callbacks
const callbackStore: Record<string, () => void> = {};

// Create mock functions for PlayerView
const mockFunctions = {
  preload: jest.fn(),
  create: jest.fn().mockReturnValue({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setTexture: jest.fn().mockReturnThis(),
    setFlipX: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (event, callback) {
      callbackStore[event] = callback;
      return this;
    }),
    anims: {
      getName: jest.fn().mockReturnValue('idle-down'),
    },
  }),
  update: jest.fn(),
  onActionComplete: jest.fn(),
  // Helper to trigger animation complete callback
  triggerAnimationComplete: function () {
    const callback = callbackStore['animationcomplete'];
    if (callback) {
      callback();
    }
  },
};

// Mock implementation of PlayerView
const PlayerView = jest.fn().mockImplementation(() => {
  return {
    preload: mockFunctions.preload,
    create: mockFunctions.create,
    update: mockFunctions.update,
    onActionComplete: mockFunctions.onActionComplete,
  };
});

export { PlayerView };
export default { mockFunctions };
