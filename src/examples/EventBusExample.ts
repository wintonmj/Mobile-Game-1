import { IRegistry } from '../services/interfaces/IRegistry';
import { IEventBusService } from '../services/interfaces/IEventBusService';

/**
 * This file provides examples of how to use the EventBusService
 * in different game components.
 */

/**
 * Example: Player Movement
 * Shows how a controller can emit events that services respond to
 */
class PlayerController {
  private eventBus: IEventBusService;

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
  }

  public movePlayer(x: number, y: number): void {
    // Emit movement event
    this.eventBus.emit('player.move', { x, y });
  }
}

/**
 * Example: Movement Service
 * Shows how a service can listen for events from controllers
 * and emit new events based on processing results
 */
interface IPhysicsService {
  moveWithCollision(entity: string, x: number, y: number): boolean;
}

class MovementService {
  private eventBus: IEventBusService;
  private physicsService: IPhysicsService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');
    this.physicsService = registry.getService<IPhysicsService>('physics');

    // Subscribe to movement events
    this.subscriptions.push(
      this.eventBus.on<{ x: number; y: number }>('player.move', this.handlePlayerMove.bind(this))
    );
  }

  private handlePlayerMove(data?: { x: number; y: number }): void {
    if (!data) return;

    // Process movement with physics
    const collision = this.physicsService.moveWithCollision('player', data.x, data.y);

    // Emit result events
    if (collision) {
      this.eventBus.emit('player.collision', { x: data.x, y: data.y });
    } else {
      this.eventBus.emit('player.moved', { x: data.x, y: data.y });
    }
  }

  public cleanup(): void {
    // Unsubscribe from all events when component is destroyed
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

/**
 * Example: Animation System
 * Shows how different components can react to the same events
 */
class AnimationService {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');

    // Subscribe to various events that should trigger animations
    this.subscriptions.push(
      this.eventBus.on<{ x: number; y: number }>(
        'player.moved',
        this.handleMovementAnimation.bind(this)
      ),
      this.eventBus.on<{ x: number; y: number }>(
        'player.collision',
        this.handleCollisionAnimation.bind(this)
      ),
      this.eventBus.on<{ weaponId: string; animationKey: string }>(
        'weapon.used',
        this.handleWeaponAnimation.bind(this)
      ),
      this.eventBus.on<{ entityId: string; damage: number }>(
        'enemy.damaged',
        this.handleDamageAnimation.bind(this)
      )
    );
  }

  private handleMovementAnimation(data?: { x: number; y: number }): void {
    if (!data) return;
    console.log(`Playing movement animation for player at (${data.x}, ${data.y})`);
    // Play movement animation logic
  }

  private handleCollisionAnimation(data?: { x: number; y: number }): void {
    if (!data) return;
    console.log(`Playing collision animation for player at (${data.x}, ${data.y})`);
    // Play collision animation logic
  }

  private handleWeaponAnimation(data?: { weaponId: string; animationKey: string }): void {
    if (!data) return;
    console.log(`Playing weapon animation: ${data.animationKey} for weapon ${data.weaponId}`);
    // Play weapon animation logic
  }

  private handleDamageAnimation(data?: { entityId: string; damage: number }): void {
    if (!data) return;
    console.log(`Playing damage animation for entity ${data.entityId} with damage ${data.damage}`);
    // Play damage animation logic
  }

  public cleanup(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

/**
 * Example: UI Updates
 * Shows how UI components can listen for game state changes
 */
class UIController {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService<IEventBusService>('eventBus');

    // Subscribe to events that should update the UI
    this.subscriptions.push(
      this.eventBus.on<{ health: number; maxHealth: number }>(
        'player.health.changed',
        this.updateHealthBar.bind(this)
      ),
      this.eventBus.on<{ items: Array<{ id: string; count: number }> }>(
        'player.inventory.changed',
        this.updateInventory.bind(this)
      ),
      this.eventBus.on<{ score: number }>('game.score.changed', this.updateScore.bind(this))
    );
  }

  private updateHealthBar(data?: { health: number; maxHealth: number }): void {
    if (!data) return;
    console.log(`Updating health bar: ${data.health}/${data.maxHealth}`);
    // Update health bar UI logic
  }

  private updateInventory(data?: { items: Array<{ id: string; count: number }> }): void {
    if (!data) return;
    console.log(`Updating inventory with ${data.items.length} items`);
    // Update inventory UI logic
  }

  private updateScore(data?: { score: number }): void {
    if (!data) return;
    console.log(`Updating score: ${data.score}`);
    // Update score UI logic
  }

  public cleanup(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

/**
 * Example of how to setup and use these components
 */
export class GameSystem {
  private playerController: PlayerController;
  private movementService: MovementService;
  private animationService: AnimationService;
  private uiController: UIController;

  constructor(registry: IRegistry) {
    // Initialize components
    this.playerController = new PlayerController(registry);
    this.movementService = new MovementService(registry);
    this.animationService = new AnimationService(registry);
    this.uiController = new UIController(registry);

    // Example of a game update that triggers multiple systems through events
    this.playerController.movePlayer(10, 20);
  }

  public cleanup(): void {
    // Clean up all subscriptions when game is destroyed
    this.movementService.cleanup();
    this.animationService.cleanup();
    this.uiController.cleanup();
  }
}
