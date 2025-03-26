import { Actions } from '../models/Actions.js';

export class InputController {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.cursors = null;
        this.keys = null;
        this.inputState = {
            movement: {
                up: false,
                down: false,
                left: false,
                right: false,
                vector: { x: 0, y: 0 }  // Normalized movement vector
            },
            actions: {
                // Map each action to false initially
                [Actions.COLLECTING]: false,
                [Actions.CUTTING]: false,
                [Actions.MINING]: false,
                [Actions.FISHING]: false,
                [Actions.WATERING]: false,
                [Actions.PIERCING]: false,
                [Actions.CARRY_IDLE]: false,
                [Actions.CARRY_WALK]: false,
                [Actions.CARRY_RUN]: false,
                [Actions.HIT]: false,
                [Actions.DEATH]: false
            }
        };
    }

    init() {
        // Set up arrow keys
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        
        // Set up WASD and action keys
        this.keys = this.scene.input.keyboard.addKeys({
            // Movement
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            
            // Action keys (using number keys for testing)
            collect: Phaser.Input.Keyboard.KeyCodes.E,    // Original collect key
            cut: Phaser.Input.Keyboard.KeyCodes.ONE,      // 1 for cutting
            mine: Phaser.Input.Keyboard.KeyCodes.TWO,     // 2 for mining
            fish: Phaser.Input.Keyboard.KeyCodes.THREE,   // 3 for fishing
            water: Phaser.Input.Keyboard.KeyCodes.FOUR,   // 4 for watering
            pierce: Phaser.Input.Keyboard.KeyCodes.FIVE,  // 5 for piercing
            carry: Phaser.Input.Keyboard.KeyCodes.C,      // C for carry toggle
            hit: Phaser.Input.Keyboard.KeyCodes.H,        // H for hit
            death: Phaser.Input.Keyboard.KeyCodes.X       // X for death
        });
    }

    update() {
        // Update movement state
        this.inputState.movement.up = this.cursors.up.isDown || this.keys.w.isDown;
        this.inputState.movement.down = this.cursors.down.isDown || this.keys.s.isDown;
        this.inputState.movement.left = this.cursors.left.isDown || this.keys.a.isDown;
        this.inputState.movement.right = this.cursors.right.isDown || this.keys.d.isDown;

        // Calculate normalized movement vector
        let x = 0;
        let y = 0;
        if (this.inputState.movement.left) x -= 1;
        if (this.inputState.movement.right) x += 1;
        if (this.inputState.movement.up) y -= 1;
        if (this.inputState.movement.down) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        this.inputState.movement.vector = { x, y };

        // Update action states
        this.inputState.actions[Actions.COLLECTING] = this.keys.collect.isDown;
        this.inputState.actions[Actions.CUTTING] = this.keys.cut.isDown;
        this.inputState.actions[Actions.MINING] = this.keys.mine.isDown;
        this.inputState.actions[Actions.FISHING] = this.keys.fish.isDown;
        this.inputState.actions[Actions.WATERING] = this.keys.water.isDown;
        this.inputState.actions[Actions.PIERCING] = this.keys.pierce.isDown;
        this.inputState.actions[Actions.HIT] = this.keys.hit.isDown;
        this.inputState.actions[Actions.DEATH] = this.keys.death.isDown;

        // Check for carry toggle
        if (Phaser.Input.Keyboard.JustDown(this.keys.carry)) {
            this.player.toggleCarrying(); // Call the toggle method
        }
    }

    isMoving() {
        return this.inputState.movement.vector.x !== 0 || this.inputState.movement.vector.y !== 0;
    }

    isRunning() {
        // Could add a run modifier key (e.g., shift) here
        return this.isMoving();
    }

    getMovementVector() {
        return this.inputState.movement.vector;
    }

    getMovementDirection() {
        const { x, y } = this.inputState.movement.vector;
        
        // Return the primary direction based on the strongest component
        if (Math.abs(x) > Math.abs(y)) {
            return x > 0 ? 'right' : 'left';
        } else if (y !== 0) {
            return y > 0 ? 'down' : 'up';
        }
        
        return null;
    }

    isActionPressed(actionName) {
        return this.inputState.actions[actionName] || false;
    }
} 