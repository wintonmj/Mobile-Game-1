import Phaser from 'phaser';
import { Dungeon, TileType } from '../models/Dungeon';

export class DungeonView {
  private scene: Phaser.Scene;
  private dungeon: Dungeon;
  private tileGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, dungeon: Dungeon) {
    this.scene = scene;
    this.dungeon = dungeon;
    this.tileGraphics = scene.add.graphics();
  }

  public render(): void {
    this.tileGraphics.clear();

    // Get dungeon size and tile size
    const dungeonSize = this.dungeon.getSize();
    const tileSize = this.dungeon.tileSize;
    const width = Math.floor(dungeonSize.width / tileSize);
    const height = Math.floor(dungeonSize.height / tileSize);

    // Draw grid lines
    this.tileGraphics.lineStyle(1, 0x333333, 0.5);
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      this.tileGraphics.beginPath();
      this.tileGraphics.moveTo(0, y * tileSize);
      this.tileGraphics.lineTo(width * tileSize, y * tileSize);
      this.tileGraphics.closePath();
      this.tileGraphics.strokePath();
    }
    
    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      this.tileGraphics.beginPath();
      this.tileGraphics.moveTo(x * tileSize, 0);
      this.tileGraphics.lineTo(x * tileSize, height * tileSize);
      this.tileGraphics.closePath();
      this.tileGraphics.strokePath();
    }

    // Draw tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileType = this.dungeon.getTileAt(x, y);
        this.drawTile(x, y, tileType);
      }
    }
  }

  private drawTile(x: number, y: number, tileType: TileType): void {
    const tileSize = this.dungeon.tileSize;
    const posX = x * tileSize;
    const posY = y * tileSize;

    if (tileType === 1) { // Wall
      this.tileGraphics.fillStyle(0x666666);
      this.tileGraphics.fillRect(posX, posY, tileSize, tileSize);
    } else { // Floor
      this.tileGraphics.fillStyle(0x444444);
      this.tileGraphics.fillRect(posX, posY, tileSize, tileSize);
    }
  }
} 