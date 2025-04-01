import * as Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private clickCount: number = 0;
  private countText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // Add background
    this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Add hello world text
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'Hello World!',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Add click counter text
    this.countText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `Clicks: ${this.clickCount}`,
      {
        fontSize: '32px',
        color: '#00ff00',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Add instruction text
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Click to increment counter\nPress R to restart scene',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Add click handler to increment counter
    this.input.on('pointerdown', () => {
      this.clickCount++;
      this.countText.setText(`Clicks: ${this.clickCount}`);
    });

    // Add key handler for scene restart
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-R', () => {
        this.scene.start('LoadingScene');
      });
    }
  }

  // This method will be called by HMR when the module is hot reloaded
  public hot?: {
    data?: {
      clickCount: number;
    };
  };

  // Store state before HMR update
  beforeDestroy(): void {
    if (this.hot) {
      this.hot.data = {
        clickCount: this.clickCount
      };
    }
  }

  // Restore state after HMR update
  init(): void {
    this.clickCount = this.hot?.data?.clickCount ?? this.clickCount;
  }
} 