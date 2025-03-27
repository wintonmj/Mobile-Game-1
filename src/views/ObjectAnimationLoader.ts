import type Phaser from 'phaser';
import { BaseAnimationLoader } from './BaseAnimationLoader';

// Define animation states for interactive objects
export enum ObjectState {
  IDLE = 'idle',
  ACTIVE = 'active',
  OPEN = 'open',
  CLOSED = 'closed',
  DAMAGED = 'damaged',
  DESTROYED = 'destroyed',
}

// Define object animation configurations
export interface ObjectAnimationConfig {
  spriteBase: string;
  animBase: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
  yoyo: boolean;
  frameWidth?: number;
  frameHeight?: number;
}

// Object type definitions
export enum ObjectType {
  CHEST = 'chest',
  DOOR = 'door',
  LEVER = 'lever',
  TRAP = 'trap',
  CRYSTAL = 'crystal',
}

// Default animation configurations for each object type
const objectAnimations: Record<ObjectType, Record<ObjectState, ObjectAnimationConfig>> = {
  [ObjectType.CHEST]: {
    [ObjectState.IDLE]: {
      spriteBase: 'Chest_Idle',
      animBase: 'chest_idle',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.OPEN]: {
      spriteBase: 'Chest_Open',
      animBase: 'chest_open',
      frameCount: 5,
      frameRate: 8,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.CLOSED]: {
      spriteBase: 'Chest_Close',
      animBase: 'chest_close',
      frameCount: 5,
      frameRate: 8,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.ACTIVE]: {
      spriteBase: 'Chest_Active',
      animBase: 'chest_active',
      frameCount: 4,
      frameRate: 6,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.DAMAGED]: {
      spriteBase: 'Chest_Damaged',
      animBase: 'chest_damaged',
      frameCount: 3,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DESTROYED]: {
      spriteBase: 'Chest_Destroyed',
      animBase: 'chest_destroyed',
      frameCount: 6,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
  },
  [ObjectType.DOOR]: {
    [ObjectState.IDLE]: {
      spriteBase: 'Door_Idle',
      animBase: 'door_idle',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.OPEN]: {
      spriteBase: 'Door_Open',
      animBase: 'door_open',
      frameCount: 8,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.CLOSED]: {
      spriteBase: 'Door_Close',
      animBase: 'door_close',
      frameCount: 8,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.ACTIVE]: {
      spriteBase: 'Door_Active',
      animBase: 'door_active',
      frameCount: 4,
      frameRate: 8,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.DAMAGED]: {
      spriteBase: 'Door_Damaged',
      animBase: 'door_damaged',
      frameCount: 4,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DESTROYED]: {
      spriteBase: 'Door_Destroyed',
      animBase: 'door_destroyed',
      frameCount: 8,
      frameRate: 12,
      repeat: 0,
      yoyo: false,
    },
  },
  [ObjectType.LEVER]: {
    [ObjectState.IDLE]: {
      spriteBase: 'Lever_Idle',
      animBase: 'lever_idle',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.ACTIVE]: {
      spriteBase: 'Lever_Pull',
      animBase: 'lever_active',
      frameCount: 8,
      frameRate: 12,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.OPEN]: {
      spriteBase: 'Lever_On',
      animBase: 'lever_on',
      frameCount: 4,
      frameRate: 8,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.CLOSED]: {
      spriteBase: 'Lever_Off',
      animBase: 'lever_off',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DAMAGED]: {
      spriteBase: 'Lever_Damaged',
      animBase: 'lever_damaged',
      frameCount: 3,
      frameRate: 8,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DESTROYED]: {
      spriteBase: 'Lever_Destroyed',
      animBase: 'lever_destroyed',
      frameCount: 5,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
  },
  [ObjectType.TRAP]: {
    [ObjectState.IDLE]: {
      spriteBase: 'Trap_Idle',
      animBase: 'trap_idle',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.ACTIVE]: {
      spriteBase: 'Trap_Trigger',
      animBase: 'trap_active',
      frameCount: 10,
      frameRate: 15,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.OPEN]: {
      spriteBase: 'Trap_Armed',
      animBase: 'trap_armed',
      frameCount: 4,
      frameRate: 8,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.CLOSED]: {
      spriteBase: 'Trap_Disarmed',
      animBase: 'trap_disarmed',
      frameCount: 1,
      frameRate: 5,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DAMAGED]: {
      spriteBase: 'Trap_Damaged',
      animBase: 'trap_damaged',
      frameCount: 3,
      frameRate: 8,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DESTROYED]: {
      spriteBase: 'Trap_Destroyed',
      animBase: 'trap_destroyed',
      frameCount: 5,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
  },
  [ObjectType.CRYSTAL]: {
    [ObjectState.IDLE]: {
      spriteBase: 'Crystal_Idle',
      animBase: 'crystal_idle',
      frameCount: 8,
      frameRate: 10,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.ACTIVE]: {
      spriteBase: 'Crystal_Activate',
      animBase: 'crystal_activate',
      frameCount: 12,
      frameRate: 15,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.OPEN]: {
      spriteBase: 'Crystal_Active',
      animBase: 'crystal_on',
      frameCount: 8,
      frameRate: 12,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.CLOSED]: {
      spriteBase: 'Crystal_Inactive',
      animBase: 'crystal_off',
      frameCount: 4,
      frameRate: 8,
      repeat: -1,
      yoyo: true,
    },
    [ObjectState.DAMAGED]: {
      spriteBase: 'Crystal_Damaged',
      animBase: 'crystal_damaged',
      frameCount: 6,
      frameRate: 10,
      repeat: 0,
      yoyo: false,
    },
    [ObjectState.DESTROYED]: {
      spriteBase: 'Crystal_Shatter',
      animBase: 'crystal_destroyed',
      frameCount: 12,
      frameRate: 15,
      repeat: 0,
      yoyo: false,
    },
  },
};

export class ObjectAnimationLoader extends BaseAnimationLoader {
  // Object-specific base path
  private static readonly OBJECT_BASE_PATH = 'src/assets/sprites/Objects/';
  private objectType: ObjectType;
  private animationConfigs: Record<ObjectState, ObjectAnimationConfig>;

  constructor(scene: Phaser.Scene, objectType: ObjectType) {
    super(scene);
    this.objectType = objectType;
    this.animationConfigs = objectAnimations[objectType];
  }

  public preloadAnimations(): void {
    try {
      const basePath = `${ObjectAnimationLoader.OBJECT_BASE_PATH}${this.objectType}/`;

      // Load the idle animation for this object as a priority
      const idleConfig = this.animationConfigs[ObjectState.IDLE];
      this.scene.load.spritesheet(
        `${idleConfig.animBase}_down`,
        `${basePath}${idleConfig.spriteBase}/Idle-Sheet.png`,
        {
          frameWidth: idleConfig.frameWidth || BaseAnimationLoader.FRAME_WIDTH,
          frameHeight: idleConfig.frameHeight || BaseAnimationLoader.FRAME_HEIGHT,
        }
      );

      // Preload all animation states for this object
      Object.entries(this.animationConfigs).forEach(([state, config]) => {
        const { spriteBase, animBase } = config;
        const frameWidth = config.frameWidth || BaseAnimationLoader.FRAME_WIDTH;
        const frameHeight = config.frameHeight || BaseAnimationLoader.FRAME_HEIGHT;

        // Objects typically don't have directional animations, just a single sheet
        const path = `${basePath}${spriteBase}/${state}-Sheet.png`;

        if (!this.scene.textures.exists(animBase)) {
          try {
            this.scene.load.spritesheet(animBase, path, {
              frameWidth,
              frameHeight,
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
      // Create animations for each state
      Object.entries(this.animationConfigs).forEach(([state, config]) => {
        const { animBase, frameCount, frameRate, repeat, yoyo } = config;
        const key = `${this.objectType}_${state}`;

        if (this.scene.textures.exists(animBase)) {
          try {
            this.scene.anims.create({
              key,
              frames: this.scene.anims.generateFrameNumbers(animBase, {
                start: 0,
                end: frameCount - 1,
              }),
              frameRate,
              repeat,
              yoyo,
            });
          } catch (error) {
            // Silent error handling
          }
        }
      });

      // Create a fallback animation
      this.createFallbackAnimation(`${this.objectType}_fallback`);
    } catch (error) {
      // Silent error handling
    }
  }
}
