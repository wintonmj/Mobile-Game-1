import { GameScene } from './views/GameScene';
import { PhaserLoader } from './models/PhaserLoader';

// Use async loading to initialize the game
async function startGame() {
  // Dynamically import Phaser
  const Phaser = await PhaserLoader.load();

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0, x: 0 },
        debug: false,
      },
    },
    scene: GameScene,
  };

  new Phaser.Game(config);
}

// Start the game when the page loads
startGame();
