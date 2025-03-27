import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';
import { Player, Direction } from '../../models/Player';

// Define interfaces for the mock
interface Vector2 {
  x: number;
  y: number;
}

// Create mock functions with proper types
export const mockFunctions = {
  init: jest.fn(),
  update: jest.fn(),
  isMoving: jest.fn().mockReturnValue(false),
  isRunning: jest.fn().mockReturnValue(false),
  getMovementVector: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  getMovementDirection: jest.fn().mockReturnValue(null),
  isActionPressed: jest.fn().mockReturnValue(false),
};

// Use this class-like structure to better match the actual implementation
const InputControllerMock = jest.fn().mockImplementation((scene, player) => {
  return {
    init: mockFunctions.init,
    update: mockFunctions.update,
    isMoving: mockFunctions.isMoving,
    isRunning: mockFunctions.isRunning,
    getMovementVector: mockFunctions.getMovementVector,
    getMovementDirection: mockFunctions.getMovementDirection,
    isActionPressed: mockFunctions.isActionPressed,
    scene,
    player,
  };
});

export { InputControllerMock as InputController };
export default { mockFunctions, InputController: InputControllerMock };
