import type Phaser from 'phaser';
import { InputController } from './InputController';
import { Player } from '../models/Player';
import { Dungeon } from '../models/Dungeon';
import { Actions } from '../models/Actions';
import { ObjectPlacementController } from './ObjectPlacementController';
import { IEventBusService } from '../services/interfaces/IEventBusService';
import { IRegistry } from '../services/interfaces/IRegistry';
import { GameEvents as EventCatalog } from '../events/GameEvents';

// Define event names as constants to ensure consistency
// This is kept for backward compatibility - new code should use the EventCatalog import
export const GameEvents = {
  PLAYER: {
    MOVED: EventCatalog.PLAYER.MOVED,
    ACTION_CHANGED: EventCatalog.PLAYER.ACTION_CHANGED,
    DIRECTION_CHANGED: EventCatalog.PLAYER.DIRECTION_CHANGED,
    COLLISION: EventCatalog.PLAYER.COLLISION
  },
  GAME: {
    INITIALIZED: EventCatalog.GAME.INITIALIZED,
    UPDATED: EventCatalog.GAME.UPDATED
  }
};

interface PlayerView {
  onActionComplete: () => void;
}

interface GameScene extends Phaser.Scene {
  playerView?: PlayerView;
  updatePlayerSprite: (player: Player) => void;
}

export class GameController {
  private scene: GameScene;
  public player: Player;
  public inputController: InputController;
  public dungeon: Dungeon;
  public objectPlacementController: ObjectPlacementController;
  private lastUpdate: number;
  private eventBus: IEventBusService | null = null;

  constructor(scene: GameScene, dungeon?: Dungeon, registry?: IRegistry) {
    this.scene = scene;
    this.player = new Player();
    this.dungeon = dungeon || new Dungeon();
    this.objectPlacementController = new ObjectPlacementController(this.dungeon);
    this.inputController = new InputController(scene, this.player);
    this.lastUpdate = 0;

    // Get the EventBusService from the registry if available
    if (registry) {
      this.eventBus = registry.getService('eventBus') as IEventBusService;
    } else if ((window as any).gameRegistry) {
      // Fallback to global registry if available
      this.eventBus = (window as any).gameRegistry.getService('eventBus') as IEventBusService;
    }
  }

