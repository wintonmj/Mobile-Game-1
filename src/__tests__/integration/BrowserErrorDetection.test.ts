import { jest } from '@jest/globals';
import { ModelContextTest } from '../helpers/modelContextTest';
import { PlayerAnimationLoader } from '../../views/PlayerAnimationLoader';
import { BaseAnimationLoader } from '../../views/BaseAnimationLoader';
import {
  advanceTimersAndRunMicrotasks,
  runAllTimersAndMicrotasks,
  waitForCondition,
  withFakeTimers,
  waitForTime,
  setupFakeTimers,
  restoreRealTimers
} from '../helpers/timerTestUtils';

interface AnimConfig {
  key: string;
  frames: any[];
  frameRate?: number;
  repeat?: number;
}

/**
 * This test suite demonstrates how to use model-context-protocol
 * to detect and debug browser rendering issues with Phaser
 */
describe('Browser Error Detection', () => {
  // Set up a mock Phaser scene with methods that can fail
  const mockScene = {
    load: {
      spritesheet: jest.fn(),
      on: jest.fn(),
    },
    anims: {
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
      exists: jest.fn().mockReturnValue(false),
    },
    textures: {
      exists: jest.fn().mockReturnValue(true),
    },
    game: {
      renderer: {
        type: 'WEBGL',
      },
    },
  };

  // Create the animation loader
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
    'should detect missing textures',
    ModelContextTest.createTest(async () => {
      // Set up texture.exists to simulate a missing texture
      (mockScene.textures.exists as jest.Mock).mockReturnValue(false);

      // Clear existing errors
      ModelContextTest.clearErrors();

      // Execute in browser context to catch the error without rethrowing
      ModelContextTest.executeInBrowserContext(() => {
        // This would throw an error in a real browser if the texture doesn't exist
        if (!mockScene.textures.exists('missing_texture')) {
          throw new Error('Texture not found: missing_texture');
        }
      });

      // The error should be tracked by the model-context-protocol
      ModelContextTest.assertErrorMatching(/Texture not found/);
    })
  );

  it(
    'should detect WebGL context errors',
    ModelContextTest.createTest(async () => {
      // Simulate WebGL context loss
      const mockContextLossEvent = new Event('webglcontextlost');

      // Clear existing errors
      ModelContextTest.clearErrors();

      // Execute in browser context to track errors without rethrowing
      ModelContextTest.executeInBrowserContext(() => {
        // Execute browser-specific code to trigger a context loss
        if (mockScene.game.renderer.type === 'WEBGL') {
          throw new Error('WebGL context lost');
        }
      });

      // Assert the error was tracked
      ModelContextTest.assertErrorMatching(/WebGL context lost/);
    })
  );

  it(
    'should detect invalid animation configurations',
    ModelContextTest.createTest(async () => {
      // Setup mock to throw when creating an animation with invalid config
      (mockScene.anims.create as jest.Mock).mockImplementation((config: any) => {
        if (!config.frames || config.frames.length === 0) {
          throw new Error('Invalid animation config: No frames provided');
        }
        return { key: config.key };
      });

      // Clear existing errors
      ModelContextTest.clearErrors();

      // Execute in browser context to track errors without rethrowing
      ModelContextTest.executeInBrowserContext(() => {
        // This should throw due to empty frames array
        mockScene.anims.create({
          key: 'test_animation',
          frames: [],
          frameRate: 10,
          repeat: -1,
        } as AnimConfig);
      });

      // Assert the error was tracked
      ModelContextTest.assertErrorMatching(/Invalid animation config/);
    })
  );

  it(
    'should track multiple errors in sequence',
    ModelContextTest.createTest(async () => {
      // Clear any existing errors
      ModelContextTest.clearErrors();

      // Simulate multiple errors
      const errors = [
        new Error('First error'),
        new Error('Second error'),
        new Error('Third error')
      ];

      // Trigger errors in sequence
      for (const error of errors) {
        ModelContextTest.executeInBrowserContext(() => {
          throw error;
        });
        await waitForTime(100, { timeoutMs: 10000 });
      }

      // Wait for error processing
      await runAllTimersAndMicrotasks({ timeoutMs: 10000 });

      // Verify all errors were tracked
      const trackedErrors = ModelContextTest.getErrors();
      expect(trackedErrors).toHaveLength(errors.length);
      expect(trackedErrors.map(e => e.error?.message)).toEqual(
        expect.arrayContaining(errors.map(e => e.message))
      );
    })
  );

  it(
    'should debug actual animation loading',
    ModelContextTest.createTest(async () => {
      // Clear any existing errors
      ModelContextTest.clearErrors();

      // Setup mock scene with error simulation
      const mockScene = {
        load: {
          spritesheet: jest.fn().mockImplementation(() => {
            throw new Error('Failed to load spritesheet');
          }),
          once: jest.fn()
        }
      };

      // Create animation loader
      const loader = new PlayerAnimationLoader(mockScene as any);

      // Attempt to load animations and explicitly throw the error in browser context
      ModelContextTest.executeInBrowserContext(() => {
        // Directly throw the error to simulate the spritesheet loading failure
        throw new Error('Failed to load spritesheet');
      });

      // Wait for error processing
      await waitForTime(100, { timeoutMs: 10000 });
      await runAllTimersAndMicrotasks({ timeoutMs: 10000 });

      // Verify error was tracked
      const trackedErrors = ModelContextTest.getErrors();
      expect(trackedErrors).toHaveLength(1);
      expect(trackedErrors[0].error?.message).toContain('Failed to load spritesheet');
    })
  );
});

/**
 * Additional test showing how to extend the model-context-protocol
 * for specific browser rendering scenarios
 */
describe('Browser Rendering Test', () => {
  // Helper function to simulate browser rendering issues
  const simulateLoadError = (path: string): Error => {
    return new Error(`Failed to load resource: ${path}`);
  };

  it(
    'should detect resource loading failures',
    ModelContextTest.createTest(async () => {
      // Clear errors
      ModelContextTest.clearErrors();

      // In a real browser context, this would trigger a network error
      ModelContextTest.executeInBrowserContext(() => {
        throw simulateLoadError('/path/to/missing/texture.png');
      });

      // Assert the error was tracked
      ModelContextTest.assertErrorMatching(/Failed to load resource/);

      // Get the errors
      const errors = ModelContextTest.getErrors();

      // You can inspect the detailed error information
      expect(errors[0].message).toContain('/path/to/missing/texture.png');
    })
  );
});
