import { jest } from '@jest/globals';
import { ModelContextTest } from '../helpers/modelContextTest';
import { PlayerAnimationLoader } from '../../views/PlayerAnimationLoader';
import { BaseAnimationLoader } from '../../views/BaseAnimationLoader';

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

      // Execute multiple browser operations that might fail
      ModelContextTest.executeInBrowserContext(() => {
        throw new Error('First browser error');
      });

      // Wait for any async operations to complete
      await ModelContextTest.waitForRender();

      ModelContextTest.executeInBrowserContext(() => {
        throw new Error('Second browser error');
      });

      // Assert we captured both errors
      const errors = ModelContextTest.getErrors();
      expect(errors.length).toBe(2);
      expect(errors[0].message).toContain('First browser error');
      expect(errors[1].message).toContain('Second browser error');
    })
  );

  it(
    'should debug actual animation loading',
    ModelContextTest.createTest(async () => {
      // This is an example of testing real animation loading with error detection

      // Setup the mock textures to return true for specific keys
      (mockScene.textures.exists as jest.Mock).mockImplementation((key: any) => {
        // Return true only for specific textures
        return key === 'idle_down' || key === 'walk_down';
      });

      // Generate proper frames for specific animations
      (mockScene.anims.generateFrameNumbers as jest.Mock).mockImplementation((key: any) => {
        if (key === 'idle_down') {
          return [0, 1, 2, 3];
        }
        return [];
      });

      // Mock anims.create to validate parameters
      (mockScene.anims.create as jest.Mock).mockImplementation((config: any) => {
        // For testing, throw an error if specific animations have issues
        if (config.key === 'idle_up' && (!config.frames || config.frames.length === 0)) {
          throw new Error(`Animation creation failed for ${config.key}: No frames`);
        }
        return { key: config.key };
      });

      // Execute animation creation in the browser context
      ModelContextTest.executeInBrowserContext(() => {
        animationLoader.createAnimations();
      });

      // Wait for rendering to complete
      await ModelContextTest.waitForRender();

      // Get any errors that occurred
      const errors = ModelContextTest.getErrors();

      // In a real browser, we'd get errors for missing textures or failed animations
      // Here we're just demonstrating how to detect and validate them
      if (errors.length > 0) {
        console.log('Animation errors detected:', errors);
      }

      // Ensure we can assert positively or negatively on errors
      // This test doesn't expect errors since we mocked successfully
      expect(errors.length).toBe(0);
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
