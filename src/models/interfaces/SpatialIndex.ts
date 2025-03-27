/**
 * Interface for spatial indexing to efficiently track object positions
 */
export interface SpatialIndex {
  /**
   * Insert an object into the spatial index
   * @param id Unique identifier for the object
   * @param x X position in world coordinates
   * @param y Y position in world coordinates
   * @param width Optional width of the object (defaults to 1)
   * @param height Optional height of the object (defaults to 1)
   */
  insert(id: string, x: number, y: number, width?: number, height?: number): void;

  /**
   * Remove an object from the spatial index
   * @param id Unique identifier for the object
   */
  remove(id: string): void;

  /**
   * Query objects at a specific position or area
   * @param x X position in world coordinates
   * @param y Y position in world coordinates
   * @param width Optional width of the query area
   * @param height Optional height of the query area
   * @returns Array of object IDs at the queried position/area
   */
  query(x: number, y: number, width?: number, height?: number): string[];

  /**
   * Clear all objects from the spatial index
   */
  clear(): void;
}
