/**
 * Interface for grid systems used for object placement
 */
export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSystem {
  /**
   * Convert world coordinates to grid coordinates
   */
  worldToGrid(x: number, y: number): GridPosition;

  /**
   * Convert grid coordinates to world coordinates
   */
  gridToWorld(gridPos: GridPosition): { x: number; y: number };

  /**
   * Check if a grid position is valid (within bounds)
   */
  isValidPosition(gridPos: GridPosition): boolean;

  /**
   * Get the cell size of the grid
   */
  getCellSize(): { width: number; height: number };

  /**
   * Get neighboring grid positions from a given position
   */
  getNeighbors(gridPos: GridPosition): GridPosition[];
}
