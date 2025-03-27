import { GameController } from '../controllers/GameController';
import { Player } from '../models/Player';
import { NPC } from '../models/NPC';
import { Dungeon } from '../models/Dungeon';
import { PlayerView } from './PlayerView';
import { NPCView } from './NPCView';

// Create a more specific type for our scene objects
interface GameObject {
  setOrigin(x: number): GameObject;
  setPosition(x: number, y: number): void;
  fillColor?: number;
}

interface SceneCamera {
  startFollow(target: GameObject): void;
  setZoom(zoom: number): void;
  main: SceneCamera;
}

// We need to make the class work with Phaser's scene system
// but we don't want to directly reference Phaser at compile time
export class GameScene {
  private controller: GameController | null = null;
  private dungeonTiles: GameObject[] = [];
  public playerView: PlayerView | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;

  // NPC related properties
  private npcs: NPC[] = [];
  private npcViews: Map<string, NPCView> = new Map();

  // Properties that will be attached at runtime by Phaser
  public scene!: Record<string, unknown>;
  public add!: {
    rectangle(x: number, y: number, width: number, height: number, color: number): GameObject;
  };
  public cameras!: SceneCamera;
  public load!: {
    on(event: string, callback: (err: Error) => void): void;
  };
  public game!: Record<string, unknown>;

  constructor() {
    // Will be initialized by Phaser
  }

  init(): void {
    // Called by Phaser when the scene starts
    this.playerView = new PlayerView(this as unknown as Phaser.Scene);

    // Initialize NPCs
    this.initializeNPCs();
  }

  private initializeNPCs(): void {
    // Create Knight NPC
    const knightNPC = new NPC('Knight', 'Sir Lancelot');
    this.npcs.push(knightNPC);

    // Create Knight NPC view
    const knightView = new NPCView(this as unknown as Phaser.Scene, 'Knight');
    this.npcViews.set(knightNPC.getName(), knightView);
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

  create(): void {
    // TypeScript doesn't know about the scene structure, so we use type assertion
    this.controller = new GameController(this as unknown as GameController['scene']);
    this.controller.init();

    const dungeon = this.controller.dungeon;

    // Create a background
    const size = dungeon.getSize();
    this.add.rectangle(0, 0, size.width, size.height, 0x222222).setOrigin(0);

    // Create dungeon tiles based on the tile map
    for (let y = 0; y < dungeon.getSize().height / dungeon.tileSize; y++) {
      for (let x = 0; x < dungeon.getSize().width / dungeon.tileSize; x++) {
        const tile = dungeon.getTileAt(x, y);
        const tileRect = this.add.rectangle(
          x * dungeon.tileSize,
          y * dungeon.tileSize,
          dungeon.tileSize - 1,
          dungeon.tileSize - 1,
          tile === 1 ? 0x666666 : 0x94836c
        );
        tileRect.setOrigin(0);
        this.dungeonTiles.push(tileRect);
      }
    }

    // Create player at initial position
    const { x, y } = this.controller.player.getPosition();

    // Create player sprite using PlayerView
    if (this.playerView) {
      this.playerSprite = this.playerView.create(x, y);

      // Set up camera to follow player
      this.cameras.main.startFollow(this.playerSprite);
      this.cameras.main.setZoom(1);
    }

    // Create NPCs in the dungeon
    this.createNPCs(dungeon);
  }

  private createNPCs(dungeon: Dungeon): void {
    // Map of NPC positions (can be expanded for more NPCs)
    const npcPositions: Record<string, { x: number; y: number }> = {
      'Sir Lancelot': { x: 5, y: 5 },
    };

    // Place each NPC in the dungeon
    for (const npc of this.npcs) {
      const name = npc.getName();
      const pos = npcPositions[name];

      if (pos) {
        // Ensure the position is walkable
        dungeon.ensureWalkable(pos.x, pos.y);

        // Set the NPC position
        const pixelX = pos.x * dungeon.tileSize + dungeon.tileSize / 2;
        const pixelY = pos.y * dungeon.tileSize + dungeon.tileSize / 2;
        npc.setPosition(pixelX, pixelY);

        // Get the view for this NPC
        const npcView = this.npcViews.get(name);

        if (npcView) {
          // Create the sprite - directly use the creation result
          npcView.create(pixelX, pixelY);

          // Animation playing is handled by NPCView's internal animation check
          // No need for setTimeout here anymore
        }
      }
    }
  }

  update(): void {
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
