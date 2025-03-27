import type Phaser from 'phaser';
import { Actions, ActionAnimations } from '../models/Actions';

export class PlayerView {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private readonly PLAYER_SCALE = 1.0;
  public onActionComplete?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public preload(): void {
    const baseConfig = { frameWidth: 64, frameHeight: 64 };

    // Load all action animations
    Object.entries(ActionAnimations).forEach(([_action, config]) => {
      const basePath = `./src/assets/sprites/Entities/Characters/Body_A/Animations/${config.spriteBase}/`;

      // Load down animation
      this.scene.load.spritesheet(
        `${config.spriteBase}-down`,
        `${basePath}${config.spriteBase.split('_')[0]}_Down-Sheet.png`,
        baseConfig
      );

      // Load side animation (used for both left and right)
      this.scene.load.spritesheet(
        `${config.spriteBase}-side`,
        `${basePath}${config.spriteBase.split('_')[0]}_Side-Sheet.png`,
        baseConfig
      );

      // Load up animation
      this.scene.load.spritesheet(
        `${config.spriteBase}-up`,
        `${basePath}${config.spriteBase.split('_')[0]}_Up-Sheet.png`,
        baseConfig
      );
    });
  }

  public create(x: number, y: number): Phaser.GameObjects.Sprite {
    // Create player sprite using the down idle sprite as initial texture
    this.sprite = this.scene.add.sprite(x, y, `${ActionAnimations[Actions.IDLE].spriteBase}-down`);
    this.sprite.setScale(this.PLAYER_SCALE);

    // Create all animations
    this.createAnimations();

    // Set up animation completion callback for non-repeating animations
    this.sprite.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
      const actionConfig = Object.values(ActionAnimations).find((config) =>
        Object.values(this.getDirectionKeys(config.animBase)).includes(animation.key)
      );

      if (actionConfig && actionConfig.repeat === 0 && this.onActionComplete) {
        this.onActionComplete();
      }
    });

    // Set initial animation
    this.sprite.play(`${ActionAnimations[Actions.IDLE].animBase}-down`);

    return this.sprite;
  }

  private createAnimations(): void {
    // Create animations for each action and direction
    Object.entries(ActionAnimations).forEach(([_action, config]) => {
      // Create down animation
      this.createActionAnimation(`${config.spriteBase}-down`, `${config.animBase}-down`, config);

      // Create side animation (used for both left and right)
      this.createActionAnimation(`${config.spriteBase}-side`, `${config.animBase}-left`, config);

      // Create up animation
      this.createActionAnimation(`${config.spriteBase}-up`, `${config.animBase}-up`, config);
    });
  }

  private createActionAnimation(
    spriteKey: string,
    animationKey: string,
    config: { frameCount: number; frameRate: number; repeat: number; yoyo: boolean }
  ): void {
    this.scene.anims.create({
      key: animationKey,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, {
        start: 0,
        end: config.frameCount - 1,
      }),
      frameRate: config.frameRate,
      repeat: config.repeat,
      yoyo: config.yoyo,
    });
  }

  private getDirectionKeys(animBase: string): { down: string; left: string; up: string } {
    return {
      down: `${animBase}-down`,
      left: `${animBase}-left`,
      up: `${animBase}-up`,
    };
  }

  public update(x: number, y: number, direction: string, action: Actions): void {
    if (!this.sprite) return;

    // Update position
    this.sprite.setPosition(x, y);

    const config = ActionAnimations[action];
    if (!config) return; // Invalid action

    // Handle animation based on direction
    const isSideView = direction === 'left' || direction === 'right';
    const animationBase = isSideView ? 'left' : direction;

    // Set sprite configuration
    const spriteKey = `${config.spriteBase}-${isSideView ? 'side' : direction}`;
    const animationKey = `${config.animBase}-${animationBase}`;

    // Handle sprite flipping
    this.sprite.setFlipX(direction === 'left');

    // Only change animation if it's different
    if (this.sprite.anims.getName() !== animationKey) {
      this.sprite.setTexture(spriteKey);
      this.sprite.play(animationKey);
    }
  }
}
