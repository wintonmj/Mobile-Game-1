import * as Phaser from 'phaser';
import { GameConfig } from './config/game';

window.addEventListener('load', () => {
  // Create container for the game
  const container = document.createElement('div');
  container.id = 'game';
  document.body.appendChild(container);

  // Create and start the game
  new Phaser.Game(GameConfig);
});
