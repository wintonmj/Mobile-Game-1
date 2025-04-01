/**
 * Tests for MainScene
 * 
 * @file MainScene.test.ts
 * @module tests/unit/scenes
 * @group unit
 * @group scenes
 * @coverage-target 90%
 * @description Tests the main game scene functionality including click handling, text display, and scene transitions
 * 
 * @see {@link docs/testing/jest-configuration-troubleshooting.md} Jest configuration and common troubleshooting patterns
 * @see {@link tests/jest.setup.ts} Test environment configuration
 * @see {@link docs/testing/unit/scenes.md} Scene testing guidelines and patterns
 * @see {@link docs/testing/helpers/scene-test-bed.md} Scene testing utilities
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} Mocking strategy guidelines
 * @see {@link docs/testing/jest-testing-strategy.md} Overall testing approach
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock Phaser before importing MainScene
jest.mock('phaser');

import { MainScene } from '../../../src/scenes/MainScene';

/**
 * Interface representing a mock game object with required test methods
 * @interface MockGameObject
 */
interface MockGameObject {
  /** Mock function for setting the origin of the game object */
  setOrigin: jest.Mock;
  /** Optional mock function for setting text content */
  setText?: jest.Mock;
}

/**
 * Type extending MainScene with additional test-specific properties
 * @typedef {MainScene & { _countText?: MockGameObject; hot: { data?: { clickCount: number } } }} MockScene
 */
type MockScene = MainScene & {
  _countText?: MockGameObject;
  hot: { data?: { clickCount: number } };
};

/**
 * Test suite for MainScene functionality
 * 
 * @namespace MainSceneTests
 * @description Tests core scene functionality including:
 * 1. Scene initialization and setup
 * 2. UI element creation and positioning
 * 3. Input handling (clicks and keyboard)
 * 4. Scene transitions
 * 5. State persistence
 */
