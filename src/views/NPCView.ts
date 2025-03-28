import type Phaser from 'phaser';
import { NPCAnimationLoader } from './NPCAnimationLoader';

export class NPCView {
  private scene: Phaser.Scene;
  private animationLoader: NPCAnimationLoader;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private npcType: string;
  private animationsReady: boolean = false;

  private readonly NPC_SCALE = 1.0;

  constructor(scene: Phaser.Scene, npcType: string) {
    this.scene = scene;
    this.npcType = npcType;
    this.animationLoader = new NPCAnimationLoader(scene, npcType);
  }

  public preload(): void {
    this.animationLoader.preloadAnimations();
  }

  public create(x: number, y: number): Phaser.GameObjects.Sprite {
    try {
      // Create NPC sprite with a valid texture
      // For Knight, use a simple placeholder texture that we know exists
      if (this.npcType === 'Knight') {
        // Create sprite and set scale
        this.sprite = this.scene.add.sprite(x, y, 'knight_idle_sheet');
        this.sprite.setScale(this.NPC_SCALE);

        // Set up a timer to check for animations
        this.setupAnimationCheck();
      } else {
        // For other NPCs, create with the idle animation texture
        this.sprite = this.scene.add.sprite(x, y, 'npc_idle_down');
        this.sprite.setScale(this.NPC_SCALE);
      }
    } catch (error) {
      console.error('Error creating NPC sprite:', error);
      // Create a fallback rectangle if sprite creation fails
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xff0000, 1.0);
      graphics.fillRect(x - 16, y - 16, 32, 32);
      // Create a dummy sprite to return
      this.sprite = this.scene.add.sprite(x, y, '__DEFAULT');
      this.sprite.setVisible(false);
    }

    // At this point we know this.sprite is not null
    return this.sprite!;
  }

  private setupAnimationCheck(): void {
    // Check if animations are loaded every 100ms for up to 3 seconds
    let attempts = 0;
    const maxAttempts = 30;

    const checkAnimations = () => {
      attempts++;

      // If we've reached maximum attempts, stop trying
      if (attempts >= maxAttempts) {
        console.warn(`Gave up waiting for animations to load for ${this.npcType}`);

        // Try to show at least something even if animations failed
        if (this.sprite && this.sprite.setFrame) {
          this.sprite.setFrame(0);
        }
        return;
      }

      // Check if animation exists and try to play it
      const animKey = `idle_down`;

      console.log(`Checking for animation ${animKey} (attempt ${attempts}/${maxAttempts})`);

      if (this.scene.anims && this.scene.anims.exists(animKey)) {
        console.log(`Animation ${animKey} found for ${this.npcType}, playing it`);
        this.animationsReady = true;
        this.playAnimation('idle', 'down');
      } else {
        // Check again in 100ms
        setTimeout(checkAnimations, 100);
      }
    };

    // Start checking
    setTimeout(checkAnimations, 100);
  }

  public playAnimation(animationType: string = 'idle', direction: string = 'down'): void {
    if (!this.sprite) return;

    try {
      // Construct animation key based on type and direction
      const animKey = `${animationType}_${direction}`;

      // Verify animation exists and has frames before playing
      if (
        this.scene.anims &&
        this.scene.anims.exists(animKey) &&
        this.scene.anims.get(animKey).frames.length > 0
      ) {
        this.sprite.play(animKey);
      } else if (
        this.scene.anims &&
        this.scene.anims.exists('npc_idle_fallback') &&
        this.scene.anims.get('npc_idle_fallback').frames.length > 0
      ) {
        // Try the fallback animation
        this.sprite.play('npc_idle_fallback');
      } else {
        // If no valid animations, just display the first frame of the sprite
        if (this.sprite.setFrame) {
          this.sprite.setFrame(0);
        }
      }
    } catch (error) {
      console.error('Error playing animation:', error);
      // Ensure sprite is still visible even if animation fails
      if (this.sprite.setFrame) {
        this.sprite.setFrame(0);
      }
    }
  }
}
