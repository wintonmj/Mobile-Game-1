import { jest } from '@jest/globals';

// Create a simple mock object without complex typing
const mockFunctions = {
  init: jest.fn(),
  update: jest.fn(),
  getMovementVector: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  getMovementDirection: jest.fn().mockReturnValue(null),
  isMoving: jest.fn().mockReturnValue(false),
  isRunning: jest.fn().mockReturnValue(false),
  isActionPressed: jest.fn().mockReturnValue(false),
};

// Create a constructor that returns a singleton to ensure all instances share the same mock functions
const mockInstance = {
  init: mockFunctions.init,
  update: mockFunctions.update,
  getMovementVector: mockFunctions.getMovementVector,
  getMovementDirection: mockFunctions.getMovementDirection,
  isMoving: mockFunctions.isMoving,
  isRunning: mockFunctions.isRunning,
  isActionPressed: mockFunctions.isActionPressed,
};

// Export the InputController class mock - use a singleton pattern to ensure all tests reference the same mock
export const InputController = jest.fn().mockImplementation(() => {
  return mockInstance;
});

// Export default object with mockFunctions for test access
export default {
  mockFunctions,
};
