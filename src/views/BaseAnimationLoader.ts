import type Phaser from 'phaser';

export interface AnimationConfig {
  spriteBase: string;
  animBase: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
  yoyo: boolean;
}

export class BaseAnimationLoader {
  protected scene: Phaser.Scene;
  // Define constants for frame dimensions
  protected static readonly FRAME_WIDTH = 64;
  protected static readonly FRAME_HEIGHT = 64;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preloads animations from the specified base path with custom configs
   */
  protected preloadAnimationsFromConfig(
    basePath: string,
    animationConfigs: Record<string, AnimationConfig>
  ): void {
    try {
      // Set up error handler
      this.scene.load.on('loaderror', (_file: Phaser.Loader.File) => {
        // Error handling remains silent
      });

      // Load all animation sheets based on the provided animation configs
      const loadedKeys = new Set<string>();

      Object.values(animationConfigs).forEach((config) => {
        const { spriteBase, animBase } = config;
        // Skip if already attempted to load this animation to prevent duplicates
        const key = `${animBase}_base`;
        if (!loadedKeys.has(key)) {
          loadedKeys.add(key);
          this.loadSpecificAnimation(animBase, spriteBase, basePath);
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Loads a specific animation for different directions
   */
  protected loadSpecificAnimation(animBase: string, spriteBase: string, basePath: string): void {
    try {
      // Load direction-specific animation sheets
      ['Down', 'Side', 'Up'].forEach((direction) => {
        const key = `${animBase}_${direction.toLowerCase()}`;

        // Extract the base name without the "_Base" suffix for the filename
        const baseNameForFile = spriteBase.endsWith('_Base')
          ? spriteBase.split('_')[0]
          : spriteBase;

        const path = `${basePath}${spriteBase}/${baseNameForFile}_${direction}-Sheet.png`;

        // Check if a key is already loaded to prevent duplicates
        if (!this.scene.textures.exists(key)) {
          try {
            this.scene.load.spritesheet(key, path, {
              frameWidth: BaseAnimationLoader.FRAME_WIDTH,
              frameHeight: BaseAnimationLoader.FRAME_HEIGHT,
            });
          } catch (loadError) {
            // Silent error handling
          }
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Creates animations from the provided configs
   */
  protected createAnimationsFromConfig(animationConfigs: Record<string, AnimationConfig>): void {
    try {
      // Create animations for each action and direction
      Object.entries(animationConfigs).forEach(([action, config]) => {
        const { animBase, frameCount, frameRate, repeat, yoyo } = config;

        // Create animations for each direction
        ['down', 'side', 'up'].forEach((direction) => {
          const key = `${action}_${direction}`;
          // Use the animBase directly for the sprite key - this should match how we loaded it
          const spriteKey = `${animBase}_${direction}`;

          // Check if the texture exists before creating the animation
          if (this.scene.textures.exists(spriteKey)) {
            // Check if animation already exists to prevent duplicates
            if (!this.scene.anims.exists(key)) {
              try {
                this.scene.anims.create({
                  key: key,
                  frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                    start: 0,
                    end: frameCount - 1,
                  }),
                  frameRate: frameRate,
                  repeat: repeat,
                  yoyo: yoyo,
                });
              } catch (error) {
                // Silent error handling
              }
            }
          } else {
            // Try a fallback texture if available
            const fallbackKey = spriteKey.replace(/-/g, '_');
            if (fallbackKey !== spriteKey && this.scene.textures.exists(fallbackKey)) {
              try {
                this.scene.anims.create({
                  key: key,
                  frames: this.scene.anims.generateFrameNumbers(fallbackKey, {
                    start: 0,
                    end: frameCount - 1,
                  }),
                  frameRate: frameRate,
                  repeat: repeat,
                  yoyo: yoyo,
                });
              } catch (error) {
                // Silent error handling
              }
            }
          }
        });

        // For side animations, create flipped versions for left/right
        const spriteKey = `${animBase}_side`;

        // Only create left/right animations if the side texture exists
        if (this.scene.textures.exists(spriteKey)) {
          // Map the action to both right and left directions
          const rightKey = `${action}_right`;
          const leftKey = `${action}_left`;

          // Check if animations already exist to prevent duplicates
          if (!this.scene.anims.exists(rightKey)) {
            try {
              this.scene.anims.create({
                key: rightKey,
                frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                  start: 0,
                  end: frameCount - 1,
                }),
                frameRate: frameRate,
                repeat: repeat,
                yoyo: yoyo,
              });
            } catch (error) {
              // Silent error handling
            }
          }

          if (!this.scene.anims.exists(leftKey)) {
            try {
              this.scene.anims.create({
                key: leftKey,
                frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                  start: 0,
                  end: frameCount - 1,
                }),
                frameRate: frameRate,
                repeat: repeat,
                yoyo: yoyo,
              });
            } catch (error) {
              // Silent error handling
            }
          }
        } else {
          // Try a fallback texture if available
          const fallbackKey = spriteKey.replace(/-/g, '_');
          if (fallbackKey !== spriteKey && this.scene.textures.exists(fallbackKey)) {
            try {
              this.scene.anims.create({
                key: `${action}_right`,
                frames: this.scene.anims.generateFrameNumbers(fallbackKey, {
                  start: 0,
                  end: frameCount - 1,
                }),
                frameRate: frameRate,
                repeat: repeat,
                yoyo: yoyo,
              });

              this.scene.anims.create({
                key: `${action}_left`,
                frames: this.scene.anims.generateFrameNumbers(fallbackKey, {
                  start: 0,
                  end: frameCount - 1,
                }),
                frameRate: frameRate,
                repeat: repeat,
                yoyo: yoyo,
              });
            } catch (error) {
              // Silent error handling
            }
          }
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Creates a fallback animation for cases where the main animation fails to load
   */
  protected createFallbackAnimation(fallbackKey: string): void {
    if (!this.scene.anims.exists(fallbackKey)) {
      try {
        // Use any successfully loaded texture for fallback
        const availableTextures = this.scene.textures.getTextureKeys();
        const usableTexture = availableTextures.find(
          (key) =>
            key.includes(fallbackKey.split('_')[0]) && key !== '__DEFAULT' && key !== '__MISSING'
        );

        if (usableTexture) {
          this.scene.anims.create({
            key: fallbackKey,
            frames: this.scene.anims.generateFrameNumbers(usableTexture, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1,
            yoyo: true,
          });
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }
}
