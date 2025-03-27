/**
 * Model class for Non-Player Characters (NPCs) in the game
 */
import { Placeable } from './interfaces/Placeable';
import { PlacementConstraint } from './interfaces/PlacementConstraint';

export class NPC implements Placeable {
  // Position
  private x: number;
  private y: number;

  // Type and basic information
  private npcType: string;
  private name: string;
  private interactable: boolean;

  // State
  private talking: boolean;

  constructor(npcType: string, name: string, x: number = 0, y: number = 0) {
    this.npcType = npcType;
    this.name = name;
    this.x = x;
    this.y = y;
    this.interactable = true;
    this.talking = false;
  }

  // Position methods - required by Placeable interface
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  // Optional Placeable interface methods
  public getPlacementConstraints(): PlacementConstraint[] {
    return []; // Using default constraints (walkable, not occupied)
  }

  public getPlacementPriority(): number {
    return 5; // Medium priority, adjust as needed
  }

  // State methods
  public startTalking(): void {
    this.talking = true;
  }

  public stopTalking(): void {
    this.talking = false;
  }

  public isTalking(): boolean {
    return this.talking;
  }

  // Type and info methods
  public getName(): string {
    return this.name;
  }

  public getType(): string {
    return this.npcType;
  }

  public isInteractable(): boolean {
    return this.interactable;
  }

  public setInteractable(interactable: boolean): void {
    this.interactable = interactable;
  }
}
