import { GridPosition } from '../interfaces/GridSystem';
import { Placeable } from '../interfaces/Placeable';
import { PlacementStrategy } from '../interfaces/PlacementStrategy';
import { ObjectPlacementController } from '../../controllers/ObjectPlacementController';
import { PlacementConstraint } from '../interfaces/PlacementConstraint';

/**
 * Strategy that places objects at random valid positions
 */
export class RandomPlacementStrategy implements PlacementStrategy {
  private maxAttempts: number;

  constructor(maxAttempts: number = 100) {
    this.maxAttempts = maxAttempts;
  }

  public findPosition(
    controller: ObjectPlacementController,
    object: Placeable
  ): { x: number; y: number } | null {
    const gridSystem = controller.getGridSystem();
    const constraints = object.getPlacementConstraints ? object.getPlacementConstraints() : [];

    // Try a preferred position first if available
    if (object.getPreferredPosition) {
      const preferredPos = object.getPreferredPosition();
      if (preferredPos) {
        const gridPos = gridSystem.worldToGrid(preferredPos.x, preferredPos.y);
        if (this.isValidPosition(gridPos, controller, constraints)) {
          return preferredPos;
        }
      }
    }

    // Try random positions
    for (let i = 0; i < this.maxAttempts; i++) {
      const gridPos = this.getRandomGridPosition(controller);
      if (this.isValidPosition(gridPos, controller, constraints)) {
        const worldPos = gridSystem.gridToWorld(gridPos);
        return worldPos;
      }
    }

    return null;
  }

  public getName(): string {
    return 'random';
  }

  private getRandomGridPosition(controller: ObjectPlacementController): GridPosition {
    const dungeon = controller.getDungeon();
    const size = dungeon.getSize();

    let x: number;
    let y: number;

    do {
      x = Math.floor(Math.random() * size.width);
      y = Math.floor(Math.random() * size.height);
    } while (!dungeon.isWalkable(x, y));

    return { x, y };
  }

  private isValidPosition(
    position: GridPosition,
    controller: ObjectPlacementController,
    constraints: PlacementConstraint[]
  ): boolean {
    const dungeon = controller.getDungeon();
    const size = dungeon.getSize();

    // Check if position is within bounds
    if (position.x < 0 || position.x >= size.width || position.y < 0 || position.y >= size.height) {
      return false;
    }

    // Check if position is walkable
    if (!dungeon.isWalkable(position.x, position.y)) {
      return false;
    }

    // Check if position is occupied
    if (controller.isPositionOccupied(position.x, position.y)) {
      return false;
    }

    // Check all constraints
    for (const constraint of constraints) {
      if (!constraint.isSatisfied(position, controller)) {
        return false;
      }
    }

    return true;
  }
}
