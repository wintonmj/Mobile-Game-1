import { Placeable } from './Placeable';
import { ObjectPlacementController } from '../../controllers/ObjectPlacementController';

/**
 * Interface for placement strategies that find valid positions for objects
 */
export interface PlacementStrategy {
  /**
   * Find a valid position for an object
   * @param controller The object placement controller
   * @param object The object to place
   * @returns A valid position or null if no valid position could be found
   */
  findPosition(
    controller: ObjectPlacementController,
    object: Placeable
  ): { x: number; y: number } | null;

  /**
   * Get the name of this strategy (for debugging and serialization)
   */
  getName(): string;
}
