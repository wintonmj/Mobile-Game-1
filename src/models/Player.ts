import { Actions } from './Actions';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerStatus {
  position: Position;
  direction: Direction;
  action: Actions;
}

export class Player {
  // Position and movement
  private x: number;
  private y: number;
  private baseSpeed: number;
  private speed: number;
  private direction: Direction;
  private currentAction: Actions;
  private currentAnimation: Actions;

  // State flags
  private isCarrying: boolean;
  private isWalking: boolean;

  // Combat stats
  private health: number;
  private maxHealth: number;
  private attackPower: number;
  private defense: number;

  // Item and inventory
  private activeItem: string | null;
  private lastActionTime: number;
  private actionCooldowns: Record<string, number>;

  constructor() {
    // Position and movement
    this.x = 0;
    this.y = 0;
    this.baseSpeed = 200;
    this.speed = this.baseSpeed;
    this.direction = 'down';
    this.currentAction = Actions.IDLE;
    this.currentAnimation = Actions.IDLE;

    // State flags
    this.isCarrying = false;
    this.isWalking = false;

    // Combat stats
    this.health = 100;
    this.maxHealth = 100;
    this.attackPower = 10;
    this.defense = 5;

    // Item and inventory
    this.activeItem = null;
    this.lastActionTime = 0;
    this.actionCooldowns = {};
  }

  // Position methods
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  // Direction methods
  public setDirection(direction: Direction): void {
    this.direction = direction;
  }

  public getDirection(): Direction {
    return this.direction;
  }

  // Toggle walking state
  public toggleWalking(): void {
    this.isWalking = !this.isWalking;
    this.speed = this.isWalking ? this.baseSpeed * 0.5 : this.baseSpeed;

    // Update current animation based on walking state
    if (this.currentAction === Actions.MOVING || this.currentAction === Actions.CARRY_WALK) {
      this.updateMovementAction();
    }
  }

  private updateMovementAction(): void {
    if (this.isCarrying) {
      this.setAction(this.isWalking ? Actions.CARRY_WALK : Actions.CARRY_RUN);
    } else {
      this.setAction(this.isWalking ? Actions.WALKING : Actions.MOVING);
    }
  }

  // Return if player is in walking mode
  public isWalkingMode(): boolean {
    return this.isWalking;
  }

  // Get current movement speed
  public getSpeed(): number {
    return this.speed;
  }

  // Action methods
  public setAction(action: Actions): boolean {
    // Don't allow changing actions if there's a cooldown
    if (this.actionCooldowns[action] && this.actionCooldowns[action] > Date.now()) {
      return false;
    }

    // Handle carrying state transitions
    if (this.isCarrying) {
      // If we're carrying and trying to set a non-carry action, convert it to the appropriate carry action
      if (!action.toString().startsWith('carry')) {
        if (action === Actions.MOVING || action === Actions.WALKING) {
          action = this.isWalking ? Actions.CARRY_WALK : Actions.CARRY_RUN;
        } else if (action === Actions.IDLE) {
          action = Actions.CARRY_IDLE;
        }
      }
    } else {
      // If we're not carrying and trying to set a carry action, convert it to the appropriate normal action
      if (action.toString().startsWith('carry')) {
        if (action === Actions.CARRY_WALK || action === Actions.CARRY_RUN) {
          action = this.isWalking ? Actions.WALKING : Actions.MOVING;
        } else if (action === Actions.CARRY_IDLE) {
          action = Actions.IDLE;
        }
      }
    }

    this.currentAction = action;
    this.currentAnimation = action;

    // Set cooldown for non-movement actions
    if (
      action !== Actions.IDLE &&
      action !== Actions.MOVING &&
      action !== Actions.WALKING &&
      action !== Actions.CARRY_IDLE &&
      action !== Actions.CARRY_WALK &&
      action !== Actions.CARRY_RUN
    ) {
      this.actionCooldowns[action] = Date.now() + 1000; // 1 second cooldown
    }
    return true;
  }

  public getCurrentAction(): Actions {
    return this.currentAction;
  }

  // Toggle carrying state
  public toggleCarrying(): void {
    this.isCarrying = !this.isCarrying;

    // Set appropriate action based on current state
    if (this.isCarrying) {
      this.setAction(
        this.currentAction === Actions.MOVING ? Actions.CARRY_WALK : Actions.CARRY_IDLE
      );
    } else {
      this.setAction(this.currentAction === Actions.CARRY_WALK ? Actions.MOVING : Actions.IDLE);
    }
  }

  // Combat methods
  public takeDamage(_amount: number): void {
    // To be implemented when health system is added
  }

  // Status methods
  public getStatus(): PlayerStatus {
    return {
      position: { x: this.x, y: this.y },
      direction: this.direction,
      action: this.currentAction,
    };
  }
}