  public init(): void {
    this.inputController.init();

    // Register player with placement controller
    this.objectPlacementController.registerObject(this.player);

    // Ensure player starting position (2, 2) is always walkable
    this.dungeon.ensureWalkable(2, 2);

    // Place player at starting position using the placement controller
    const tileSize = this.dungeon.tileSize;
    this.player.setPosition(2 * tileSize + tileSize / 2, 2 * tileSize + tileSize / 2);
    this.objectPlacementController.placeObject(this.player);

    // Set up animation completion callback
    if (this.scene.playerView) {
      this.scene.playerView.onActionComplete = () => {
        this.player.setAction(Actions.IDLE);
        // Emit event when action completes
        this.emitActionChanged(Actions.IDLE);
      };
    }

    // Emit game initialized event
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.GAME.INITIALIZED, {
        playerPosition: this.player.getPosition(),
        dungeonSize: this.dungeon.getSize()
      });
    }
  }

  public update(): void {
    // Update input state
    if (this.inputController) {
      this.inputController.update();
    }

    // Get current action to determine if we can move
    const currentAction = this.player.getCurrentAction();
    const isInterruptibleAction =
      currentAction === Actions.IDLE ||
      currentAction === Actions.MOVING ||
      currentAction === Actions.WALKING ||
      currentAction === Actions.CARRY_IDLE ||
      currentAction === Actions.CARRY_WALK ||
      currentAction === Actions.CARRY_RUN;

    // Store the initial position and action for comparison later
    const initialPosition = { ...this.player.getPosition() };
    const initialAction = this.player.getCurrentAction();
    const initialDirection = this.player.getDirection();

    // Handle all possible actions first
    this._handleActions();

    // Only handle movement if in an interruptible state
    if (isInterruptibleAction) {
      this._handleMovement();
    }

    // Update the view
    this.scene.updatePlayerSprite(this.player);

    // Check if position, action, or direction changed and emit events if needed
    const currentPosition = this.player.getPosition();
    if (currentPosition.x !== initialPosition.x || currentPosition.y !== initialPosition.y) {
      this.emitPlayerMoved(currentPosition);
    }

    if (this.player.getCurrentAction() !== initialAction) {
      this.emitActionChanged(this.player.getCurrentAction() as Actions);
    }

    if (this.player.getDirection() !== initialDirection) {
      this.emitDirectionChanged(this.player.getDirection());
    }

    // Emit game update event
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.GAME.UPDATED, {
        deltaTime: this.scene.game.loop.delta / 1000
      });
    }
  }

  // Helper methods to emit events
  private emitPlayerMoved(position: { x: number, y: number }): void {
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.PLAYER.MOVED, {
        x: position.x,
        y: position.y,
        tileX: Math.floor(position.x / this.dungeon.tileSize),
        tileY: Math.floor(position.y / this.dungeon.tileSize)
      });
    }
  }

  private emitActionChanged(action: Actions): void {
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.PLAYER.ACTION_CHANGED, {
        action,
        isInterruptible: [
          Actions.IDLE,
          Actions.MOVING,
          Actions.WALKING,
          Actions.CARRY_IDLE,
          Actions.CARRY_WALK,
          Actions.CARRY_RUN
        ].includes(action)
      });
    }
  }

  private emitDirectionChanged(direction: string): void {
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.PLAYER.DIRECTION_CHANGED, { direction });
    }
  }

  private _handleActions(): void {
    // Handle various actions
    if (this.inputController.isActionPressed(Actions.DEATH)) {
      this.player.setAction(Actions.DEATH);
    } else if (this.inputController.isActionPressed(Actions.HIT)) {
      this.player.setAction(Actions.HIT);
    } else if (this.inputController.isActionPressed(Actions.COLLECTING)) {
      this.player.setAction(Actions.COLLECTING);
    } else if (this.inputController.isActionPressed(Actions.CUTTING)) {
      this.player.setAction(Actions.CUTTING);
    } else if (this.inputController.isActionPressed(Actions.MINING)) {
      this.player.setAction(Actions.MINING);
    } else if (this.inputController.isActionPressed(Actions.FISHING)) {
      this.player.setAction(Actions.FISHING);
    } else if (this.inputController.isActionPressed(Actions.WATERING)) {
      this.player.setAction(Actions.WATERING);
    } else if (this.inputController.isActionPressed(Actions.PIERCING)) {
      this.player.setAction(Actions.PIERCING);
    }
  }

  private _handleMovement(): void {
    const delta = this.scene.game.loop.delta / 1000;
    const moveVector = this.inputController.getMovementVector();
    const playerPosition = this.player.getPosition();
    const playerSpeed = this.player.getSpeed();

    // Calculate movement deltas using normalized vector and player's actual speed
    const deltaX = moveVector.x * playerSpeed * delta;
    const deltaY = moveVector.y * playerSpeed * delta;

    // Update player direction based on movement
    const direction = this.inputController.getMovementDirection();
    if (direction && (moveVector.x !== 0 || moveVector.y !== 0)) {
      this.player.setDirection(direction);
    }

    // Update player's action based on movement and states
    const isMoving = this.inputController.isMoving();
    if (isMoving) {
      // Set appropriate movement action based on whether player is running or walking
      const isRunning = this.inputController.isRunning();
      const isCarrying = this.player.carrying;

      if (isCarrying) {
        // Use carrying actions
        this.player.setAction(isRunning ? Actions.CARRY_RUN : Actions.CARRY_WALK);
      } else {
        // Use normal movement actions
        this.player.setAction(isRunning ? Actions.MOVING : Actions.WALKING);
      }
    } else if (
      this.player.getCurrentAction() === Actions.MOVING ||
      this.player.getCurrentAction() === Actions.WALKING ||
      this.player.getCurrentAction() === Actions.CARRY_WALK ||
      this.player.getCurrentAction() === Actions.CARRY_RUN
    ) {
      // Only set to IDLE if we're currently in a movement state
      // This prevents overriding action states that might have been set in _handleActions
      if (this.player.carrying) {
        this.player.setAction(Actions.CARRY_IDLE);
      } else {
        this.player.setAction(Actions.IDLE);
      }
    }

    // Try moving horizontally
    if (deltaX !== 0) {
      const newX = playerPosition.x + deltaX;
      if (!this._wouldCollide(newX, playerPosition.y)) {
        this.player.setPosition(newX, playerPosition.y);
      } else if (this.eventBus) {
        // Emit collision event
        this.eventBus.emit(GameEvents.PLAYER.COLLISION, {
          direction: deltaX > 0 ? 'right' : 'left',
          position: { x: newX, y: playerPosition.y },
          tileX: Math.floor(newX / this.dungeon.tileSize),
          tileY: Math.floor(playerPosition.y / this.dungeon.tileSize)
        });
      }
    }

    // Try moving vertically
    if (deltaY !== 0) {
      const newY = playerPosition.y + deltaY;
      if (!this._wouldCollide(playerPosition.x, newY)) {
        this.player.setPosition(playerPosition.x, newY);
      } else if (this.eventBus) {
        // Emit collision event
        this.eventBus.emit(GameEvents.PLAYER.COLLISION, {
          direction: deltaY > 0 ? 'down' : 'up',
          position: { x: playerPosition.x, y: newY },
          tileX: Math.floor(playerPosition.x / this.dungeon.tileSize),
          tileY: Math.floor(newY / this.dungeon.tileSize)
        });
      }
    }
  }

  private _wouldCollide(x: number, y: number): boolean {
    // Get the tile size from the dungeon
    const tileSize = this.dungeon.tileSize;
    const playerSize = tileSize * 0.6;
    const halfPlayer = playerSize / 2;

    // Check corners of player hitbox
    const corners = [
      { x: x - halfPlayer, y: y - halfPlayer }, // Top-left
      { x: x + halfPlayer, y: y - halfPlayer }, // Top-right
      { x: x - halfPlayer, y: y + halfPlayer }, // Bottom-left
      { x: x + halfPlayer, y: y + halfPlayer }, // Bottom-right
    ];

    // Check if any corner would collide with a wall
    return corners.some((corner) => {
      const tileX = Math.floor(corner.x / tileSize);
      const tileY = Math.floor(corner.y / tileSize);
      return !this.dungeon.isWalkable(tileX, tileY);
    });
  }
}
