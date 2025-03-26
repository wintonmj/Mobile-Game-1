import { Actions } from './Actions.js';

export class Player {
    constructor() {
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.speed = 200;
        this.direction = 'down';
        this.currentAction = Actions.IDLE;
        this.currentAnimation = Actions.IDLE;

        // Combat stats
        this.health = 100;
        this.maxHealth = 100;
        this.attackPower = 10;
        this.defense = 5;

        // Item and inventory
        this.activeItem = null;
        this.lastActionTime = 0;
        this.actionCooldowns = {};

        // New property to track carrying state
        this.isCarrying = false;
    }

    // Position methods
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    // Direction methods
    setDirection(direction) {
        this.direction = direction;
    }

    getDirection() {
        return this.direction;
    }

    // Action methods
    setAction(action) {
        // Don't allow changing actions if there's a cooldown
        if (this.actionCooldowns[action] && this.actionCooldowns[action] > Date.now()) {
            return false;
        }

        // Update carrying state based on action
        if (action.startsWith('CARRY')) {
            this.isCarrying = true;
        }

        this.currentAction = action;
        this.currentAnimation = action;

        // Set cooldown for non-idle/moving actions
        if (action !== Actions.IDLE && action !== Actions.MOVING) {
            this.actionCooldowns[action] = Date.now() + 1000; // 1 second cooldown
        }
        return true;
    }

    getCurrentAction() {
        return this.currentAction;
    }

    // Toggle carrying state
    toggleCarrying() {
        this.isCarrying = !this.isCarrying;
        console.log(`Carrying state toggled: ${this.isCarrying}`);
        // Set appropriate action based on current state
        if (this.isCarrying) {
            this.setAction(this.currentAction === Actions.MOVING ? Actions.CARRY_WALK : Actions.CARRY_IDLE);
        } else {
            this.setAction(this.currentAction === Actions.CARRY_WALK ? Actions.MOVING : Actions.IDLE);
        }
    }

    // Combat methods
    takeDamage(amount) {
        // To be implemented when health system is added
        console.log(`Player took ${amount} damage`);
    }

    // Status methods
    getStatus() {
        return {
            position: { x: this.x, y: this.y },
            direction: this.direction,
            action: this.currentAction
        };
    }
} 