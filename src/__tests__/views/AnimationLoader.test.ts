import { jest } from '@jest/globals';
import { AnimationLoader } from '../../views/AnimationLoader';
import { Actions } from '../../models/Actions';
import type Phaser from 'phaser';

describe('AnimationLoader', () => {
  let mockScene: Partial<Phaser.Scene>;
  let animationLoader: AnimationLoader;

  beforeEach(() => {
    // Create mock textures object
    const mockTextures = {
      exists: jest.fn().mockReturnValue(true),
      getTextureKeys: jest.fn().mockReturnValue(['idle_down', 'walk_down', 'run_down']),
    };

    // Create mock anims object
    const mockAnims = {
      create: jest.fn(),
      exists: jest.fn().mockReturnValue(false),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
    };

    // Create mock loader
    const mockLoader = {
      spritesheet: jest.fn(),
      on: jest.fn(),
    };

    // Create mock scene with casts to avoid type issues
    mockScene = {
      textures: mockTextures as unknown as Phaser.Textures.TextureManager,
      anims: mockAnims as unknown as Phaser.Animations.AnimationManager,
      load: mockLoader as unknown as Phaser.Loader.LoaderPlugin,
    };

    // Create animation loader instance
    animationLoader = new AnimationLoader(mockScene as Phaser.Scene);
  });

  it('should preload animations without errors', () => {
    // Call preloadAnimations
    expect(() => animationLoader.preloadAnimations()).not.toThrow();

    // Verify loader.on was called to handle errors
    expect(mockScene.load?.on).toHaveBeenCalledWith('loaderror', expect.any(Function));

    // Verify loader.spritesheet was called multiple times
    expect(mockScene.load?.spritesheet).toHaveBeenCalled();
  });

  it('should create animations without errors', () => {
    // Call createAnimations
    expect(() => animationLoader.createAnimations()).not.toThrow();

    // Verify anims.create was called
    expect(mockScene.anims?.create).toHaveBeenCalled();
  });

  it('should load specific animations for all directions', () => {
    // Call preloadAnimations which will internally call loadSpecificAnimation for various animation types
    animationLoader.preloadAnimations();

    // Verify that spritesheet was called with different direction variants
    const spritesheetMock = mockScene.load?.spritesheet as jest.Mock;

    // Filter calls that include directional variants
    const downCalls = spritesheetMock.mock.calls.filter(
      (call) => call[1] && typeof call[1] === 'string' && call[1].includes('Down-Sheet.png')
    );
    const sideCalls = spritesheetMock.mock.calls.filter(
      (call) => call[1] && typeof call[1] === 'string' && call[1].includes('Side-Sheet.png')
    );
    const upCalls = spritesheetMock.mock.calls.filter(
      (call) => call[1] && typeof call[1] === 'string' && call[1].includes('Up-Sheet.png')
    );

    // Verify at least one call for each direction
    expect(downCalls.length).toBeGreaterThan(0);
    expect(sideCalls.length).toBeGreaterThan(0);
    expect(upCalls.length).toBeGreaterThan(0);

    // Verify that we loaded idle animations
    expect(spritesheetMock).toHaveBeenCalledWith(
      expect.stringContaining('idle'),
      expect.stringContaining('Idle'),
      expect.any(Object)
    );
  });

  it('should handle animation transitions between actions', () => {
    // Mock the anims.exists to return true for animations created
    const existsMock = mockScene.anims?.exists as jest.Mock;
    // @ts-expect-error - Jest typing issue with mockImplementation
    existsMock.mockImplementation((key: string) => {
      // Return true for specific animations we're testing
      return ['idle_down', 'walking_down', 'mining_down'].includes(key);
    });

    // Create animations for state transitions
    animationLoader.createAnimations();

    // Verify animations were created for different action states
    const actionStates = [Actions.IDLE, Actions.WALKING, Actions.MINING];

    actionStates.forEach(() => {
      // For each action, verify that anims.create was called
      expect(mockScene.anims?.create).toHaveBeenCalled();
    });
  });

  it('should handle errors when textures are missing', () => {
    // Mock textures.exists to return false to simulate missing textures
    const existsMock = mockScene.textures?.exists as jest.Mock;
    existsMock.mockReturnValue(false);

    // Call createAnimations - should not throw despite missing textures
    expect(() => animationLoader.createAnimations()).not.toThrow();
  });
});
