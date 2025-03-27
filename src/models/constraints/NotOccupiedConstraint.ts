import { GridPosition } from '../interfaces/GridSystem';
import { PlacementConstraint } from '../interfaces/PlacementConstraint';

/**
 * Constraint that requires positions to not be already occupied by another object
 */
export class NotOccupiedConstraint implements PlacementConstraint {
  private excludeIds: string[];

  constructor(excludeIds: string[] = []) {
    // IDs to exclude from occupation check (e.g., the object's own ID)
    this.excludeIds = excludeIds;
  }

  public isSatisfied(position: GridPosition, controller: any): boolean {
    // Convert grid position to world coordinates
    const gridSystem = controller.getGridSystem();
    const worldPos = gridSystem.gridToWorld(position);

    // Check if the position is occupied by any object other than those in excludeIds
    const objectsAtPosition = controller.getSpatialIndex().query(worldPos.x, worldPos.y);
    for (const id of objectsAtPosition) {
      if (!this.excludeIds.includes(id)) {
        return false;
      }
    }

    return true;
  }

  public getDescription(): string {
    return 'Position must not be occupied by another object';
  }
}
