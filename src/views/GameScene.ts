import { GameController } from '../controllers/GameController';
import { Player } from '../models/Player';
import { NPC } from '../models/NPC';
import { Dungeon } from '../models/Dungeon';
import { PlayerView } from './PlayerView';
import { NPCView } from './NPCView';
import { IRegistry } from '../services/interfaces/IRegistry';
import { LifecycleManager } from '../services/LifecycleManager';
import { ServiceStatus } from '../services/interfaces/ServiceStatus';

// Define a global window extension with the gameRegistry property
interface GameWindow extends Window {
  gameRegistry: IRegistry;
}

// Define Phaser types
interface PhaserScene {
  key: string;
  add: {
    rectangle(x: number, y: number, width: number, height: number, color: number): any;
    sprite(x: number, y: number, key: string): any;
  };
  cameras: {
    main: {
      startFollow(target: any): void;
      setZoom(zoom: number): void;
    };
  };
  load: {
    on(event: string, callback: (err: Error) => void): void;
    spritesheet(key: string, url: string, config: any): void;
  };
  game: any;
  scene: any;
}

// We need to make the class work with Phaser's scene system
export class GameScene implements PhaserScene {
  private playerView: PlayerView | null = null;
  private playerSprite: any | null = null;
  private controller: GameController | null = null;
  private lifecycleManager: LifecycleManager | null = null;
  private dungeonTiles: any[] = [];
  private npcs: NPC[] = [];
  private npcViews: Map<string, NPCView> = new Map();

  // Properties that will be attached at runtime by Phaser
  public key: string;
  public add!: PhaserScene['add'];
  public cameras!: PhaserScene['cameras'];
  public load!: PhaserScene['load'];
  public game!: any;
  public scene!: any;

  constructor() {
    this.key = 'GameScene';
  }

  async init(): Promise<void> {
    // Get the registry from the window global
    const registry = ((window as unknown) as GameWindow).gameRegistry;
    if (!registry) {
      throw new Error('Game registry not found');
    }

    // Initialize lifecycle manager
    this.lifecycleManager = LifecycleManager.getInstance();
    await this.lifecycleManager.initialize(this as unknown as any);

    // Initialize player view
    this.playerView = new PlayerView(this as unknown as any);

    // Initialize NPCs
    this.initializeNPCs();
  }

  async create(): Promise<void> {
    // Get the registry from the window global
    const registry = ((window as unknown) as GameWindow).gameRegistry;
    if (!registry) {
      throw new Error('Game registry not found');
    }

    if (!this.lifecycleManager) {
      throw new Error('Lifecycle manager not initialized');
    }

    // Start all lifecycle services
    await this.lifecycleManager.start();

    // Initialize game controller
    const controller = new GameController(
      this as unknown as GameController['scene'],
      undefined, // Use default dungeon
      registry // Pass the registry to enable EventBus
    );

    if (!controller || !controller.init) {
      throw new Error('Game controller not initialized');
    }

    this.controller = controller;
    this.controller.init();

    const dungeon = this.controller.dungeon;

    // Create a background
    const size = dungeon.getSize();
    this.add.rectangle(0, 0, size.width, size.height, 0x222222).setOrigin(0);

    // Create dungeon tiles based on the tile map
    const tilesX = Math.floor(size.width / dungeon.tileSize);
    const tilesY = Math.floor(size.height / dungeon.tileSize);

    // Clear any existing tiles
    this.dungeonTiles = [];

    // Create new tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tile = dungeon.getTileAt(x, y);
        const tileRect = this.add.rectangle(
          x * dungeon.tileSize,
          y * dungeon.tileSize,
          dungeon.tileSize - 1,
          dungeon.tileSize - 1,
          tile === 1 ? 0x666666 : 0x94836c
        );
        tileRect.setOrigin(0);
        this.dungeonTiles.push(tileRect as any);
      }
    }

    // Create player at initial position
    const { x, y } = this.controller.player.getPosition();

    // Create player sprite using PlayerView
    if (this.playerView) {
      this.playerSprite = this.playerView.create(x, y);

      // Set up camera to follow player
      this.cameras.main.startFollow(this.playerSprite);
    }

    // Always set zoom, even if there's no player
    this.cameras.main.setZoom(1);

    // Create NPCs in the dungeon
    this.createNPCs(dungeon);
  }

  async pause(): Promise<void> {
    if (this.lifecycleManager) {
      await this.lifecycleManager.pause();
    }
  }

  async resume(): Promise<void> {
    if (this.lifecycleManager) {
      await this.lifecycleManager.resume();
    }
  }

  async shutdown(): Promise<void> {
    if (this.lifecycleManager) {
      await this.lifecycleManager.stop();
    }
  }

  async destroy(): Promise<void> {
    // Clean up resources
    this.dungeonTiles = [];
    this.npcs = [];
    this.npcViews.clear();
    this.playerView = null;
    this.playerSprite = null;
    this.controller = null;
    this.lifecycleManager = null;
  }

  private initializeNPCs(): void {
    // Create Knight NPCs
    const knightNPC1 = new NPC('Knight', 'Sir Lancelot');
    const knightNPC2 = new NPC('Knight', 'Sir Galahad');
    const knightNPC3 = new NPC('Knight', 'Sir Gawain');
    const knightNPC4 = new NPC('Knight', 'Sir Percival');

    this.npcs.push(knightNPC1);
    this.npcs.push(knightNPC2);
    this.npcs.push(knightNPC3);
    this.npcs.push(knightNPC4);

    // Create Knight NPC views
    this.npcViews.set(knightNPC1.getName(), new NPCView(this as unknown as Phaser.Scene, 'Knight'));
    this.npcViews.set(knightNPC2.getName(), new NPCView(this as unknown as Phaser.Scene, 'Knight'));
    this.npcViews.set(knightNPC3.getName(), new NPCView(this as unknown as Phaser.Scene, 'Knight'));
    this.npcViews.set(knightNPC4.getName(), new NPCView(this as unknown as Phaser.Scene, 'Knight'));
  }

  preload(): void {
    // Preload assets
    this.load.on('error', (err: Error) => {
      console.error('Load error:', err);
    });

    // Preload player assets
    if (this.playerView) {
      this.playerView.preload();
    }

    // Preload NPC assets
    for (const npcView of this.npcViews.values()) {
      npcView.preload();
    }
  }

  private createNPCs(_dungeon: Dungeon): void {
    if (!this.controller) return;

    // Register NPCs with the placement controller
    const placementController = this.controller.objectPlacementController;
    if (!placementController) return;

    // Place each NPC in the dungeon using the placement controller
    for (const npc of this.npcs) {
      // Register the NPC with the placement controller
      placementController.registerObject(npc);

      // Place the NPC in a valid position
      placementController.placeObject(npc);

      // Get the NPC's position after placement
      const position = npc.getPosition();
      const name = npc.getName();

      // Get the view for this NPC
      const npcView = this.npcViews.get(name);

      if (npcView) {
        // Create the sprite with the properly placed position
        npcView.create(position.x, position.y);
      }
    }
  }

  update(time: number, delta: number): void {
    if (this.lifecycleManager) {
      // Let lifecycle manager handle service updates
      this.lifecycleManager.update(time, delta);
    }

    if (this.controller) {
      this.controller.update();
    }
  }

  updatePlayerSprite(player: Player): void {
    // Update player sprite position and animation
    const position = player.getPosition();
    const direction = player.getDirection();
    const action = player.getCurrentAction();

    if (this.playerView && this.playerSprite) {
      this.playerView.update(position.x, position.y, direction, action);
    }
  }
}
