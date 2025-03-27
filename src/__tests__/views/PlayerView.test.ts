import { jest } from '@jest/globals';
import { PlayerView } from '../../views/PlayerView';
import { Actions } from '../../models/Actions';
import type Phaser from 'phaser';

// Improved mockSprite typing that preserves the structure
interface MockSprite {
  setPosition: jest.Mock;
  setScale: jest.Mock;
  setTexture: jest.Mock;
  setFlipX: jest.Mock;
  play: jest.Mock;
  on: jest.Mock;
  anims: {
    getName: jest.Mock;
  };
}

describe('PlayerView', () => {
  // Define mock objects with more precise typing
  let mockScene: Partial<Phaser.Scene>;
  let mockSprite: MockSprite; // Use the interface for better type safety
  let playerView: PlayerView;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock sprite with any typing
    mockSprite = {
      setPosition: jest.fn().mockReturnValue({}),
      setScale: jest.fn().mockReturnValue({}),
      setTexture: jest.fn().mockReturnValue({}),
      setFlipX: jest.fn().mockReturnValue({}),
      play: jest.fn().mockReturnValue({}),
      on: jest.fn().mockReturnValue({}),
      anims: {
        getName: jest.fn().mockReturnValue('idle-down'),
      },
    };

    // Create mock anims object
    const mockAnims = {
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
    };

    // Create mock add object with a casted sprite function
    const mockAdd = {
      sprite: jest.fn().mockReturnValue(mockSprite),
    };

    // Create mock load object
    const mockLoad = {
      spritesheet: jest.fn(),
    };

    // Create mock scene with casts to avoid type issues
    mockScene = {
      anims: mockAnims as unknown as Phaser.Animations.AnimationManager,
      add: mockAdd as unknown as Phaser.GameObjects.GameObjectFactory,
      load: mockLoad as unknown as Phaser.Loader.LoaderPlugin,
    };

    // Create PlayerView instance
    playerView = new PlayerView(mockScene as Phaser.Scene);
  });

  it('should preload player animations', () => {
    // Call preload method
    playerView.preload();

    // Verify that load.spritesheet was called multiple times for different animations
    expect(mockScene.load?.spritesheet).toHaveBeenCalled();
  });

  it('should create player sprite and initial animation', () => {
    // Call create method
    const result = playerView.create(100, 200);

    // Verify sprite creation
    expect(mockScene.add?.sprite).toHaveBeenCalledWith(100, 200, expect.any(String));
    expect(result).toBe(mockSprite);

    // Verify sprite configuration
    expect(mockSprite.setScale).toHaveBeenCalled();
    expect(mockSprite.play).toHaveBeenCalledWith(expect.stringContaining('idle'));
  });

  it('should set up animation completion callback for non-repeating animations', () => {
    // Call create
    playerView.create(100, 200);

    // Verify that event listener was added
    expect(mockSprite.on).toHaveBeenCalledWith('animationcomplete', expect.any(Function));

    // Get the callback function - explicitly type as a callback function
    const callback = (mockSprite.on as jest.Mock).mock.calls[0][1] as (anim: {
      key: string;
    }) => void;

    // Set up onActionComplete callback
    const mockOnActionComplete = jest.fn();
    playerView.onActionComplete = mockOnActionComplete;

    // Simulate animation completion for a non-repeating animation (like mining)
    callback({ key: 'mine-down' });

    // Verify that onActionComplete was called
    expect(mockOnActionComplete).toHaveBeenCalled();
  });

  it('should update sprite position and animation based on direction and action', () => {
    // First create the sprite
    playerView.create(100, 200);

    // Then update with new position, direction and action
    playerView.update(150, 250, 'right', Actions.MOVING);

    // Verify position update
    expect(mockSprite.setPosition).toHaveBeenCalledWith(150, 250);

    // Verify texture and animation update
    expect(mockSprite.setFlipX).toHaveBeenCalledWith(false); // For right direction
    expect(mockSprite.setTexture).toHaveBeenCalled();
    expect(mockSprite.play).toHaveBeenCalled();
  });

  it('should handle left direction with flipped sprite', () => {
    // Create sprite
    playerView.create(100, 200);

    // Update with left direction
    playerView.update(150, 250, 'left', Actions.MOVING);

    // Verify sprite is flipped for left direction
    expect(mockSprite.setFlipX).toHaveBeenCalledWith(true);
  });

  it('should not change animation if it is already playing', () => {
    // Create sprite
    playerView.create(100, 200);

    // Clear all previous mock calls
    jest.clearAllMocks();

    // Mock the current animation name to match what we're about to set
    mockSprite.anims.getName.mockReturnValue('run-left');

    // Update with matching animation - use the same animation key that's returned by getName
    const animationKey = mockSprite.anims.getName();

    // Mock PlayerView.getDirectionKeys to return the animation key we want to test
    jest
      .spyOn(
        PlayerView.prototype as unknown as Record<string, (...args: unknown[]) => unknown>,
        'getDirectionKeys'
      )
      .mockReturnValue({
        down: 'run-down',
        left: animationKey, // This should match the mocked getName return value
        up: 'run-up',
      });

    // Update - this should use the same animation key
    playerView.update(150, 250, 'left', Actions.MOVING);

    // Animation should not be changed because we're already playing that animation
    expect(mockSprite.play).not.toHaveBeenCalled();
  });

  it('should transition between different actions correctly', () => {
    // Create sprite
    playerView.create(100, 200);

    // Start with idle
    playerView.update(100, 100, 'down', Actions.IDLE);
    expect(mockSprite.play).toHaveBeenCalledWith('idle-down');

    // Transition to moving
    jest.clearAllMocks();
    playerView.update(100, 100, 'right', Actions.MOVING);
    expect(mockSprite.play).toHaveBeenCalledWith('run-left');

    // Transition to mining
    jest.clearAllMocks();
    playerView.update(100, 100, 'up', Actions.MINING);
    expect(mockSprite.play).toHaveBeenCalledWith('mine-up');

    // Transition to carrying idle
    jest.clearAllMocks();
    playerView.update(100, 100, 'down', Actions.CARRY_IDLE);
    expect(mockSprite.play).toHaveBeenCalledWith('carry-idle-down');
  });

  it('should handle null sprite gracefully', () => {
    // Don't call create, leaving sprite as null

    // Update should not throw an error
    expect(() => {
      playerView.update(100, 100, 'down', Actions.IDLE);
    }).not.toThrow();
  });
});
