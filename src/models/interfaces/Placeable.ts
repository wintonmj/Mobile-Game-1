import { PlacementConstraint } from './PlacementConstraint';

/**
 * Interface for objects that can be placed in the game world
 */
export interface Placeable {
  /**
   * Get the current position of the object
   */
  getPosition(): { x: number; y: number };

  /**
   * Set the position of the object
   */
  setPosition(x: number, y: number): void;

  /**
   * Get the preferred position for this object (if any)
   */
  getPreferredPosition?(): { x: number; y: number } | null;

  /**
   * Get the placement priority of this object
   * Higher numbers = higher priority
   */
  getPlacementPriority?(): number;

  /**
   * Get the placement constraints for this object
   */
  getPlacementConstraints?(): PlacementConstraint[];

  /**
   * Serialize the object's state
   */
  serialize?(): any;

  /**
   * Deserialize the object's state
   */
  deserialize?(data: any): void;
}
