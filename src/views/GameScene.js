import { GameController } from '../controllers/GameController.js';
import { PlayerView } from './PlayerView.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.controller = null;
        this.playerView = null;
        this.dungeonTiles = [];
    }

    preload() {
        // Create and preload player view
        this.playerView = new PlayerView(this);
        this.playerView.preload();
    }

    create() {
        this.controller = new GameController(this);
        this.controller.init();

        // Create dungeon tiles
        const dungeon = this.controller.dungeon;
        
        // Create a background
        this.add.rectangle(0, 0, 
            dungeon.width * dungeon.tileSize, 
            dungeon.height * dungeon.tileSize, 
            0x222222).setOrigin(0);

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
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

        // Create player sprite at the initial position
        const { x, y } = this.controller.player.getPosition();
        const playerSprite = this.playerView.create(x, y);

        // Set up camera to follow player
        this.cameras.main.startFollow(playerSprite);
        this.cameras.main.setZoom(1);
    }

    update() {
        this.controller.update();
    }

    updatePlayerSprite(player) {
        const playerView = this.playerView;
        if (!playerView) return;

        playerView.update(
            player.x, 
            player.y, 
            player.direction, 
            player.getCurrentAction()
        );
    }
} 