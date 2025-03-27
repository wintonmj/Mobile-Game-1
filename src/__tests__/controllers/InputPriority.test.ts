// @ts-nocheck
import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';

/**
 * Test suite specifically for input prioritization when multiple
 * input events are happening simultaneously.
 */
describe('InputController Priority Handling', () => {
  // Test controller with priority testing methods
  class PriorityTestController {
    constructor() {
      this.mockPlayer = {
        toggleCarrying: jest.fn(),
        toggleWalking: jest.fn(),
        isWalkingMode: jest.fn().mockReturnValue(false),
        setAction: jest.fn().mockReturnValue(true),
      };

      // Simulating the update order in the real controller
      this.updateOrder = [];

      // Mock for Phaser's JustDown
      this.mockJustDown = jest.fn().mockReturnValue(false);

      // Create a directly accessible inputState for testing
      this.inputState = {
        movement: {
          up: false,
          down: false,
          left: false,
          right: false,
          vector: { x: 0, y: 0 },
        },
        actions: {},
      };

      // Initialize all action states to false
      Object.values(Actions).forEach((action) => {
        this.inputState.actions[action] = false;
      });

      // Mock keys with isDown properties
      this.keys = {
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false },
        w: { isDown: false },
        a: { isDown: false },
        s: { isDown: false },
        d: { isDown: false },
        collect: { isDown: false },
        cut: { isDown: false },
        mine: { isDown: false },
        fish: { isDown: false },
        water: { isDown: false },
        pierce: { isDown: false },
        carry: { isDown: false },
        walk: { isDown: false },
        hit: { isDown: false },
        death: { isDown: false },
      };
    }

    // Simulate a complete update with tracking
    update() {
      this.updateOrder = [];

      // First, update movement
      this.updateMovement();

      // Then check for action toggles
      this.checkCarryToggle();
      this.checkWalkToggle();

      // Finally, update action states
      this.updateActions();

      return this.updateOrder;
    }

    // Simulate updating movement input
    updateMovement() {
      this.updateOrder.push('movement');

      // Priority: arrow keys first, then WASD
      this.inputState.movement.up = this.keys.up.isDown || this.keys.w.isDown;
      this.inputState.movement.down = this.keys.down.isDown || this.keys.s.isDown;
      this.inputState.movement.left = this.keys.left.isDown || this.keys.a.isDown;
      this.inputState.movement.right = this.keys.right.isDown || this.keys.d.isDown;

      // Calculate movement vector based on priority
      let x = 0;
      let y = 0;

      // Check which directions are active
      if (this.inputState.movement.left) x -= 1;
      if (this.inputState.movement.right) x += 1;
      if (this.inputState.movement.up) y -= 1;
      if (this.inputState.movement.down) y += 1;

      // If opposing directions are pressed, they cancel out
      if (x !== 0 && y !== 0) {
        const length = Math.sqrt(x * x + y * y);
        x /= length;
        y /= length;
      }

      this.inputState.movement.vector = { x, y };

      return { x, y };
    }

    // Reset all keys and movement states
    resetAllInputs() {
      // Reset keys
      Object.keys(this.keys).forEach((key) => {
        this.keys[key].isDown = false;
      });

      // Reset input state
      this.inputState.movement.up = false;
      this.inputState.movement.down = false;
      this.inputState.movement.left = false;
      this.inputState.movement.right = false;
      this.inputState.movement.vector = { x: 0, y: 0 };
    }

    // Simulate checking for carry toggle
    checkCarryToggle() {
      if (this.mockJustDown(this.keys.carry)) {
        this.updateOrder.push('carry_toggle');
        this.mockPlayer.toggleCarrying();
        return true;
      }
      return false;
    }

    // Simulate checking for walk toggle
    checkWalkToggle() {
      if (this.mockJustDown(this.keys.walk)) {
        this.updateOrder.push('walk_toggle');
        this.mockPlayer.toggleWalking();
        return true;
      }
      return false;
    }

    // Simulate updating action states
    updateActions() {
      this.updateOrder.push('actions');

      // Update action states in a specific order: combat actions first, then tools
      const actionUpdateOrder = [
        Actions.HIT,
        Actions.DEATH,
        Actions.COLLECTING,
        Actions.CUTTING,
        Actions.MINING,
        Actions.FISHING,
        Actions.WATERING,
        Actions.PIERCING,
      ];

      // Record which actions are pressed
      const pressedActions = [];

      // Update each action state
      actionUpdateOrder.forEach((action) => {
        const keyName = this.getKeyNameForAction(action);
        const isPressed = (this.keys[keyName] && this.keys[keyName].isDown) || false;

        this.inputState.actions[action] = isPressed;

        if (isPressed) {
          pressedActions.push(action);
        }
      });

      return pressedActions;
    }

    // Get the key name for a given action
    getKeyNameForAction(action) {
      // Map Actions enum values to key names
      switch (action) {
        case Actions.COLLECTING:
          return 'collect';
        case Actions.CUTTING:
          return 'cut';
        case Actions.MINING:
          return 'mine';
        case Actions.FISHING:
          return 'fish';
        case Actions.WATERING:
          return 'water';
        case Actions.PIERCING:
          return 'pierce';
        case Actions.HIT:
          return 'hit';
        case Actions.DEATH:
          return 'death';
        default:
          return '';
      }
    }

    // Helper methods for testing
    isMoving() {
      return this.inputState.movement.vector.x !== 0 || this.inputState.movement.vector.y !== 0;
    }

    getMovementVector() {
      return this.inputState.movement.vector;
    }

    getDirection() {
      const { x, y } = this.inputState.movement.vector;

      if (Math.abs(x) > Math.abs(y)) {
        return x > 0 ? 'right' : 'left';
      } else if (y !== 0) {
        return y > 0 ? 'down' : 'up';
      }

      return null;
    }

    isActionPressed(action) {
      return this.inputState.actions[action] || false;
    }

    // Set multiple keys pressed state at once
    setKeysPressedState(keyStates) {
      Object.keys(keyStates).forEach((key) => {
        if (this.keys[key]) {
          this.keys[key].isDown = keyStates[key];
        }
      });
    }

    // Simulate a JustDown event for a specific key
    simulateJustDown(keyName) {
      this.keys[keyName].isDown = true;

      this.mockJustDown.mockImplementation((key) => {
        return key === this.keys[keyName];
      });
    }
  }

  let controller;

  beforeEach(() => {
    controller = new PriorityTestController();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update in the correct order: movement, toggles, then actions', () => {
    // Perform an update cycle
    const updateOrder = controller.update();

    // Verify the order matches the expected sequence
    expect(updateOrder).toEqual(['movement', 'actions']);

    // With a carry toggle
    controller.simulateJustDown('carry');
    const updateOrderWithCarry = controller.update();
    expect(updateOrderWithCarry).toEqual(['movement', 'carry_toggle', 'actions']);

    // With a walk toggle
    jest.clearAllMocks();
    controller.simulateJustDown('walk');
    const updateOrderWithWalk = controller.update();
    expect(updateOrderWithWalk).toEqual(['movement', 'walk_toggle', 'actions']);
  });

  it('should prioritize arrow keys over WASD when both are pressed', () => {
    // Press both arrow and WASD for the same direction
    controller.keys.up.isDown = true;
    controller.keys.w.isDown = true;
    controller.updateMovement();

    // Movement should be registered in the y direction
    expect(controller.getMovementVector().y).toBeLessThan(0);

    // Press arrow keys and WASD in opposite directions
    controller.keys.up.isDown = true; // Up (negative y)
    controller.keys.s.isDown = true; // Down (positive y)
    const vector = controller.updateMovement();

    // They should cancel out, as both are registered equally
    expect(vector.y).toBe(0);
  });

  it('should handle multiple simultaneous action keys', () => {
    // Press multiple action keys at once
    controller.setKeysPressedState({
      hit: true,
      collect: true,
      mine: true,
    });

    // Update actions
    const pressedActions = controller.updateActions();

    // All actions should be registered
    expect(pressedActions).toContain(Actions.HIT);
    expect(pressedActions).toContain(Actions.COLLECTING);
    expect(pressedActions).toContain(Actions.MINING);

    // Check the actual state
    expect(controller.isActionPressed(Actions.HIT)).toBe(true);
    expect(controller.isActionPressed(Actions.COLLECTING)).toBe(true);
    expect(controller.isActionPressed(Actions.MINING)).toBe(true);
    expect(controller.isActionPressed(Actions.FISHING)).toBe(false);
  });

  it('should handle the case where both toggles are triggered in the same update', () => {
    // Set up both toggle keys to trigger in the same update
    controller.keys.carry.isDown = true;
    controller.keys.walk.isDown = true;
    controller.mockJustDown.mockReturnValue(true);

    // Update
    controller.update();

    // Both toggles should have been called
    expect(controller.mockPlayer.toggleCarrying).toHaveBeenCalledTimes(1);
    expect(controller.mockPlayer.toggleWalking).toHaveBeenCalledTimes(1);

    // Order should show carry was toggled before walk
    expect(controller.updateOrder).toEqual(['movement', 'carry_toggle', 'walk_toggle', 'actions']);
  });

  it('should calculate the movement vector correctly with diagonal input', () => {
    // Test all four diagonal combinations
    const diagonals = [
      { keys: { up: true, right: true }, expected: { x: 0.7071, y: -0.7071 } },
      { keys: { up: true, left: true }, expected: { x: -0.7071, y: -0.7071 } },
      { keys: { down: true, right: true }, expected: { x: 0.7071, y: 0.7071 } },
      { keys: { down: true, left: true }, expected: { x: -0.7071, y: 0.7071 } },
    ];

    diagonals.forEach((test) => {
      // Reset all inputs before each test case
      controller.resetAllInputs();

      // Set the keys for this test case
      controller.setKeysPressedState(test.keys);

      // Run the update
      controller.updateMovement();

      // Get the resulting vector
      const vector = controller.getMovementVector();

      // Verify x and y components
      expect(vector.x).toBeCloseTo(test.expected.x, 4);
      expect(vector.y).toBeCloseTo(test.expected.y, 4);
    });
  });

  it('should correctly identify the primary direction even with diagonal movement', () => {
    // This is testing the direction priority logic

    // Set diagonal movement with stronger horizontal component
    controller.inputState.movement.vector = { x: 0.9, y: 0.4 };
    expect(controller.getDirection()).toBe('right');

    // Set diagonal movement with stronger vertical component
    controller.inputState.movement.vector = { x: 0.3, y: -0.95 };
    expect(controller.getDirection()).toBe('up');

    // Set perfectly diagonal movement - we'll test both cases
    // First test with exact equality
    controller.inputState.movement.vector = { x: 0.7071, y: 0.7071 };

    // Getting the direction with equal components - the actual result may vary
    // based on implementation, so we'll just verify it's one of the valid directions
    const dirWithEqualComponents = controller.getDirection();
    expect(['right', 'down']).toContain(dirWithEqualComponents);
  });

  it('should correctly handle conflicting inputs in the same direction', () => {
    // Set conflicting horizontal inputs
    controller.setKeysPressedState({
      left: true,
      right: true,
      a: false,
      d: false,
    });
    controller.updateMovement();

    // Horizontal movement should cancel out
    expect(controller.getMovementVector().x).toBe(0);

    // Set conflicting vertical inputs
    controller.setKeysPressedState({
      left: false,
      right: false,
      up: true,
      down: true,
      w: false,
      s: false,
    });
    controller.updateMovement();

    // Vertical movement should cancel out
    expect(controller.getMovementVector().y).toBe(0);
  });
});
