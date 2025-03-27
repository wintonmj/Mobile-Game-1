import type Phaser from 'phaser';
import { Actions, ActionAnimations } from '../models/Actions';
import { BaseAnimationLoader } from './BaseAnimationLoader';

export class PlayerAnimationLoader extends BaseAnimationLoader {
  // Player-specific base path
  private static readonly PLAYER_BASE_PATH =
    'src/assets/sprites/Entities/Characters/Body_A/Animations/';

  constructor(scene: Phaser.Scene) {
    super(scene);
  }

  public preloadAnimations(): void {
    try {
      // Load at least the idle animation manually to ensure we have a fallback
      this.scene.load.spritesheet(
        'idle_down',
        `${PlayerAnimationLoader.PLAYER_BASE_PATH}Idle_Base/Idle_Down-Sheet.png`,
        {
          frameWidth: BaseAnimationLoader.FRAME_WIDTH,
          frameHeight: BaseAnimationLoader.FRAME_HEIGHT,
        }
      );

      // Explicitly load walk animations as they are critical
      ['Up', 'Down', 'Side'].forEach((direction) => {
        const key = `walk_${direction.toLowerCase()}`;
        const path = `${PlayerAnimationLoader.PLAYER_BASE_PATH}Walk_Base/Walk_${direction}-Sheet.png`;

        this.scene.load.spritesheet(key, path, {
          frameWidth: BaseAnimationLoader.FRAME_WIDTH,
          frameHeight: BaseAnimationLoader.FRAME_HEIGHT,
        });
      });

      // Try all possible path variants for the idle animation to ensure at least one works
      [
        `${PlayerAnimationLoader.PLAYER_BASE_PATH}Idle_Base/Idle_Down-Sheet.png`,
        `/src/assets/sprites/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Down-Sheet.png`,
        `/assets/sprites/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Down-Sheet.png`,
      ].forEach((path, index) => {
        this.scene.load.spritesheet(`idle_down_variant_${index}`, path, {
          frameWidth: BaseAnimationLoader.FRAME_WIDTH,
          frameHeight: BaseAnimationLoader.FRAME_HEIGHT,
        });
      });

      // Load idle animation for each direction as a priority
      this.loadSpecificAnimation('idle', 'Idle_Base', PlayerAnimationLoader.PLAYER_BASE_PATH);

      // Use the base class method to load animations from the ActionAnimations config
      this.preloadAnimationsFromConfig(PlayerAnimationLoader.PLAYER_BASE_PATH, ActionAnimations);
    } catch (error) {
      // Silent error handling
    }
  }

  public createAnimations(): void {
    try {
      // Explicitly create walk animations first as they're critical
      this.createWalkAnimations();

      // Use the base class method to create animations from the ActionAnimations config
      this.createAnimationsFromConfig(ActionAnimations);

      // Create a fallback animation just in case
      this.createFallbackAnimation('idle_fallback');
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
