/**
 * Example Scene Test Implementation
 * 
 * @file example.test.ts
 * @group unit
 * @group scenes
 * @description Demonstrates proper scene testing patterns including sprite creation, text handling, and input management
 * @since 1.0.0
 * @module tests/example
 * 
 * @see {@link docs/testing/unit/scenes.md} Scene testing guidelines and patterns
 * @see {@link docs/testing/helpers/scene-test-bed.md} Scene testing utilities
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} Mocking strategy guidelines
 * @see {@link docs/testing/jest-testing-strategy.md} Overall testing approach
 * @see {@link tests/jest.setup.ts} Test environment configuration
 */

import { Scene } from 'phaser';
import { jest } from '@jest/globals';

/**
 * Interface representing a mock Phaser sprite with common methods
 * @interface MockSprite
 */
interface MockSprite {
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setScale: jest.Mock;
  setDepth: jest.Mock;
  setAlpha: jest.Mock;
  setTint: jest.Mock;
  play: jest.Mock;
  on: jest.Mock;
}

/**
 * Interface representing a mock Phaser text object
 * @interface MockText
 */
interface MockText {
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setStyle: jest.Mock;
  setText: jest.Mock;
  on: jest.Mock;
}

/**
 * Example scene class for demonstrating test patterns
 * @class ExampleScene
 * @extends Phaser.Scene
 */
class ExampleScene extends Scene {
  sprite: any;
  text: any;

  constructor() {
    super({ key: 'ExampleScene' });
  }

  /**
   * Creates the scene's game objects and sets up input handlers
   * @method create
   * @memberof ExampleScene
   */
  create() {
    // Create a sprite
    this.sprite = this.add.sprite(100, 100, 'player');
    this.sprite.setScale(2);

    // Add text
    this.text = this.add.text(400, 300, 'Hello World', {
      fontSize: '32px',
      color: '#ffffff'
    });
    this.text.setOrigin(0.5);

    // Add keyboard input
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.text.setText('Space pressed!');
    });

    // Add pointer input
    this.input.on('pointerdown', (pointer: any) => {
      this.sprite.setPosition(pointer.x, pointer.y);
    });
  }
}

/**
 * Test suite for ExampleScene
 * @describe ExampleScene
 */
describe('ExampleScene', () => {
  let scene: ExampleScene;
  let spriteMock: MockSprite;
  let textMock: MockText;
  let keyboardCallback: ((e: any) => void) | null = null;
  let pointerCallback: ((e: any) => void) | null = null;

  /**
   * Set up test environment before each test
   * @beforeEach
   */
  beforeEach(() => {
    // Create mock objects
    spriteMock = {
      setPosition: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setTint: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    };

    textMock = {
      setPosition: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    };

    // Create scene instance
    scene = new ExampleScene();

    // Mock scene methods
    const mockSprite = jest.fn().mockReturnValue(spriteMock);
    const mockText = jest.fn().mockReturnValue(textMock);
    const mockKeyboardOn = jest.fn((event: string, callback: (e: any) => void) => {
      if (event === 'keydown-SPACE') {
        keyboardCallback = callback;
      }
    });
    const mockPointerOn = jest.fn((event: string, callback: (e: any) => void) => {
      if (event === 'pointerdown') {
        pointerCallback = callback;
      }
    });

    // Set up scene mocks
    scene.add = {
      sprite: mockSprite,
      text: mockText
    } as any;

    scene.input = {
      keyboard: {
        on: mockKeyboardOn
      },
      on: mockPointerOn
    } as any;

    // Run create to initialize the scene
    scene.create();
  });

  /**
   * Clean up test environment after each test
   * @afterEach
   */
  afterEach(() => {
    jest.clearAllMocks();
    keyboardCallback = null;
    pointerCallback = null;
  });

  /**
   * @test Verifies correct creation of sprite and text objects with proper properties
   */
  it('should create sprite and text with correct properties', () => {
    expect(scene.add.sprite).toHaveBeenCalledWith(100, 100, 'player');
    expect(spriteMock.setScale).toHaveBeenCalledWith(2);

    expect(scene.add.text).toHaveBeenCalledWith(400, 300, 'Hello World', {
      fontSize: '32px',
      color: '#ffffff'
    });
    expect(textMock.setOrigin).toHaveBeenCalledWith(0.5);
  });

  /**
   * @test Verifies text update functionality when space key is pressed
   */
  it('should update text when space key is pressed', () => {
    expect(scene.input.keyboard!.on).toHaveBeenCalledWith('keydown-SPACE', expect.any(Function));
    expect(keyboardCallback).toBeDefined();

    if (keyboardCallback) {
      keyboardCallback({ key: 'SPACE' });
      expect(textMock.setText).toHaveBeenCalledWith('Space pressed!');
    }
  });

  /**
   * @test Verifies sprite movement on pointer input
   */
  it('should move sprite to pointer position on click', () => {
    expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(pointerCallback).toBeDefined();

    if (pointerCallback) {
      pointerCallback({ x: 200, y: 150 });
      expect(spriteMock.setPosition).toHaveBeenCalledWith(200, 150);
    }
  });
}); 