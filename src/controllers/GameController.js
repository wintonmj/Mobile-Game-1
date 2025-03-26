import { InputController } from './InputController.js';
import { Player } from '../models/Player.js';
import { Dungeon } from '../models/Dungeon.js';
import { Actions } from '../models/Actions.js';

export class GameController {
    constructor(scene) {
        this.scene = scene;
        this.player = new Player();
        this.inputController = new InputController(scene, this.player);
        this.dungeon = new Dungeon();
        this.lastUpdate = 0;
    }

    init() {
        this.inputController.init();
        // Place player at a valid starting position
        this.player.setPosition(
            this.dungeon.tileSize * 1.5,
            this.dungeon.tileSize * 1.5
        );

        // Set up animation completion callback
        if (this.scene.playerView) {
            this.scene.playerView.onActionComplete = () => {
                this.player.setAction(Actions.IDLE);
            };
        }
    }

    update() {
        // Update input state
        this.inputController.update();

        // Get current action to determine if we can move
        const currentAction = this.player.getCurrentAction();
        const isInterruptibleAction = currentAction === Actions.IDLE || 
                                    currentAction === Actions.MOVING ||
                                    currentAction.startsWith('carry');

        // Only handle movement if in an interruptible state
        if (isInterruptibleAction) {
            this._handleMovement();
        }
        
        // Handle all possible actions
        this._handleActions();

        // Update the view
        this.scene.updatePlayerSprite(this.player);
    }

    _handleActions() {
        const currentAction = this.player.getCurrentAction();

        // Check for carry toggle first as it affects movement state
        if (this.inputController.isActionPressed('carry')) {
            if (this.inputController.isMoving()) {
                this.player.setAction(Actions.CARRY_WALK);
            } else {
                this.player.setAction(Actions.CARRY_IDLE);
            }
            return;
        }

        // Handle other actions
        if (this.inputController.isActionPressed(Actions.DEATH)) {
            this.player.setAction(Actions.DEATH);
        }
        else if (this.inputController.isActionPressed(Actions.HIT)) {
            this.player.setAction(Actions.HIT);
        }
        else if (this.inputController.isActionPressed(Actions.COLLECTING)) {
            this.player.setAction(Actions.COLLECTING);
        }
        else if (this.inputController.isActionPressed(Actions.CUTTING)) {
            this.player.setAction(Actions.CUTTING);
        }
        else if (this.inputController.isActionPressed(Actions.MINING)) {
            this.player.setAction(Actions.MINING);
        }
        else if (this.inputController.isActionPressed(Actions.FISHING)) {
            this.player.setAction(Actions.FISHING);
        }
        else if (this.inputController.isActionPressed(Actions.WATERING)) {
            this.player.setAction(Actions.WATERING);
        }
        else if (this.inputController.isActionPressed(Actions.PIERCING)) {
            this.player.setAction(Actions.PIERCING);
        }
    }

    _handleMovement() {
        const delta = this.scene.game.loop.delta / 1000;
        const moveVector = this.inputController.getMovementVector();

        // Calculate movement deltas using normalized vector
        const deltaX = moveVector.x * this.player.speed * delta;
        const deltaY = moveVector.y * this.player.speed * delta;

        // Update player direction based on movement
        if (moveVector.x !== 0 || moveVector.y !== 0) {
            this.player.setDirection(this.inputController.getMovementDirection());
        }

        // Update player's moving state if not carrying
        if (!this.inputController.isCarrying) {
            this.player.setAction(this.inputController.isMoving() ? Actions.MOVING : Actions.IDLE);
        }

        // Try moving horizontally
        if (deltaX !== 0) {
            const newX = this.player.x + deltaX;
            if (!this._wouldCollide(newX, this.player.y)) {
                this.player.setPosition(newX, this.player.y);
            }
        }

        // Try moving vertically
        if (deltaY !== 0) {
            const newY = this.player.y + deltaY;
            if (!this._wouldCollide(this.player.x, newY)) {
                this.player.setPosition(this.player.x, newY);
            }
        }
    }

    _wouldCollide(x, y) {
        const playerSize = this.dungeon.tileSize * 0.6;
        const halfPlayer = playerSize / 2;

        // Check corners of player hitbox
        const corners = [
            { x: x - halfPlayer, y: y - halfPlayer }, // Top-left
            { x: x + halfPlayer, y: y - halfPlayer }, // Top-right
            { x: x - halfPlayer, y: y + halfPlayer }, // Bottom-left
            { x: x + halfPlayer, y: y + halfPlayer }  // Bottom-right
        ];

        // Check if any corner would collide with a wall
        return corners.some(corner => {
            const tileX = Math.floor(corner.x / this.dungeon.tileSize);
            const tileY = Math.floor(corner.y / this.dungeon.tileSize);
            return !this.dungeon.isWalkable(tileX, tileY);
        });
    }
} 