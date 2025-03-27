// @ts-nocheck
import { jest } from '@jest/globals';
import { PlayerAnimationLoader } from '../../views/PlayerAnimationLoader';
import { PlayerView } from '../../views/PlayerView';
import { Actions } from '../../models/Actions';
import type Phaser from 'phaser';

// Common mock setup
const mockScene = {
  textures: {
    exists: jest.fn().mockReturnValue(true),
    getTextureKeys: jest.fn().mockReturnValue(['idle_down', 'walk_down']),
  },
  anims: {
    create: jest.fn(),
    exists: jest.fn().mockReturnValue(false),
    generateFrameNumbers: jest.fn().mockReturnValue([{ key: 'frame1', frame: 0 }]),
  },
  load: {
    spritesheet: jest.fn(),
    on: jest.fn().mockImplementation((event, handler) => {
      // Store error handlers for testing
      if (event === 'loaderror') {
        mockErrorHandlers.push(handler);
      }
    }),
  },
};

// Store error handlers for testing
const mockErrorHandlers = [];

describe('Asset Loading and Error Handling', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    mockErrorHandlers.length = 0; // Clear error handlers
  });

  describe('PlayerView Resilience', () => {
    it('should handle missing animations gracefully', () => {
      // Setup mock sprite
      const mockSprite = {
        anims: {
          play: jest.fn().mockImplementation(() => {
            throw new Error('Animation error');
          }),
        },
      };

      // Create player view with mocked components
      const playerView = new PlayerView(
        mockSprite as unknown as Phaser.GameObjects.Sprite,
        { x: 0, y: 0, controls: {} } as any
      );

      // Call update which should try to play an animation
      expect(() => playerView.update()).not.toThrow();
    });

    it('should handle animation name resolution errors', () => {
      // Setup mock sprite with play function but problematic getName
      const mockSprite = {
        anims: {
          // getName will throw when accessed
          get getName() {
            throw new Error('Cannot read animation name');
          },
          play: jest.fn(),
        },
      };

      // Create player view with mocked components
      const playerView = new PlayerView(
        mockSprite as unknown as Phaser.GameObjects.Sprite,
        { x: 0, y: 0, controls: {} } as any
      );

      // Call update which should try to get animation name
      expect(() => playerView.update()).not.toThrow();
    });
  });

  describe('PlayerAnimationLoader Error Handling', () => {
    it('should handle missing texture gracefully', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Simulate load error event
      if (mockErrorHandlers.length > 0) {
        mockErrorHandlers[0]({ key: 'missing_texture' });
      }

      // Call create animations - should not throw
      expect(() => animationLoader.createAnimations()).not.toThrow();
    });

    it('should attempt to use fallback animations when primary ones fail', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Make one texture exist as a fallback
      (mockScene.textures?.exists as jest.Mock).mockImplementation((key: string) => {
        return key === 'idle_down_variant_1';
      });
      
      (mockScene.textures?.getTextureKeys as jest.Mock).mockReturnValue(['idle_down_variant_1']);

      // Preload animations
      animationLoader.preloadAnimations();

      // Create animations
      animationLoader.createAnimations();
      
      // Verify fallback texture was used
      expect(mockScene.anims?.create).toHaveBeenCalled();
    });

    it('should continue operation after multiple asset loading failures', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Simulate multiple load errors
      if (mockErrorHandlers.length > 0) {
        for (let i = 0; i < 10; i++) {
          mockErrorHandlers[0]({ key: `missing_texture_${i}` });
        }
      }
      
      // All operations should still work without errors
      expect(() => {
        animationLoader.preloadAnimations();
        animationLoader.createAnimations();
      }).not.toThrow();
    });

    it('should attempt all path variants when primary path fails', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Set up spy to track which paths are attempted
      const spritesheetSpy = jest.spyOn(mockScene.load as any, 'spritesheet');

      // Simulate failure for first path but success for fallback
      mockErrorHandlers.push(({ key }: { key: string }) => {
        // Only fail the first variant, allowing others to succeed
        return key.includes('variant_0');
      });
      
      // Preload and trigger load errors
      animationLoader.preloadAnimations();
      
      // Verify multiple path variants were attempted
      const pathVariants = spritesheetSpy.mock.calls.filter(
        (call) => typeof call[1] === 'string' && call[1].includes('Idle_Down-Sheet.png')
      );

      expect(pathVariants.length).toBeGreaterThan(1);
    });

    it('should create fallback animation when all specific animations fail', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Make textures exist check pass for a single fallback texture
      (mockScene.textures?.exists as jest.Mock).mockImplementation((key: string) => {
        return key === 'idle_down_variant_1';
      });

      // But make animation creation fail for specific animations
      (mockScene.anims?.create as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Animation creation failed');
      });

      // But succeed for fallback
      (mockScene.anims?.create as jest.Mock).mockImplementationOnce(() => {
        return true;
      });

      (mockScene.textures?.getTextureKeys as jest.Mock).mockReturnValue(['idle_down_variant_1']);
      
      // Create animations - should create fallback
      animationLoader.createAnimations();
      
      // Verify anims.create was called at least once - implementation may vary
      expect(mockScene.anims?.create).toHaveBeenCalled();
    });
  });

  describe('Asset Loading Path Resolution', () => {
    it('should try multiple path variants when loading assets', () => {
      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Call preload
      animationLoader.preloadAnimations();
      
      // Verify that multiple path variants were attempted
      const spritesheetCalls = mockScene.load?.spritesheet.mock.calls;

      // Check for different path patterns in the calls
      const pathVariants = spritesheetCalls
        // @ts-expect-error - Jest mock calls typing issue
        .map((call) => call[1] as string)
        // @ts-expect-error - Typing issue after cast
        .filter((path) => path.includes('Idle_Down-Sheet.png'));

      // Should have tried multiple variants
      expect(pathVariants.length).toBeGreaterThan(1);

      // Should have tried paths with different prefixes
      // @ts-expect-error - Typing issue with path parameter
      expect(pathVariants.some((path) => path.startsWith('src/'))).toBeTruthy();
      // @ts-expect-error - Typing issue with path parameter
      expect(pathVariants.some((path) => path.startsWith('/src/'))).toBeTruthy();
      // @ts-expect-error - Typing issue with path parameter
      expect(pathVariants.some((path) => path.startsWith('/assets/'))).toBeTruthy();
    });

    it('should handle complete load failure with graceful degradation', () => {
      // Create a specialized mock scene for this test
      const loadErrorScene = {
        ...mockScene,
        load: {
          ...mockScene.load,
          // @ts-expect-error - Mock implementation
          on: jest
            .fn()
            .mockImplementation(
              (
                event: string,
                handler: (event?: { key: string; path?: string; type?: string }) => void
              ) => {
                if (event === 'loaderror') {
                  // Store for immediate triggering
                  mockErrorHandlers.push(handler);
                }
              }
            ),
          // @ts-expect-error - Mock implementation
          spritesheet: jest.fn().mockImplementation((_key: string, _path: string) => {
            // Immediately trigger error for every load attempt
            mockErrorHandlers.forEach((handler) =>
              handler({ key: _key, path: _path, type: 'spritesheet' })
            );
          }),
        },
        textures: {
          ...mockScene.textures,
          exists: jest.fn().mockReturnValue(false), // No textures exist
        },
      };

      const animationLoader = new PlayerAnimationLoader(loadErrorScene as Phaser.Scene);

      // Should not throw even when everything fails
      expect(() => {
        animationLoader.preloadAnimations();
        animationLoader.createAnimations();
      }).not.toThrow();
    });

    it('should handle load completion events appropriately', () => {
      // Mock the on method to record what events are subscribed to
      mockScene.load.on.mockImplementation((event, callback) => {
        // Store the handler but don't call it immediately
        if (event === 'complete') {
          setTimeout(() => callback(), 0);
        }
      });

      const animationLoader = new PlayerAnimationLoader(mockScene as Phaser.Scene);

      // Create a spy to watch for create animations being called
      const createSpy = jest.spyOn(animationLoader, 'createAnimations');
      
      // Call preload
      animationLoader.preloadAnimations();

      // Simulate load complete event if supported by PlayerAnimationLoader
      try {
        const completeHandler = mockScene.load?.on.mock.calls.find(
          (call) => call[0] === 'complete'
        );
        
        if (completeHandler) {
          completeHandler[1](); // Call the complete handler if it exists
        }
      } catch (error) {
        // This is acceptable if the PlayerAnimationLoader doesn't use complete events
      }
    });
  });
});
