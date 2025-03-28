import { jest } from '@jest/globals';
import { PlayerAnimationLoader } from '../../views/PlayerAnimationLoader';
import { Actions, ActionAnimations } from '../../models/Actions';
import type Phaser from 'phaser';
import { ModelContextTest } from '../helpers/modelContextTest';
import {
  advanceTimersAndRunMicrotasks,
  runAllTimersAndMicrotasks,
  waitForCondition,
  withFakeTimers,
  waitForTime,
  setupFakeTimers,
  restoreRealTimers
} from '../helpers/timerTestUtils';

describe('PlayerAnimationLoader', () => {
  // Create a properly typed mock Phaser scene
  const mockScene = {
    load: {
      spritesheet: jest.fn(),
    },
    anims: {
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
      exists: jest.fn().mockReturnValue(false),
    },
    textures: {
      exists: jest.fn().mockReturnValue(true),
    },
  };

  // Create the animation loader once for all tests
  let animationLoader: PlayerAnimationLoader;

  beforeEach(() => {
    jest.clearAllMocks();
    animationLoader = new PlayerAnimationLoader(mockScene as any);
    setupFakeTimers({ timeoutMs: 10000 });
  });

  afterEach(() => {
    restoreRealTimers();
  });

  it(
    'should preload animations without browser errors',
    ModelContextTest.createTest(async () => {
      // Call preloadAnimations
      expect(() => animationLoader.preloadAnimations()).not.toThrow();

      // Verify loader.spritesheet was called multiple times
      expect(mockScene.load.spritesheet).toHaveBeenCalled();

      // Verify spritesheet was called for idle_down
      expect(mockScene.load.spritesheet).toHaveBeenCalledWith(
        'idle_down',
        expect.stringContaining('Idle_Down-Sheet.png'),
        expect.any(Object)
      );

      // Assert that no browser errors occurred during loading
      ModelContextTest.assertNoErrors();
    })
  );

  it(
    'should create animations without browser errors',
    ModelContextTest.createTest(async () => {
      // Setup textures.exists to return true to simulate loaded textures
      (mockScene.textures.exists as jest.Mock).mockReturnValue(true);

      // Call createAnimations
      expect(() => animationLoader.createAnimations()).not.toThrow();

      // Verify anims.create was called
      expect(mockScene.anims.create).toHaveBeenCalled();

      // Assert that no browser errors occurred during animation creation
      ModelContextTest.assertNoErrors();
    })
  );

  it(
    'should handle missing textures gracefully',
    ModelContextTest.createTest(async () => {
      // Setup textures.exists to return false to simulate missing textures
      (mockScene.textures.exists as jest.Mock).mockReturnValue(false);

      // Call createAnimations - should not throw despite missing textures
      expect(() => animationLoader.createAnimations()).not.toThrow();

      // Verify createWalkAnimations didn't throw despite missing textures
      expect(mockScene.anims.create).not.toHaveBeenCalled();

      // No errors should be thrown due to the try/catch in PlayerAnimationLoader
      ModelContextTest.assertNoErrors();
    })
  );

  it('should load specific animations for all directions', () => {
    // Create a spy on the loadSpecificAnimation method
    const loadSpy = jest.spyOn(animationLoader as any, 'loadSpecificAnimation');

    // Call preloadAnimations
    animationLoader.preloadAnimations();

    // Verify loadSpecificAnimation was called for 'idle'
    expect(loadSpy).toHaveBeenCalledWith('idle', 'Idle_Base', expect.any(String));
  });

  it('should handle animation transitions between actions', () => {
    // Setup mocks to return true to simulate loaded textures
    (mockScene.textures.exists as jest.Mock).mockReturnValue(true);
    (mockScene.anims.exists as jest.Mock).mockReturnValue(false);
    (mockScene.anims.generateFrameNumbers as jest.Mock).mockReturnValue([0, 1, 2, 3]);

    // Get all possible actions from the Actions enum
    const actionStates = Object.values(Actions);

    // Call createAnimations
    animationLoader.createAnimations();

    // Verify animations were created for transitions
    expect(mockScene.anims.create).toHaveBeenCalled();

    // Reset the mock
    jest.clearAllMocks();

    // Test each action
    actionStates.forEach((action) => {
      if (action in ActionAnimations) {
        // Call createAnimationsFromConfig directly with just this action
        const singleActionConfig = {
          [action]: ActionAnimations[action as keyof typeof ActionAnimations],
        };
        (animationLoader as any).createAnimationsFromConfig(singleActionConfig);

        // For each action that has a config, verify that anims.create was called
        expect(mockScene.anims.create).toHaveBeenCalled();

        // Reset the mock for the next iteration
        jest.clearAllMocks();
      }
    });
  });

  it(
    'should create walk animations for all directions',
    ModelContextTest.createTest(async () => {
      // Setup all required mocks
      const mockScene = {
        load: {
          spritesheet: jest.fn(),
          once: jest.fn((event: string, callback: Function) => {
            if (event === 'complete') {
              callback();
            }
          })
        },
        textures: {
          exists: jest.fn().mockReturnValue(true)
        },
        anims: {
          create: jest.fn(),
          generateFrameNumbers: jest.fn().mockReturnValue([0, 1, 2, 3])
        }
      };

      // Create the loader
      const loader = new PlayerAnimationLoader(mockScene as any);

      // Preload animations
      loader.preloadAnimations();
      await runAllTimersAndMicrotasks({ timeoutMs: 10000 });

      // Create animations
      loader.createAnimations();
      await runAllTimersAndMicrotasks({ timeoutMs: 10000 });

      // Verify walk animations were created for all directions
      expect(mockScene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'walking_down' })
      );
      expect(mockScene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'walking_up' })
      );
      expect(mockScene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'walking_right' })
      );
      expect(mockScene.anims.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'walking_left' })
      );

      // No browser errors should occur
      ModelContextTest.assertNoErrors();
    })
  );
});
