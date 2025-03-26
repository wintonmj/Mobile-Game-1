// This file declares the Phaser variable as a global type
// so TypeScript recognizes it when loaded via script tag

import * as PhaserTypes from 'phaser';

declare global {
  const Phaser: typeof PhaserTypes;
}
