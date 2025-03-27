import { Dungeon } from './Dungeon';
import { GridPosition, GridSystem } from './interfaces/GridSystem';

/**
 * Implementation of the GridSystem interface for the Dungeon model
 */
export class DungeonGridSystem implements GridSystem {
  private dungeon: Dungeon;

  constructor(dungeon: Dungeon) {
    this.dungeon = dungeon;
  }

  public worldToGrid(x: number, y: number): GridPosition {
    const tileSize = this.dungeon.tileSize;
    return {
      x: Math.floor(x / tileSize),
      y: Math.floor(y / tileSize),
    };
  }

  public gridToWorld(gridPos: GridPosition): { x: number; y: number } {
    const tileSize = this.dungeon.tileSize;
    // Return the center of the tile
    return {
      x: gridPos.x * tileSize + tileSize / 2,
      y: gridPos.y * tileSize + tileSize / 2,
    };
  }

  public isValidPosition(gridPos: GridPosition): boolean {
    // Check if position is within bounds and walkable
    return this.dungeon.isWalkable(gridPos.x, gridPos.y);
  }

  public getCellSize(): { width: number; height: number } {
    return {
      width: this.dungeon.tileSize,
      height: this.dungeon.tileSize,
    };
  }

  public getNeighbors(gridPos: GridPosition): GridPosition[] {
    // Get the four adjacent neighbors (up, right, down, left)
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 }, // Right
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
    ];

    return directions
      .map((dir) => ({
        x: gridPos.x + dir.x,
        y: gridPos.y + dir.y,
      }))
      .filter((pos) => this.isValidPosition(pos));
  }
}
