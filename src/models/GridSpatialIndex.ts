import { GridPosition, GridSystem } from './interfaces/GridSystem';
import { SpatialIndex } from './interfaces/SpatialIndex';

/**
 * Grid-based implementation of SpatialIndex
 * Uses a grid for efficient spatial partitioning
 */
export class GridSpatialIndex implements SpatialIndex {
  private gridSystem: GridSystem;
  private objectPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  private grid: Map<string, Set<string>>;

  constructor(gridSystem: GridSystem) {
    this.gridSystem = gridSystem;
    this.objectPositions = new Map();
    this.grid = new Map();
  }

  public insert(id: string, x: number, y: number, width: number = 1, height: number = 1): void {
    // Remove if already exists
    if (this.objectPositions.has(id)) {
      this.remove(id);
    }

    // Store the object's position
    this.objectPositions.set(id, { x, y, width, height });

    // Calculate grid cells this object occupies
    const startGridPos = this.gridSystem.worldToGrid(x, y);
    const endGridPos = this.gridSystem.worldToGrid(
      x + (width > 1 ? width - 1 : 0),
      y + (height > 1 ? height - 1 : 0)
    );

    // Add to all occupied grid cells
    for (let gridX = startGridPos.x; gridX <= endGridPos.x; gridX++) {
      for (let gridY = startGridPos.y; gridY <= endGridPos.y; gridY++) {
        const cellKey = this.getCellKey({ x: gridX, y: gridY });
        if (!this.grid.has(cellKey)) {
          this.grid.set(cellKey, new Set());
        }
        this.grid.get(cellKey)!.add(id);
      }
    }
  }

  public remove(id: string): void {
    // Get the object's stored position
    const position = this.objectPositions.get(id);
    if (!position) return;

    // Calculate grid cells this object occupied
    const startGridPos = this.gridSystem.worldToGrid(position.x, position.y);
    const endGridPos = this.gridSystem.worldToGrid(
      position.x + (position.width > 1 ? position.width - 1 : 0),
      position.y + (position.height > 1 ? position.height - 1 : 0)
    );

    // Remove from all occupied grid cells
    for (let gridX = startGridPos.x; gridX <= endGridPos.x; gridX++) {
      for (let gridY = startGridPos.y; gridY <= endGridPos.y; gridY++) {
        const cellKey = this.getCellKey({ x: gridX, y: gridY });
        if (this.grid.has(cellKey)) {
          this.grid.get(cellKey)!.delete(id);
          // Clean up empty sets
          if (this.grid.get(cellKey)!.size === 0) {
            this.grid.delete(cellKey);
          }
        }
      }
    }

    // Remove from object positions
    this.objectPositions.delete(id);
  }

  public query(x: number, y: number, width: number = 1, height: number = 1): string[] {
    const result = new Set<string>();

    // Calculate grid cells to query
    const startGridPos = this.gridSystem.worldToGrid(x, y);
    const endGridPos = this.gridSystem.worldToGrid(
      x + (width > 1 ? width - 1 : 0),
      y + (height > 1 ? height - 1 : 0)
    );

    // Query all cells in the range
    for (let gridX = startGridPos.x; gridX <= endGridPos.x; gridX++) {
      for (let gridY = startGridPos.y; gridY <= endGridPos.y; gridY++) {
        const cellKey = this.getCellKey({ x: gridX, y: gridY });
        if (this.grid.has(cellKey)) {
          const cellObjects = this.grid.get(cellKey)!;
          for (const id of cellObjects) {
            result.add(id);
          }
        }
      }
    }

    return Array.from(result);
  }

  public clear(): void {
    this.objectPositions.clear();
    this.grid.clear();
  }

  private getCellKey(pos: GridPosition): string {
    return `${pos.x},${pos.y}`;
  }
}
