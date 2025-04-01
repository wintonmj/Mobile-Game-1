import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock Phaser before importing MainScene
jest.mock('phaser');

import { MainScene } from '../../../src/scenes/MainScene';
import * as Phaser from 'phaser';

describe('MainScene', () => {
  let scene: MainScene;

  beforeEach(() => {
    scene = new MainScene();
    
    // Mock scene properties and methods
    const mockText = {
      setOrigin: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
    };

    scene.add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue(mockText),
    } as any;

    scene.input = {
      on: jest.fn(),
      keyboard: {
        on: jest.fn(),
      },
    } as any;

    scene.scene = {
      start: jest.fn(),
    } as any;

    scene.cameras = {
      main: {
        centerX: 400,
        centerY: 300,
      },
    } as any;

    // Store mock text for later assertions
    (scene as any).countText = mockText;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should set up the scene correctly', () => {
      scene.create();

      // Verify background image was added
      const addImage = scene.add.image as jest.Mock;
      expect(addImage).toHaveBeenCalledWith(0, 0, 'background');
      expect(addImage.mock.results[0].value.setOrigin).toHaveBeenCalledWith(0, 0);

      // Verify text elements were added
      const addText = scene.add.text as jest.Mock;
      expect(addText).toHaveBeenCalledTimes(3); // Hello World, counter, and instructions
      
      // Verify input handlers were set up
      const inputOn = scene.input.on as jest.Mock;
      expect(inputOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      
      const keyboardOn = scene.input.keyboard?.on as jest.Mock;
      expect(keyboardOn).toHaveBeenCalledWith('keydown-R', expect.any(Function));
    });

    it('should increment counter on click', () => {
      scene.create();

      // Get the click handler
      const inputOn = scene.input.on as jest.Mock;
      const clickHandler = inputOn.mock.calls[0][1];
      
      // Initial counter text
      const addText = scene.add.text as jest.Mock;
      expect(addText.mock.calls[1][2]).toBe('Clicks: 0');

      // Simulate click
      clickHandler();

      // Counter should be updated
      const countText = (scene as any).countText;
      expect(countText.setText).toHaveBeenCalledWith('Clicks: 1');
    });

    it('should start LoadingScene when R key is pressed', () => {
      scene.create();
      
      // Get the keyboard handler
      const keyboardOn = scene.input.keyboard?.on as jest.Mock;
      const keyboardHandler = keyboardOn.mock.calls[0][1];
      
      // Simulate R key press
      keyboardHandler();
      
      expect(scene.scene.start).toHaveBeenCalledWith('LoadingScene');
    });
  });

  describe('beforeDestroy', () => {
    it('should store click count in hot data', () => {
      (scene as any).clickCount = 5;
      scene.hot = {};
      
      scene.beforeDestroy();
      
      expect(scene.hot.data).toEqual({ clickCount: 5 });
    });
  });

  describe('init', () => {
    it('should restore click count from hot data', () => {
      scene.hot = { data: { clickCount: 10 } };
      
      scene.init();
      
      expect((scene as any).clickCount).toBe(10);
    });

    it('should keep existing click count if no hot data', () => {
      (scene as any).clickCount = 5;
      
      scene.init();
      
      expect((scene as any).clickCount).toBe(5);
    });
  });
}); 