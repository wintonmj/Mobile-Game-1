import * as Phaser from 'phaser';
import backgroundImage from '../assets/images/backgrounds/background.png';

export class LoadingScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload(): void {
    this.createLoadingBar();

    // Register loading progress events
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xffffff, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4,
        this.cameras.main.height / 2 - 16,
        (this.cameras.main.width / 2) * value,
        32
      );
    });

    // Load game assets here
    this.load.image('background', backgroundImage);
  }

  create(): void {
    // Transition to the main scene after a short delay
    this.time.delayedCall(1000, () => {
      this.scene.start('MainScene');
    });
  }

  private createLoadingBar(): void {
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4 - 2,
      this.cameras.main.height / 2 - 18,
      this.cameras.main.width / 2 + 4,
      36
    );
    this.progressBar = this.add.graphics();
  }
}
