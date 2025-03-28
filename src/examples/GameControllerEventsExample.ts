import { IRegistry } from '../services/interfaces/IRegistry';
import { IEventBusService } from '../services/interfaces/IEventBusService';
import { GameEvents } from '../controllers/GameController';
import { Actions } from '../models/Actions';

/**
 * This file demonstrates how to use the GameController events pattern.
 */

/**
 * Example: UI that updates based on player position
 */
class MinimapUI {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private playerPosition: { x: number, y: number, tileX: number, tileY: number } | null = null;

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService('eventBus') as IEventBusService;

    // Subscribe to player position events
    this.subscriptions.push(
      this.eventBus.on(GameEvents.PLAYER.MOVED, this.handlePlayerMoved.bind(this))
    );

    // Subscribe to game initialization to set initial state
    this.subscriptions.push(
      this.eventBus.on(GameEvents.GAME.INITIALIZED, this.handleGameInitialized.bind(this))
    );
  }

  private handlePlayerMoved(data?: { x: number, y: number, tileX: number, tileY: number }): void {
    if (!data) return;
    this.playerPosition = data;
    this.updateMinimapDisplay();
  }

  private handleGameInitialized(data?: { playerPosition: { x: number, y: number } }): void {
    if (!data || !data.playerPosition) return;
    
    // Set initial position
    this.playerPosition = {
      ...data.playerPosition,
      tileX: Math.floor(data.playerPosition.x / 32), // Assuming tileSize is 32
      tileY: Math.floor(data.playerPosition.y / 32)
    };
    this.updateMinimapDisplay();
  }

  private updateMinimapDisplay(): void {
    if (!this.playerPosition) return;
    
    console.log(`Minimap: Player at tile (${this.playerPosition.tileX}, ${this.playerPosition.tileY})`);
    // Update minimap display logic
  }

  public cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

/**
 * Example: Animation controller that responds to player actions
 */
class PlayerAnimationController {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private currentAnimation: string = 'idle';

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService('eventBus') as IEventBusService;

    // Subscribe to player action and direction changes
    this.subscriptions.push(
      this.eventBus.on(GameEvents.PLAYER.ACTION_CHANGED, this.handleActionChanged.bind(this))
    );
    
    this.subscriptions.push(
      this.eventBus.on(GameEvents.PLAYER.DIRECTION_CHANGED, this.handleDirectionChanged.bind(this))
    );
  }

  private handleActionChanged(data?: { action: Actions, isInterruptible: boolean }): void {
    if (!data) return;
    
    console.log(`Player animation changed to: ${data.action}`);
    this.currentAnimation = data.action;
    this.updateAnimation();
  }

  private handleDirectionChanged(data?: { direction: string }): void {
    if (!data) return;
    
    console.log(`Player direction changed to: ${data.direction}`);
    // Update animation direction
    this.updateAnimation();
  }

  private updateAnimation(): void {
    // Play appropriate animation based on current state
    console.log(`Playing animation: ${this.currentAnimation}`);
  }

  public cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

/**
 * Example: Sound effects controller
 */
class SoundEffectsController {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  constructor(registry: IRegistry) {
    this.eventBus = registry.getService('eventBus') as IEventBusService;

    // Subscribe to collision and action events for sound effects
    this.subscriptions.push(
      this.eventBus.on(GameEvents.PLAYER.COLLISION, this.handleCollision.bind(this))
    );
    
    this.subscriptions.push(
      this.eventBus.on(GameEvents.PLAYER.ACTION_CHANGED, this.handleActionChanged.bind(this))
    );
  }

  private handleCollision(data?: { direction: string }): void {
    if (!data) return;
    
    console.log(`Playing collision sound for direction: ${data.direction}`);
    // Play collision sound effect
  }

  private handleActionChanged(data?: { action: Actions }): void {
    if (!data) return;
    
    // Only play sounds for certain actions
    switch (data.action) {
      case Actions.MINING:
        console.log('Playing mining sound effect');
        break;
      case Actions.CUTTING:
        console.log('Playing cutting sound effect');
        break;
      case Actions.FISHING:
        console.log('Playing fishing sound effect');
        break;
      case Actions.WATERING:
        console.log('Playing watering sound effect');
        break;
    }
  }

  public cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

/**
 * Example: Usage with game initialization
 */
export class GameEventsExample {
  private minimapUI: MinimapUI;
  private playerAnimations: PlayerAnimationController;
  private soundEffects: SoundEffectsController;

  constructor(registry: IRegistry) {
    // Initialize the components that use event subscriptions
    this.minimapUI = new MinimapUI(registry);
    this.playerAnimations = new PlayerAnimationController(registry);
    this.soundEffects = new SoundEffectsController(registry);

    console.log('All game event subscribers initialized');
  }

  public cleanup(): void {
    // Clean up all subscriptions when game is destroyed
    this.minimapUI.cleanup();
    this.playerAnimations.cleanup();
    this.soundEffects.cleanup();
  }
} 