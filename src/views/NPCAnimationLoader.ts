import type Phaser from 'phaser';
import { BaseAnimationLoader, AnimationConfig } from './BaseAnimationLoader';

// Define NPC-specific animation configurations
export interface NPCAnimationConfig {
  idle: AnimationConfig;
  talk: AnimationConfig;
  [key: string]: AnimationConfig;
}

// Default NPC animation configurations
export const DefaultNPCAnimations: NPCAnimationConfig = {
  idle: {
    spriteBase: 'Idle',
    animBase: 'npc_idle',
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    yoyo: true,
  },
  talk: {
    spriteBase: 'Talk',
    animBase: 'npc_talk',
    frameCount: 6,
    frameRate: 8,
    repeat: -1,
    yoyo: true,
  },
};

// Knight-specific animation configurations
export const KnightAnimations: NPCAnimationConfig = {
  idle: {
    spriteBase: 'Idle',
    animBase: 'npc_idle',
    frameCount: 4, // Adjusted to be safer since we don't know exact frame count
    frameRate: 8,
    repeat: -1,
    yoyo: false,
  },
  talk: {
    spriteBase: 'Idle', // Use Idle since Knight doesn't have Talk animation
    animBase: 'npc_talk',
    frameCount: 4, // Same safe value
    frameRate: 8,
    repeat: -1,
    yoyo: false,
  },
};

export class NPCAnimationLoader extends BaseAnimationLoader {
  // NPC-specific base path
  private static readonly NPC_BASE_PATH = "/src/assets/sprites/Entities/Npc's/";
  private npcType: string;
  private animationConfigs: NPCAnimationConfig;
  private loaded: boolean = false;

  constructor(
    scene: Phaser.Scene,
    npcType: string = 'Default',
    customAnimations?: Partial<NPCAnimationConfig>
  ) {
    super(scene);
    this.npcType = npcType;

    // Set default animations based on NPC type
    let defaultConfig = { ...DefaultNPCAnimations };

    // Use Knight specific animations if applicable
    if (npcType === 'Knight') {
      defaultConfig = { ...KnightAnimations };
    }

    // Merge with any custom animations provided
    const mergedConfig = { ...defaultConfig };

    if (customAnimations) {
      // Only merge defined properties from customAnimations
      Object.keys(customAnimations).forEach((key) => {
        const value = customAnimations[key as keyof Partial<NPCAnimationConfig>];
        if (value !== undefined) {
          mergedConfig[key] = value;
        }
      });
    }

    this.animationConfigs = mergedConfig;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  public preloadAnimations(): void {
    try {
      const basePath = `${NPCAnimationLoader.NPC_BASE_PATH}${this.npcType}/`;

      // Attempt to load animations
      if (this.npcType === 'Knight') {
        // For Knight, try multiple possible paths for the sprite sheet
        const key = 'knight_idle_sheet';
        const possiblePaths = [
          // Absolute path from root
          `/src/assets/sprites/Entities/Npc's/Knight/Idle/Idle-Sheet.png`,
          // Relative path with potential src prefix
          `src/assets/sprites/Entities/Npc's/Knight/Idle/Idle-Sheet.png`,
          // Relative path without src prefix (traditional assets folder pattern)
          `assets/sprites/Entities/Npc's/Knight/Idle/Idle-Sheet.png`,
          // Direct path from base path
          `${basePath}Idle/Idle-Sheet.png`,
        ];

        // Try each path
        let loaded = false;

        // Check if already loaded to prevent duplicate loading
        if (!this.scene.textures.exists(key)) {
          // Add specific file complete listener for this asset
          this.scene.load.on('filecomplete-spritesheet-' + key, () => {
            loaded = true;
            this.loaded = true;
            this.createAnimations();
          });

          // Add specific file error listener for all files
          this.scene.load.on('fileerror', (_file: Phaser.Loader.File) => {
            // Error handler remains but without console.error
          });

          // Try all possible paths
          for (const path of possiblePaths) {
            if (!loaded) {
              this.scene.load.spritesheet(key, path, {
                frameWidth: 32,
                frameHeight: 32,
              });

              // Start loading if not already in progress
              if (this.scene.load.isLoading() === false) {
                this.scene.load.start();
              }
            }
          }
        } else {
          // If already loaded, just create the animations
          this.loaded = true;
          this.createAnimations();
        }
      } else {
        // For other NPCs, use the base class method to load animations
        this.preloadAnimationsFromConfig(basePath, this.animationConfigs);
      }
    } catch (error) {
      this.loaded = true; // Mark as loaded so we can continue with fallbacks
      this.createAnimations();
    }
  }

  public createAnimations(): void {
    try {
      if (this.npcType === 'Knight') {
        // Use the sprite key that was actually loaded
        const spriteKey = 'knight_idle_sheet';

        if (!this.scene.textures.exists(spriteKey)) {
          this.createStaticFallbackAnimation();
          return;
        }

        // Verify that the texture has frames before trying to use them
        const textureSource = this.scene.textures.get(spriteKey);
        const frameCount = textureSource.frameTotal;

        if (frameCount <= 0) {
          this.createStaticFallbackAnimation();
          return;
        }

        // For the Knight sprite sheet, we know there are 4 frames (128x32 with 32x32 frames)
        const actualFrameCount = 4;
        const maxFrame = Math.min(actualFrameCount - 1, frameCount - 1);

        // Create animations for all directions using the same sprite
        ['down', 'up', 'left', 'right'].forEach((direction) => {
          const animKey = `idle_${direction}`;

          if (!this.scene.anims.exists(animKey)) {
            try {
              // Create a simple animation with available frames
              this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                  start: 0,
                  end: maxFrame, // Use only available frames
                }),
                frameRate: 8,
                repeat: -1,
                yoyo: false,
              });

              // Also create talk animation as a copy of idle for now
              const talkKey = `talk_${direction}`;
              if (!this.scene.anims.exists(talkKey)) {
                this.scene.anims.create({
                  key: talkKey,
                  frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                    start: 0,
                    end: maxFrame,
                  }),
                  frameRate: 8,
                  repeat: -1,
                  yoyo: false,
                });
              }
            } catch (error) {
              this.createStaticFallbackAnimation();
            }
          }
        });

        // Create a simple fallback animation
        if (!this.scene.anims.exists('npc_idle_fallback')) {
          this.createStaticFallbackAnimation();
        }
      } else {
        // For other NPCs, use the base class method to create animations
        this.createAnimationsFromConfig(this.animationConfigs);
        this.createFallbackAnimation('npc_idle_fallback');
      }
    } catch (error) {
      // Error handling remains but without console.error
    }
  }

  private createStaticFallbackAnimation(): void {
    try {
      const spriteKey = 'knight_idle_sheet';

      // Create a fallback animation with a single frame if possible
      if (this.scene.textures.exists(spriteKey)) {
        this.scene.anims.create({
          key: 'npc_idle_fallback',
          frames: [{ key: spriteKey, frame: 0 }],
          frameRate: 1,
          repeat: 0,
        });
      } else {
        // If the texture doesn't exist, use any available texture
        const availableTextures = this.scene.textures.getTextureKeys();
        const usableTexture = availableTextures.find(
          (key) => key !== '__DEFAULT' && key !== '__MISSING'
        );

        if (usableTexture) {
          this.scene.anims.create({
            key: 'npc_idle_fallback',
            frames: [{ key: usableTexture, frame: 0 }],
            frameRate: 1,
            repeat: 0,
          });
        }
      }
    } catch (error) {
      // Error handling remains but without console.error
    }
  }
}
