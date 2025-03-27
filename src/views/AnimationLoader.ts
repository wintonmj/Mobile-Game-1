import type Phaser from 'phaser';
import { Actions, ActionAnimations } from '../models/Actions';

export class AnimationLoader {
  private scene: Phaser.Scene;
  // Define constants for frame dimensions
  private static readonly FRAME_WIDTH = 64;
  private static readonly FRAME_HEIGHT = 64;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public preloadAnimations(): void {
    try {
      // Characters base path for Vite environment
      const basePath = 'src/assets/sprites/Entities/Characters/Body_A/Animations/';

      // Set up error handler
      this.scene.load.on('loaderror', (_file: Phaser.Loader.File) => {
        // Error handling remains silent
      });

      // Load at least the idle animation manually to ensure we have a fallback
      this.scene.load.spritesheet('idle_down', `${basePath}Idle_Base/Idle_Down-Sheet.png`, {
        frameWidth: AnimationLoader.FRAME_WIDTH,
        frameHeight: AnimationLoader.FRAME_HEIGHT,
      });

      // Explicitly load walk animations as they are critical
      ['Up', 'Down', 'Side'].forEach((direction) => {
        const key = `walk_${direction.toLowerCase()}`;
        const path = `${basePath}Walk_Base/Walk_${direction}-Sheet.png`;

        this.scene.load.spritesheet(key, path, {
          frameWidth: AnimationLoader.FRAME_WIDTH,
          frameHeight: AnimationLoader.FRAME_HEIGHT,
        });
      });

      // Try all possible path variants for the idle animation to ensure at least one works
      [
        `${basePath}Idle_Base/Idle_Down-Sheet.png`,
        `/src/assets/sprites/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Down-Sheet.png`,
        `/assets/sprites/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Down-Sheet.png`,
      ].forEach((path, index) => {
        this.scene.load.spritesheet(`idle_down_variant_${index}`, path, {
          frameWidth: AnimationLoader.FRAME_WIDTH,
          frameHeight: AnimationLoader.FRAME_HEIGHT,
        });
      });

      // Load idle animation for each direction as a priority
      this.loadSpecificAnimation('idle', 'Idle_Base');

      // Load all animation sheets based on the ActionAnimations config, but skip if it's already loaded
      const loadedKeys = new Set<string>();

      Object.values(ActionAnimations).forEach((config) => {
        const { spriteBase, animBase } = config;
        // Skip if already attempted to load this animation to prevent duplicates
        const key = `${animBase}_base`;
        if (!loadedKeys.has(key)) {
          loadedKeys.add(key);
          this.loadSpecificAnimation(animBase, spriteBase);
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }

  private loadSpecificAnimation(animBase: string, spriteBase: string): void {
    try {
      const basePath = 'src/assets/sprites/Entities/Characters/Body_A/Animations/';

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
              frameWidth: AnimationLoader.FRAME_WIDTH,
              frameHeight: AnimationLoader.FRAME_HEIGHT,
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

  public createAnimations(): void {
    try {
      // Explicitly create walk animations first as they're critical
      this.createWalkAnimations();

      // Create animations for each action and direction
      Object.entries(ActionAnimations).forEach(([action, config]) => {
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

      // Create a fallback animation just in case
      if (!this.scene.anims.exists('idle_fallback')) {
        try {
          // Use any successfully loaded texture for fallback
          const availableTextures = this.scene.textures.getTextureKeys();
          const usableTexture = availableTextures.find(
            (key) => key.includes('idle') && key !== '__DEFAULT' && key !== '__MISSING'
          );

          if (usableTexture) {
            this.scene.anims.create({
              key: 'idle_fallback',
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
    } catch (error) {
      // Silent error handling
    }
  }

  private createWalkAnimations(): void {
    // Get the walking animation config
    const walkConfig = ActionAnimations[Actions.WALKING];

    if (!walkConfig) {
      return;
    }

    const { frameCount, frameRate, repeat, yoyo } = walkConfig;

    // Create animations for each direction
    ['down', 'up', 'side'].forEach((direction) => {
      const spriteKey = `walk_${direction}`;
      const animKey = `walking_${direction}`;

      // Check if the texture exists before creating the animation
      if (this.scene.textures.exists(spriteKey)) {
        try {
          this.scene.anims.create({
            key: animKey,
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
    });

    // Create left/right animations from side
    const spriteKey = `walk_side`;

    if (this.scene.textures.exists(spriteKey)) {
      ['right', 'left'].forEach((direction) => {
        const animKey = `walking_${direction}`;

        try {
          this.scene.anims.create({
            key: animKey,
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
      });
    }
  }
}
