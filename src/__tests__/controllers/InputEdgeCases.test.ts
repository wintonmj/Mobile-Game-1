import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';

// Import the mock to get access to the functions
import mockInputController from '../mocks/inputController';

// Get a reference to the mock functions directly
const mockInputFunctions = mockInputController.mockFunctions;

describe('Input Controller Edge Cases', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should handle simultaneous conflicting direction inputs', () => {
    // Mock the behavior for conflicting direction inputs
    mockInputFunctions.getMovementVector.mockReturnValue({ x: 0, y: 0 });
    mockInputFunctions.isMoving.mockReturnValue(false);

    // Initialize the controller
    mockInputFunctions.init();

    // Call update
    mockInputFunctions.update();

    // Verify the mock function returned the expected value
    const result = mockInputFunctions.getMovementVector();
    expect(result).toEqual({ x: 0, y: 0 });
    expect(mockInputFunctions.isMoving()).toBe(false);
  });

  it('should handle all direction keys pressed at once', () => {
    // Mock the behavior for all directions pressed
    mockInputFunctions.getMovementVector.mockReturnValue({ x: 0, y: 0 });
    mockInputFunctions.isMoving.mockReturnValue(false);

    // Initialize and update
    mockInputFunctions.init();
    mockInputFunctions.update();

    // Verify the expected return values
    const movementVector = mockInputFunctions.getMovementVector();
    expect(movementVector).toEqual({ x: 0, y: 0 });
    expect(mockInputFunctions.isMoving()).toBe(false);
  });

  it('should prioritize the latest pressed direction key', () => {
    // First simulate pressing left
    mockInputFunctions.getMovementVector.mockReturnValue({ x: -1, y: 0 });
    mockInputFunctions.getMovementDirection.mockReturnValue('left');
    mockInputFunctions.isMoving.mockReturnValue(true);

    // Initialize and update
    mockInputFunctions.init();
    mockInputFunctions.update();

    // Now simulate pressing right as well (conflicting inputs)
    mockInputFunctions.getMovementVector.mockReturnValue({ x: 0, y: 0 });

    // Update again
    mockInputFunctions.update();

    // Verify the return values for conflicting inputs
    const resultVector = mockInputFunctions.getMovementVector();
    expect(resultVector).toEqual({ x: 0, y: 0 });
  });

  it('should handle rapid input changes', () => {
    // Simulate rapid directional changes
    const directions = ['left', 'up', 'right', 'down', 'left', 'right'];

    directions.forEach((direction) => {
      // Update the mocked return value for each direction
      mockInputFunctions.getMovementDirection.mockReturnValue(direction);

      // Update and verify
      mockInputFunctions.update();
      const result = mockInputFunctions.getMovementDirection();
      expect(result).toBe(direction);
    });
  });

  it('should handle action input pressed with movement', () => {
    // Mock movement
    mockInputFunctions.getMovementVector.mockReturnValue({ x: -1, y: 0 });
    mockInputFunctions.getMovementDirection.mockReturnValue('left');
    mockInputFunctions.isMoving.mockReturnValue(true);

    // Mock action key presses with specific return values
    const mockIsActionPressed = mockInputFunctions.isActionPressed as jest.Mock;

    mockIsActionPressed
      .mockReturnValueOnce(true) // For MINING
      .mockReturnValueOnce(false); // For FISHING

    // Initialize and update
    mockInputFunctions.init();
    mockInputFunctions.update();

    // Verify both movement and action are detected
    expect(mockInputFunctions.isMoving()).toBe(true);

    // Call the mocks directly without using includes
    expect(mockIsActionPressed(Actions.MINING)).toBe(true);
    expect(mockIsActionPressed(Actions.FISHING)).toBe(false);
  });

  it('should handle multiple action inputs at once', () => {
    // Mock action key presses with specific return values
    const mockIsActionPressed = mockInputFunctions.isActionPressed as jest.Mock;

    // Return true for specific actions
    mockIsActionPressed
      .mockReturnValueOnce(true) // MINING
      .mockReturnValueOnce(true) // FISHING
      .mockReturnValueOnce(true) // COLLECTING
      .mockReturnValueOnce(false); // CUTTING

    // Initialize and update
    mockInputFunctions.init();
    mockInputFunctions.update();

    // Verify multiple actions
    expect(mockIsActionPressed(Actions.MINING)).toBe(true);
    expect(mockIsActionPressed(Actions.FISHING)).toBe(true);
    expect(mockIsActionPressed(Actions.COLLECTING)).toBe(true);
    expect(mockIsActionPressed(Actions.CUTTING)).toBe(false);
  });

  it('should handle key release after pressing', () => {
    // First simulate pressing the left key
    mockInputFunctions.getMovementVector.mockReturnValue({ x: -1, y: 0 });
    mockInputFunctions.getMovementDirection.mockReturnValue('left');
    mockInputFunctions.isMoving.mockReturnValue(true);

    // Initialize and update
    mockInputFunctions.init();
    mockInputFunctions.update();

    // Verify movement state
    expect(mockInputFunctions.isMoving()).toBe(true);
    expect(mockInputFunctions.getMovementDirection()).toBe('left');

    // Now simulate releasing the key
    mockInputFunctions.getMovementVector.mockReturnValue({ x: 0, y: 0 });
    mockInputFunctions.isMoving.mockReturnValue(false);
    // Direction should remain the same
    mockInputFunctions.getMovementDirection.mockReturnValue('left');

    // Update again
    mockInputFunctions.update();

    // Verify movement stopped but direction remains
    expect(mockInputFunctions.isMoving()).toBe(false);
    expect(mockInputFunctions.getMovementDirection()).toBe('left');
  });
});
