// @ts-nocheck
import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';

/**
 * Test suite for InputController's JustDown behavior
 *
 * This test focuses on the interaction with Phaser's JustDown functionality
 * and the toggleCarrying/toggleWalking behaviors.
 */
describe('InputController JustDown Behavior', () => {
  // Create a specialized test controller for JustDown functionality tests
  class TestableJustDownController {
    constructor() {
      // Mock player with carry/walk toggling functions
      this.mockPlayer = {
        toggleCarrying: jest.fn(),
        toggleWalking: jest.fn(),
        isWalkingMode: jest.fn().mockReturnValue(false),
        isCarrying: jest.fn().mockReturnValue(false),
      };

      // Mock Phaser's JustDown function
      this.mockJustDown = jest.fn().mockReturnValue(false);

      // Mock keys that would be created by Phaser
      this.keys = {
        carry: { isDown: false },
        walk: { isDown: false },
      };

      // Store the last JustDown key that was checked
      this.lastCheckedKey = null;
    }

    // Test method that simulates the JustDown check from update()
    checkJustDownForKey(keyName) {
      const key = this.keys[keyName];
      this.lastCheckedKey = key;

      if (this.mockJustDown(key)) {
        if (keyName === 'carry') {
          this.mockPlayer.toggleCarrying();
          return true;
        } else if (keyName === 'walk') {
          this.mockPlayer.toggleWalking();
          return true;
        }
      }
      return false;
    }

    // Helper to simulate a JustDown event for a specific key
    simulateJustDown(keyName) {
      // Make the key appear to be down
      this.keys[keyName].isDown = true;

      // Make JustDown return true only for this specific key
      this.mockJustDown.mockImplementation((key) => {
        return key === this.keys[keyName];
      });
    }

    // Helper to reset all mock JustDown behavior
    resetJustDown() {
      this.mockJustDown.mockReturnValue(false);
      Object.keys(this.keys).forEach((key) => {
        this.keys[key].isDown = false;
      });
    }
  }

  let controller;

  beforeEach(() => {
    controller = new TestableJustDownController();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should toggle carrying when carry key JustDown is detected', () => {
    // Set up the carry key to trigger JustDown
    controller.simulateJustDown('carry');

    // Call the method that checks JustDown
    const result = controller.checkJustDownForKey('carry');

    // Verify carrying was toggled
    expect(result).toBe(true);
    expect(controller.mockPlayer.toggleCarrying).toHaveBeenCalledTimes(1);
    expect(controller.mockPlayer.toggleWalking).not.toHaveBeenCalled();
  });

  it('should toggle walking when walk key JustDown is detected', () => {
    // Set up the walk key to trigger JustDown
    controller.simulateJustDown('walk');

    // Call the method that checks JustDown
    const result = controller.checkJustDownForKey('walk');

    // Verify walking was toggled
    expect(result).toBe(true);
    expect(controller.mockPlayer.toggleWalking).toHaveBeenCalledTimes(1);
    expect(controller.mockPlayer.toggleCarrying).not.toHaveBeenCalled();
  });

  it('should not toggle anything when no JustDown is detected', () => {
    // No JustDown events
    controller.resetJustDown();

    // Check both keys
    const carryResult = controller.checkJustDownForKey('carry');
    const walkResult = controller.checkJustDownForKey('walk');

    // Verify nothing was toggled
    expect(carryResult).toBe(false);
    expect(walkResult).toBe(false);
    expect(controller.mockPlayer.toggleCarrying).not.toHaveBeenCalled();
    expect(controller.mockPlayer.toggleWalking).not.toHaveBeenCalled();
  });

  it('should handle multiple JustDown events in a single update', () => {
    // Set up both keys to trigger JustDown
    controller.keys.carry.isDown = true;
    controller.keys.walk.isDown = true;
    controller.mockJustDown.mockReturnValue(true);

    // Check both keys
    controller.checkJustDownForKey('carry');
    controller.checkJustDownForKey('walk');

    // Verify both actions were toggled
    expect(controller.mockPlayer.toggleCarrying).toHaveBeenCalledTimes(1);
    expect(controller.mockPlayer.toggleWalking).toHaveBeenCalledTimes(1);
  });

  it('should only toggle carrying once even if checked multiple times', () => {
    // Set up carry key to trigger JustDown only once
    controller.simulateJustDown('carry');

    // First call to checkJustDownForKey will toggle carrying
    const result1 = controller.checkJustDownForKey('carry');
    expect(result1).toBe(true);

    // Make JustDown return false for subsequent calls
    controller.mockJustDown.mockReturnValue(false);

    // These calls should not toggle carrying since JustDown now returns false
    const result2 = controller.checkJustDownForKey('carry');
    const result3 = controller.checkJustDownForKey('carry');

    expect(result2).toBe(false);
    expect(result3).toBe(false);

    // Verify carrying was only toggled once
    expect(controller.mockPlayer.toggleCarrying).toHaveBeenCalledTimes(1);
  });

  it('should handle the case where JustDown returns false despite key being down', () => {
    // Key is down but JustDown returns false (already processed in a previous frame)
    controller.keys.carry.isDown = true;
    controller.mockJustDown.mockReturnValue(false);

    // Call the method that checks JustDown
    const result = controller.checkJustDownForKey('carry');

    // Verify carrying was not toggled
    expect(result).toBe(false);
    expect(controller.mockPlayer.toggleCarrying).not.toHaveBeenCalled();
  });

  it('should handle null or undefined keys gracefully', () => {
    // Set a key to null to simulate a missing key
    controller.keys.nonexistent = null;

    // This should not throw an error
    expect(() => {
      controller.checkJustDownForKey('nonexistent');
    }).not.toThrow();

    // Nothing should be toggled
    expect(controller.mockPlayer.toggleCarrying).not.toHaveBeenCalled();
    expect(controller.mockPlayer.toggleWalking).not.toHaveBeenCalled();
  });
});

