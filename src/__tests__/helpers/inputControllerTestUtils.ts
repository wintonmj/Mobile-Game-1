import { jest } from '@jest/globals';
import { InputController } from '../../controllers/InputController';
import { Player } from '../../models/Player';

// Define types for mock objects
interface MockCursors {
  up: { isDown: boolean };
  down: { isDown: boolean };
  left: { isDown: boolean };
  right: { isDown: boolean };
  space: { isDown: boolean };
  shift: { isDown: boolean };
}

interface MockKeys {
  w: { isDown: boolean };
  a: { isDown: boolean };
  s: { isDown: boolean };
  d: { isDown: boolean };
  collect: { isDown: boolean };
  cut: { isDown: boolean };
  mine: { isDown: boolean };
  fish: { isDown: boolean };
  water: { isDown: boolean };
  pierce: { isDown: boolean };
  carry: { isDown: boolean };
  walk: { isDown: boolean };
  hit: { isDown: boolean };
  death: { isDown: boolean };
  [key: string]: { isDown: boolean };
}

interface MockInputScene {
  input: {
    keyboard: {
      createCursorKeys: jest.Mock;
      addKeys: jest.Mock;
    };
  };
  cursors: MockCursors;
  keys: MockKeys;
}

interface MockPlayer {
  toggleCarrying: jest.Mock;
  toggleWalking: jest.Mock;
  isWalkingMode: jest.Mock;
}

interface MockInputObjects {
  cursors: MockCursors;
  keys: MockKeys;
}

/**
 * Creates a mock Phaser scene with input controllers for testing InputController
 */
export function createMockInputScene(): MockInputScene {
  // Create mock cursor keys with proper structure
  const mockCursors: MockCursors = {
    up: { isDown: false },
    down: { isDown: false },
    left: { isDown: false },
    right: { isDown: false },
    space: { isDown: false },
    shift: { isDown: false },
  };

  // Create mock action keys with proper structure
  const mockKeys: MockKeys = {
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

  // Create mock keyboard functions that actually return our mock objects
  const mockKeyboard = {
    createCursorKeys: jest.fn().mockReturnValue(mockCursors),
    addKeys: jest.fn().mockReturnValue(mockKeys),
  };

  const mockScene: MockInputScene = {
    input: {
      keyboard: mockKeyboard,
    },
    cursors: mockCursors,
    keys: mockKeys,
  };

  return mockScene;
}

/**
 * Creates a mock player for input controller tests
 */
export function createMockInputPlayer(): MockPlayer {
  const mockPlayer: MockPlayer = {
    toggleCarrying: jest.fn(),
    toggleWalking: jest.fn(),
    isWalkingMode: jest.fn().mockReturnValue(false),
  };
  return mockPlayer;
}

/**
 * Creates a ready-to-use InputController with mocked dependencies
 */
export function createTestInputController() {
  const mockScene = createMockInputScene();
  const mockPlayer = createMockInputPlayer();

  // Create the controller
  const inputController = new InputController(
    mockScene as unknown as Phaser.Scene,
    mockPlayer as unknown as Player
  );

  // Access the private fields to set up the mocks correctly
  (inputController as unknown as { cursors: MockCursors }).cursors = mockScene.cursors;
  (inputController as unknown as { keys: MockKeys }).keys = mockScene.keys;

  // Initialize the controller
  inputController.init();

  return {
    controller: inputController,
    scene: mockScene,
    player: mockPlayer,
    // Easy access to the mock cursors and keys
    cursors: mockScene.cursors,
    keys: mockScene.keys,
  };
}

/**
 * Simulates pressing a directional key
 */
export function pressDirectionKey(
  mockInputObjects: MockInputObjects,
  direction: 'up' | 'down' | 'left' | 'right'
): void {
  // Reset all direction keys first
  resetAllDirectionKeys(mockInputObjects);

  // Set the specific direction key
  mockInputObjects.cursors[direction].isDown = true;
}

/**
 * Simulates pressing a WASD key
 */
export function pressWASDKey(mockInputObjects: MockInputObjects, key: 'w' | 'a' | 's' | 'd'): void {
  // Reset all WASD keys first
  resetAllWASDKeys(mockInputObjects);

  // Set the specific WASD key
  mockInputObjects.keys[key].isDown = true;
}

/**
 * Simulates pressing an action key
 */
export function pressActionKey(mockInputObjects: MockInputObjects, actionKey: string): void {
  mockInputObjects.keys[actionKey].isDown = true;
}

/**
 * Resets all directional keys to not pressed
 */
export function resetAllDirectionKeys(mockInputObjects: MockInputObjects): void {
  mockInputObjects.cursors.up.isDown = false;
  mockInputObjects.cursors.down.isDown = false;
  mockInputObjects.cursors.left.isDown = false;
  mockInputObjects.cursors.right.isDown = false;
}

/**
 * Resets all WASD keys to not pressed
 */
export function resetAllWASDKeys(mockInputObjects: MockInputObjects): void {
  mockInputObjects.keys.w.isDown = false;
  mockInputObjects.keys.a.isDown = false;
  mockInputObjects.keys.s.isDown = false;
  mockInputObjects.keys.d.isDown = false;
}

/**
 * Resets all action keys to not pressed
 */
export function resetAllActionKeys(mockInputObjects: MockInputObjects): void {
  mockInputObjects.keys.collect.isDown = false;
  mockInputObjects.keys.cut.isDown = false;
  mockInputObjects.keys.mine.isDown = false;
  mockInputObjects.keys.fish.isDown = false;
  mockInputObjects.keys.water.isDown = false;
  mockInputObjects.keys.pierce.isDown = false;
  mockInputObjects.keys.carry.isDown = false;
  mockInputObjects.keys.walk.isDown = false;
  mockInputObjects.keys.hit.isDown = false;
  mockInputObjects.keys.death.isDown = false;
}

/**
 * Resets all keys to not pressed
 */
export function resetAllKeys(mockInputObjects: MockInputObjects): void {
  resetAllDirectionKeys(mockInputObjects);
  resetAllWASDKeys(mockInputObjects);
  resetAllActionKeys(mockInputObjects);
}

/**
 * Sets up the mock to simulate JustDown for the specified keys
 */
export function setupMockJustDown(
  mockPhaserInput: { Keyboard: { JustDown: jest.Mock } },
  targetKey: { isDown: boolean }
) {
  // Create a mock implementation that only returns true for the specified key
  mockPhaserInput.Keyboard.JustDown = jest.fn().mockImplementation((key) => {
    return key === targetKey;
  });
}
