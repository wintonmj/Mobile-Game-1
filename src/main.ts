import { GameScene } from './views/GameScene';
import { PhaserLoader } from './models/PhaserLoader';
import { Registry } from './services/Registry';

// Define a global window extension with the gameRegistry property
interface GameWindow extends Window {
  gameRegistry?: Registry;
}

// Use async loading to initialize the game
async function startGame() {
  // Initialize services
  const registry = new Registry();
  await registry.initializeBasicServices(); // Registers EventBusService by default
  await registry.initialize();

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
    scene: [GameScene],
  };

  // Make registry available for scenes to use
  (window as GameWindow).gameRegistry = registry;

  const game = new Phaser.Game(config);

  // Add event listener for when the game is about to be destroyed
  window.addEventListener('beforeunload', () => {
    registry.shutdown().catch((err) => console.error('Error shutting down services:', err));
    game.destroy(true);
  });
}

// Start the game when the page loads
startGame();