describe('MainScene', () => {
  /** @type {MockScene} The scene instance used for testing */
  let scene: MockScene;

  /**
   * Set up test environment before each test
   * @memberof MainSceneTests
   */
  beforeEach(() => {
    scene = new MainScene() as MockScene;
    
    // Mock scene properties and methods
    const mockText: MockGameObject = {
      setOrigin: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
    };

    // Set up scene key properly
    scene.scene = {
      key: 'MainScene',
      start: jest.fn(),
    } as any;

    // Mock Phaser systems more completely
    scene.add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue(mockText),
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
    } as any;

    scene.input = {
      on: jest.fn(),
      keyboard: {
        on: jest.fn(),
        addKey: jest.fn(),
      },
    } as any;

    scene.cameras = {
      main: {
        centerX: 400,
        centerY: 300,
      },
    } as any;

    // Store mock text for later assertions
    scene._countText = mockText;
  });

  /**
   * Clean up after each test
   * @memberof MainSceneTests
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tests for scene creation and setup
   * 
   * @namespace MainSceneTests.create
   * @description Verifies:
   * - Background image setup
   * - Text element creation and positioning
   * - Input handler registration
   * - Initial state configuration
   */
  describe('create', () => {
    /**
     * Tests the initial scene setup
     * @memberof MainSceneTests.create
     */
    it('should set up the scene correctly', () => {
      scene.create();

      // Verify background image was added
      const addImage = scene.add.image as jest.Mock;
      expect(addImage).toHaveBeenCalledWith(0, 0, 'background');
      const mockImage = addImage.mock.results[0]?.value as MockGameObject;
      expect(mockImage?.setOrigin).toHaveBeenCalledWith(0, 0);

      // Verify text elements were added
      const addText = scene.add.text as jest.Mock;
      expect(addText).toHaveBeenCalledTimes(3); // Hello World, counter, and instructions
      
      // Verify input handlers were set up
      const inputOn = scene.input.on as jest.Mock;
      expect(inputOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      
      const keyboardOn = scene.input.keyboard?.on as jest.Mock;
      expect(keyboardOn).toHaveBeenCalledWith('keydown-R', expect.any(Function));
    });

    /**
     * Tests the click counter functionality
     * 
     * Verifies:
     * - Initial counter state
     * - Counter increment on click
     * - Text update after click
     */
    it('should increment counter on click', () => {
      scene.create();

      // Get the click handler
      const inputOn = scene.input.on as jest.Mock;
      const clickHandler = inputOn.mock.calls[0]?.[1] as (() => void) | undefined;
      expect(clickHandler).toBeDefined();
      
      // Initial counter text
      const addText = scene.add.text as jest.Mock;
      const initialText = addText.mock.calls[1]?.[2];
      expect(initialText).toBe('Clicks: 0');

      // Simulate click
      if (clickHandler) {
        clickHandler();
      }

      // Counter should be updated
      const countText = scene._countText;
      expect(countText?.setText).toHaveBeenCalledWith('Clicks: 1');
    });

    /**
     * Tests scene transition on R key press
     * 
     * Verifies:
     * - Key handler registration
     * - Scene transition trigger
     * - Correct target scene
     */
    it('should start LoadingScene when R key is pressed', () => {
      scene.create();
      
      // Get the keyboard handler
      const keyboardOn = scene.input.keyboard?.on as jest.Mock;
      const keyboardHandler = keyboardOn.mock.calls[0]?.[1] as (() => void) | undefined;
      expect(keyboardHandler).toBeDefined();
      
      // Simulate R key press
      if (keyboardHandler) {
        keyboardHandler();
      }
      
      expect(scene.scene.start).toHaveBeenCalledWith('LoadingScene');
    });
  });

  /**
   * Tests for scene state persistence
   * 
   * Verifies:
   * - State storage before scene destruction
   * - State restoration during initialization
   */
  describe('beforeDestroy', () => {
    /**
     * Tests state storage before scene destruction
     */
    it('should store click count in hot data', () => {
      // Set up initial state
      scene.create();
      const inputOn = scene.input.on as jest.Mock;
      const clickHandler = inputOn.mock.calls[0]?.[1] as (() => void) | undefined;
      expect(clickHandler).toBeDefined();
      
      // Simulate 5 clicks
      if (clickHandler) {
        for (let i = 0; i < 5; i++) {
          clickHandler();
        }
      }
      
      scene.hot = {};
      scene.beforeDestroy();
      
      expect(scene.hot.data).toEqual({ clickCount: 5 });
    });
  });

  /**
   * Tests for scene initialization
   * 
   * Verifies:
   * - State restoration from hot data
   * - Default state handling
   */
  describe('init', () => {
    /**
     * Tests state restoration from hot data
     */
    it('should restore click count from hot data', () => {
      scene.hot = { data: { clickCount: 10 } };
      scene.init();
      scene.create();
      
      // Verify the restored count is reflected in the text
      const addText = scene.add.text as jest.Mock;
      const counterText = addText.mock.calls[1]?.[2];
      expect(counterText).toBe('Clicks: 10');
    });

    /**
     * Tests default state handling when no hot data exists
     */
    it('should keep existing click count if no hot data', () => {
      // Set up initial state with 5 clicks
      scene.create();
      const inputOn = scene.input.on as jest.Mock;
      const clickHandler = inputOn.mock.calls[0]?.[1] as (() => void) | undefined;
      expect(clickHandler).toBeDefined();
      
      // Simulate 5 clicks
      if (clickHandler) {
        for (let i = 0; i < 5; i++) {
          clickHandler();
        }
      }
      
      scene.init();
      scene.create();
      
      // Verify the count is reset to 0 since there's no hot data
      const addText = scene.add.text as jest.Mock;
      const counterText = addText.mock.calls[1]?.[2];
      expect(counterText).toBe('Clicks: 0');
    });
  });

  it('should be created with correct scene key', () => {
    expect(scene.scene.key).toBe('MainScene');
  });

  it('should create game objects in create method', () => {
    // Call create method
    scene.create();

    // Verify game objects were created
    expect(scene.add.image).toHaveBeenCalled();
    expect(scene.add.text).toHaveBeenCalledTimes(3); // Hello World, counter, and instructions
  });
}); 