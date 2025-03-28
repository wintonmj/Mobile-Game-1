import { GridPosition } from '../interfaces/GridSystem';
import { PlacementConstraint } from '../interfaces/PlacementConstraint';
import { ObjectPlacementController } from '../../controllers/ObjectPlacementController';

/**
 * Constraint that requires positions to be walkable
 */
export class WalkableConstraint implements PlacementConstraint {
  public isSatisfied(position: GridPosition, controller: ObjectPlacementController): boolean {
    // Get the dungeon from the controller
    const gridSystem = controller.getGridSystem();
    return gridSystem.isValidPosition(position);
  }

  public getDescription(): string {
    return 'Position must be walkable';
  }
}
