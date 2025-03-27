import Phaser from 'phaser';
import { Actions } from '../models/Actions';
import { Player, Direction } from '../models/Player';

interface Vector2 {
  x: number;
  y: number;
}

interface MovementState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  vector: Vector2;
}

interface ActionState {
  [key: string]: boolean;
}

interface InputState {
  movement: MovementState;
  actions: ActionState;
}

interface Keys {
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  collect: Phaser.Input.Keyboard.Key;
  cut: Phaser.Input.Keyboard.Key;
  mine: Phaser.Input.Keyboard.Key;
  fish: Phaser.Input.Keyboard.Key;
  water: Phaser.Input.Keyboard.Key;
  pierce: Phaser.Input.Keyboard.Key;
  carry: Phaser.Input.Keyboard.Key;
  walk: Phaser.Input.Keyboard.Key;
  hit: Phaser.Input.Keyboard.Key;
  death: Phaser.Input.Keyboard.Key;
  [key: string]: Phaser.Input.Keyboard.Key;
}

export class InputController {
  private scene: Phaser.Scene;
  private player: Player;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private keys: Keys | null;
  private inputState: InputState;

  constructor(scene: Phaser.Scene, player: Player) {
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
        vector: { x: 0, y: 0 }, // Normalized movement vector
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
        [Actions.DEATH]: false,
      },
    };
  }

  public init(): void {
    // Using non-null assertion because we know scene.input.keyboard exists in Phaser
    this.cursors = this.scene.input!.keyboard!.createCursorKeys();

    // Using non-null assertion for the same reason
    this.keys = this.scene.input!.keyboard!.addKeys({
      // Movement
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,

      // Action keys
      collect: Phaser.Input.Keyboard.KeyCodes.E, // Original collect key
      cut: Phaser.Input.Keyboard.KeyCodes.ONE, // 1 for cutting
      mine: Phaser.Input.Keyboard.KeyCodes.TWO, // 2 for mining
      fish: Phaser.Input.Keyboard.KeyCodes.THREE, // 3 for fishing
      water: Phaser.Input.Keyboard.KeyCodes.FOUR, // 4 for watering
      pierce: Phaser.Input.Keyboard.KeyCodes.FIVE, // 5 for piercing
      carry: Phaser.Input.Keyboard.KeyCodes.C, // C for carry toggle
      walk: Phaser.Input.Keyboard.KeyCodes.V, // V for walk toggle
      hit: Phaser.Input.Keyboard.KeyCodes.H, // H for hit
      death: Phaser.Input.Keyboard.KeyCodes.X, // X for death
    }) as Keys;
  }

  public update(): void {
    if (!this.cursors || !this.keys) return;

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

    // Update action states - add safety checks for each key
    this.inputState.actions[Actions.COLLECTING] = this.keys.collect && this.keys.collect.isDown || false;
    this.inputState.actions[Actions.CUTTING] = this.keys.cut && this.keys.cut.isDown || false;
    this.inputState.actions[Actions.MINING] = this.keys.mine && this.keys.mine.isDown || false;
    this.inputState.actions[Actions.FISHING] = this.keys.fish && this.keys.fish.isDown || false;
    this.inputState.actions[Actions.WATERING] = this.keys.water && this.keys.water.isDown || false;
    this.inputState.actions[Actions.PIERCING] = this.keys.pierce && this.keys.pierce.isDown || false;
    this.inputState.actions[Actions.HIT] = this.keys.hit && this.keys.hit.isDown || false;
    this.inputState.actions[Actions.DEATH] = this.keys.death && this.keys.death.isDown || false;

    // Check for carry toggle - add safety check
    if (this.keys.carry && Phaser.Input.Keyboard.JustDown(this.keys.carry)) {
      this.player.toggleCarrying();
    }

    // Check for walk toggle - add safety check
    if (this.keys.walk && Phaser.Input.Keyboard.JustDown(this.keys.walk)) {
      this.player.toggleWalking();
    }
  }

  public isMoving(): boolean {
    return this.inputState.movement.vector.x !== 0 || this.inputState.movement.vector.y !== 0;
  }

  public isRunning(): boolean {
    // Check if the player is in walking mode - if so, we're not running
    return this.isMoving() && !this.player.isWalkingMode();
  }

  public getMovementVector(): Vector2 {
    return this.inputState.movement.vector;
  }

  public getMovementDirection(): Direction | null {
    const { x, y } = this.inputState.movement.vector;

    // Return the primary direction based on the strongest component
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 'right' : 'left';
    } else if (y !== 0) {
      return y > 0 ? 'down' : 'up';
    }

    return null;
  }

  public isActionPressed(actionName: string): boolean {
    return this.inputState.actions[actionName] || false;
  }
}
