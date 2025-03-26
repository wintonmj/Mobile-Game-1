export interface DungeonSize {
  width: number;
  height: number;
}

export type TileType = 0 | 1; // 0 = floor, 1 = wall

export class Dungeon {
  private width: number;
  private height: number;
  public tileSize: number;
  private layout: TileType[][];

  constructor(width = 15, height = 15) {
    this.width = width;
    this.height = height;
    this.tileSize = 32;
    this.layout = this.generateLayout();
  }

  private generateLayout(): TileType[][] {
    // Simple dungeon layout: 0 = floor, 1 = wall
    const layout: TileType[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < this.width; x++) {
        // Create walls around the edges
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push(1);
        } else {
          // Add some random walls (15% chance)
          row.push(Math.random() < 0.15 ? 1 : 0);
        }
      }
      layout.push(row);
    }
    return layout;
  }

  public getTileAt(x: number, y: number): TileType {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.layout[y][x];
    }
    return 1; // Return wall for out of bounds
  }

  public isWalkable(x: number, y: number): boolean {
    return this.getTileAt(x, y) === 0;
  }

  public getSize(): DungeonSize {
    return {
      width: this.width * this.tileSize,
      height: this.height * this.tileSize,
    };
  }
}
