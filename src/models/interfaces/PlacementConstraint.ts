import { GridPosition } from './GridSystem';
import { ObjectPlacementController } from '../../controllers/ObjectPlacementController';

/**
 * Interface for constraints that determine valid object placement positions
 */
export interface PlacementConstraint {
  /**
   * Check if a position satisfies this constraint
   * @param position The grid position to check
   * @param controller The object placement controller
   * @returns true if the position satisfies the constraint, false otherwise
   */
  isSatisfied(position: GridPosition, controller: ObjectPlacementController): boolean;

  /**
   * Get a description of this constraint (for debugging)
   */
  getDescription(): string;
}