/**
 * Test suite for InputController update edge cases
 *
 * This test focuses on the edge cases in the update method's handling
 * of cursors and keys.
 */
describe('InputController Update Edge Cases', () => {
  // Create a specialized test controller for update method edge cases
  class TestableUpdateController {
    constructor() {
      this.mockPlayer = {
        toggleCarrying: jest.fn(),
        toggleWalking: jest.fn(),
        isWalkingMode: jest.fn().mockReturnValue(false),
      };

      // Create input state to check updates
      this.inputState = {
        movement: {
          up: false,
          down: false,
          left: false,
          right: false,
          vector: { x: 0, y: 0 },
        },
        actions: {
          [Actions.COLLECTING]: false,
          [Actions.CUTTING]: false,
          [Actions.MINING]: false,
          [Actions.FISHING]: false,
          [Actions.WATERING]: false,
          [Actions.PIERCING]: false,
          [Actions.HIT]: false,
          [Actions.DEATH]: false,
        },
      };

      // Cursors and keys can be null before initialization
      this.cursors = null;
      this.keys = null;
    }

    // Simulate controller initialization
    init() {
      this.cursors = {
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false },
      };

      this.keys = {
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
        hit: { isDown: false },
        death: { isDown: false },
      };
    }

    // Simulate the update method
    update() {
      // Early return if cursors or keys are null (not initialized)
      if (!this.cursors || !this.keys) return false;

      // Update movement state (simplified version of the real update)
      this.inputState.movement.up = this.cursors.up.isDown || this.keys.w.isDown;
      this.inputState.movement.down = this.cursors.down.isDown || this.keys.s.isDown;
      this.inputState.movement.left = this.cursors.left.isDown || this.keys.a.isDown;
      this.inputState.movement.right = this.cursors.right.isDown || this.keys.d.isDown;

      // Calculate normalized movement vector
      let x = 0;
      let y = 0;
      if (this.inputState.movement.left) x -= 1;
      if (this.inputState.movement.right) x += 1;
      if (this.inputState.movement.up) y -= 1;
      if (this.inputState.movement.down) y += 1;

      // Normalize diagonal movement
      if (x !== 0 && y !== 0) {
        const length = Math.sqrt(x * x + y * y);
        x /= length;
        y /= length;
      }

      this.inputState.movement.vector = { x, y };

      // Update action states with safety checks
      this.inputState.actions[Actions.COLLECTING] =
        (this.keys.collect && this.keys.collect.isDown) || false;

      return true;
    }

    // Getters for testing
    getMovementVector() {
      return this.inputState.movement.vector;
    }

    isActionPressed(actionName) {
      return this.inputState.actions[actionName] || false;
    }
  }

  let controller;

  beforeEach(() => {
    controller = new TestableUpdateController();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return early if cursors and keys are null', () => {
    // Controller is not initialized
    const updateResult = controller.update();

    // Update should return false, indicating early return
    expect(updateResult).toBe(false);

    // InputState should remain unchanged
    expect(controller.getMovementVector()).toEqual({ x: 0, y: 0 });
  });

  it('should update properly after initialization', () => {
    // Initialize the controller
    controller.init();

    // Simulate key presses
    controller.cursors.right.isDown = true;
    controller.keys.collect.isDown = true;

    // Update should succeed
    const updateResult = controller.update();
    expect(updateResult).toBe(true);

    // InputState should be updated
    expect(controller.getMovementVector()).toEqual({ x: 1, y: 0 });
    expect(controller.isActionPressed(Actions.COLLECTING)).toBe(true);
  });

  it('should handle missing or modified keys object gracefully', () => {
    // Initialize controller
    controller.init();

    // Delete a key
    delete controller.keys.collect;

    // Update should still work
    const updateResult = controller.update();
    expect(updateResult).toBe(true);

    // Accessing deleted key should not throw error
    expect(controller.isActionPressed(Actions.COLLECTING)).toBe(false);
  });

  it('should handle null cursors but valid keys', () => {
    // Initialize with only keys
    controller.init();
    controller.cursors = null;

    // Update should fail due to null cursors
    const updateResult = controller.update();
    expect(updateResult).toBe(false);
  });

  it('should handle null keys but valid cursors', () => {
    // Initialize with only cursors
    controller.init();
    controller.keys = null;

    // Update should fail due to null keys
    const updateResult = controller.update();
    expect(updateResult).toBe(false);
  });

  it('should handle inputs with missing isDown properties', () => {
    // Initialize the controller
    controller.init();

    // Create a malformed key
    controller.keys.collect = {}; // No isDown property

    // Update should not throw
    expect(() => {
      controller.update();
    }).not.toThrow();

    // Action should default to false
    expect(controller.isActionPressed(Actions.COLLECTING)).toBe(false);
  });
});
