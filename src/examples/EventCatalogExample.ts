/**
 * This example demonstrates how to use the standardized event catalog
 * for consistent event naming and communication throughout the application.
 */

import { IRegistry } from '../services/interfaces/IRegistry';
import { IEventBusService } from '../services/interfaces/IEventBusService';
import { GameEvents } from '../events/GameEvents';
import { 
  PlayerMovedEventData, 
  PlayerActionEventData, 
  DirectionChangedEventData,
  GameInitializedEventData
} from '../events/GameEvents';

/**
 * Example: Player position tracking component that uses the event catalog
 */
export class PlayerTracker {
  private eventBus: IEventBusService;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private playerPosition: PlayerMovedEventData | null = null;
  private playerDirection: string = 'down';
  private playerAction: string = 'idle';

  constructor(registry: IRegistry) {
    // Get the event bus from the registry
    this.eventBus = registry.getService<IEventBusService>('eventBus');

    // Subscribe to player events using the standardized event names
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    // Player movement
    this.subscriptions.push(
      this.eventBus.on<PlayerMovedEventData>(
        GameEvents.PLAYER.MOVED, 
        this.handlePlayerMoved.bind(this)
      )
    );

    // Player direction
    this.subscriptions.push(
      this.eventBus.on<DirectionChangedEventData>(
        GameEvents.PLAYER.DIRECTION_CHANGED, 
        this.handleDirectionChanged.bind(this)
      )
    );

    // Player action
    this.subscriptions.push(
      this.eventBus.on<PlayerActionEventData>(
        GameEvents.PLAYER.ACTION_CHANGED, 
        this.handleActionChanged.bind(this)
      )
    );

    // Game initialization
    this.subscriptions.push(
      this.eventBus.on<GameInitializedEventData>(
        GameEvents.GAME.INITIALIZED, 
        this.handleGameInitialized.bind(this)
      )
    );
  }

  private handlePlayerMoved(data?: PlayerMovedEventData): void {
    if (!data) return;
    this.playerPosition = data;
    console.log(`Player moved to: (${data.x}, ${data.y}), tile: (${data.tileX}, ${data.tileY})`);
  }

  private handleDirectionChanged(data?: DirectionChangedEventData): void {
    if (!data) return;
    this.playerDirection = data.direction;
    console.log(`Player facing: ${data.direction}`);
  }

  private handleActionChanged(data?: PlayerActionEventData): void {
    if (!data) return;
    this.playerAction = data.action;
    console.log(`Player action: ${data.action} (${data.isInterruptible ? 'Interruptible' : 'Non-interruptible'})`);
  }

  private handleGameInitialized(data?: GameInitializedEventData): void {
    if (!data) return;
    console.log(`Game initialized with player at: (${data.playerPosition.x}, ${data.playerPosition.y})`);
    if (data.dungeonSize) {
      console.log(`Dungeon size: ${data.dungeonSize.width}x${data.dungeonSize.height}`);
    }
  }

  /**
   * Example of emitting an event with properly typed event data
   */
  public teleportPlayer(x: number, y: number): void {
    const tileSize = 32; // Assuming standard tile size
    const teleportData: PlayerMovedEventData = {
      x,
      y,
      tileX: Math.floor(x / tileSize),
      tileY: Math.floor(y / tileSize)
    };
    
    // Emit the teleported event with properly structured data
    this.eventBus.emit(GameEvents.PLAYER.TELEPORTED, teleportData);
    console.log(`Player teleported to: (${x}, ${y})`);
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  public destroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Get current player state
   */
  public getPlayerState(): {
    position: PlayerMovedEventData | null;
    direction: string;
    action: string;
  } {
    return {
      position: this.playerPosition,
      direction: this.playerDirection,
      action: this.playerAction
    };
  }
}

/**
 * Example: Usage with registry
 */
export function createPlayerTracker(registry: IRegistry): PlayerTracker {
  return new PlayerTracker(registry);
} 