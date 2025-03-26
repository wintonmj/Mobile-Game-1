import Phaser from 'phaser';
import { GameController } from '../controllers/GameController';
import { Player, PlayerStatus, Direction } from '../models/Player';
import { ActionAnimations, Actions } from '../models/Actions';
import { DungeonView } from './DungeonView';
import { Dungeon } from '../models/Dungeon';
import { AnimationLoader } from './AnimationLoader';

interface PlayerSprite extends Phaser.GameObjects.Sprite {
  currentAction?: Actions;
  currentDirection?: string;
}

// Define a simple PlayerView interface
interface PlayerView {
  onActionComplete: () => void;
}

export class GameScene extends Phaser.Scene {
  private gameController?: GameController;
  private playerSprite?: PlayerSprite;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private dungeonView?: DungeonView;
  private dungeon?: Dungeon;
  private animationLoader?: AnimationLoader;
  public playerView?: PlayerView;
  private assetsLoaded: boolean = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    // Create animation loader and preload animations
    this.animationLoader = new AnimationLoader(this);
    this.animationLoader.preloadAnimations();
    
    // Log asset loading progress
    this.load.on('progress', (value: number) => {
      // Removed console.log
    });
    
    // Log asset loading errors
    this.load.on('loaderror', (file: any) => {
      // Removed console.error
    });
    
    // Fallback sprite for testing
    this.load.spritesheet('player', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/dude.png', { 
      frameWidth: 32, 
      frameHeight: 48 
    });
    
    // Add event for when loading completes
    this.load.on('complete', () => {
      this.assetsLoaded = true;
      
      // Create animations
      if (this.animationLoader) {
        this.animationLoader.createAnimations();
      }
      
      // Update player sprite texture if it exists
      this.updatePlayerInitialTexture();
      
      // Force update through game controller if it exists
      if (this.gameController && this.playerSprite) {
        this.gameController.update();
      }
    });
  }
  
  private updatePlayerInitialTexture(): void {
    if (this.playerSprite && this.textures.exists('idle_down')) {
      this.playerSprite.setTexture('idle_down');
      // Also set the current action and direction to ensure consistency
      this.playerSprite.currentAction = Actions.IDLE;
      this.playerSprite.currentDirection = 'down';
    } else if (this.playerSprite) {
      // Fallback to any valid texture
      const textureKey = this.getFirstAvailableTexture();
      if (textureKey) {
        this.playerSprite.setTexture(textureKey);
        // Also set appropriate action/direction based on texture
        this.playerSprite.currentAction = Actions.IDLE;
        this.playerSprite.currentDirection = textureKey.includes('_') ? 
          textureKey.split('_').pop() || 'down' : 'down';
      }
    }
  }
  
  private getFirstAvailableTexture(): string {
    // Try standard textures first
    const standardTextures = ['idle_down', 'idle_down_variant_0', 'idle_down_variant_1', 'idle_down_variant_2'];
    for (const textureKey of standardTextures) {
      if (this.textures.exists(textureKey)) {
        return textureKey;
      }
    }
    
    // If no standard textures, try anything that has 'idle'
    const availableTextures = this.textures.getTextureKeys();
    for (const key of availableTextures) {
      if (key.includes('idle') && key !== '__DEFAULT' && key !== '__MISSING') {
        return key;
      }
    }
    
    // Last resort
    return 'player';
  }

  create(): void {
    // Create the game world and controllers
    this.dungeon = new Dungeon();
    
    // Create dungeon view for rendering
    this.dungeonView = new DungeonView(this, this.dungeon);
    this.dungeonView.render();
    
    // Create player sprite
    this.playerSprite = this.add.sprite(400, 300, 'player') as PlayerSprite;
    this.playerSprite.currentAction = Actions.IDLE;
    this.playerSprite.currentDirection = 'down';
    
    // Add a shadow beneath the player
    this.playerShadow = this.add.ellipse(
      400,
      320,
      24,
      8,
      0x000000,
      0.3
    );
    
    // Create player view
    this.playerView = {
      onActionComplete: () => {
        // Will be set by controller later
      }
    };
    
    // Set up fallback animations
    this.createFallbackAnimations();
    
    // Create controllers
    const player = new Player();
    // Initialize game controller with existing parameters based on its constructor
    this.gameController = new GameController(this, this.dungeon);
    this.gameController.init();
    
    // If assets are already loaded, update the player texture immediately
    if (this.assetsLoaded) {
      this.updatePlayerInitialTexture();
      // Force an initial update to make sure everything is properly set
      this.gameController.update();
    }
    
    // Set up debug text
    const debugText = this.add.text(10, 10, 'Use WASD or Arrow Keys to move\nE: Collect, 1-5: Actions, C: Carry, V: Walk', {
      fontSize: '16px',
      color: '#ffffff'
    });
    debugText.setScrollFactor(0);
  }

  // Create fallback animations for when custom animations aren't loaded
  private createFallbackAnimations(): void {
    // Create basic animations for movement
    if (!this.anims.exists('fallback_left')) {
      this.anims.create({
        key: 'fallback_left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists('fallback_turn')) {
      this.anims.create({
        key: 'fallback_turn',
        frames: [ { key: 'player', frame: 4 } ],
        frameRate: 20
      });
    }

    if (!this.anims.exists('fallback_right')) {
      this.anims.create({
        key: 'fallback_right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

  update(): void {
    // Update the game controller
    if (this.gameController) {
      this.gameController.update();
    }
  }
  
  // This method will be called by GameController to update the player sprite
  updatePlayerSprite(player: Player): void {
    if (!this.playerSprite) return;
    
    const position = player.getPosition();
    const direction = player.getDirection();
    const action = player.getCurrentAction();

    // Update sprite position
    this.playerSprite.x = position.x;
    this.playerSprite.y = position.y;
    
    // Update shadow position if it exists
    if (this.playerShadow) {
      this.playerShadow.x = position.x;
      this.playerShadow.y = position.y + 20;
    }
    
    // Update sprite based on action and direction
    this.updatePlayerAnimation(action, direction);
  }

  private updatePlayerAnimation(action: Actions, direction: string): void {
    if (!this.playerSprite) return;

    // Only update animation if something changed
    if (this.playerSprite.currentAction === action && 
        this.playerSprite.currentDirection === direction) {
      return;
    }

    // Store current state
    this.playerSprite.currentAction = action;
    this.playerSprite.currentDirection = direction;

    // Get animation key based on action and direction
    const animKey = `${action}_${direction}`;
    
    // Try several fallback options in order of preference
    const animOptions = [
      animKey,                         // First try exact animation
      `${Actions.IDLE}_${direction}`,  // Fall back to idle in same direction
      'idle_fallback',                 // Custom fallback animation if we created one
      `idle_down_variant_0`,           // Try variant animations
      `idle_down_variant_1`,
      `idle_down_variant_2`,
      'fallback_turn'                  // Last resort is the original placeholder
    ];
    
    // Find the first animation that exists
    const animToPlay = animOptions.find(anim => this.anims.exists(anim));
    
    if (animToPlay) {
      try {
        // If this is a side animation, flip sprite based on direction
        if (direction === 'left') {
          this.playerSprite.setFlipX(true);
        } else {
          this.playerSprite.setFlipX(false);
        }
        
        // Play the animation
        this.playerSprite.play(animToPlay);
      } catch (error) {
        // Last resort - use the placeholder animations
        this.playFallbackAnimation(direction);
      }
    } else {
      this.playFallbackAnimation(direction);
    }

    // For non-movement actions, we need to set a callback for when the animation completes
    if (action !== Actions.IDLE && 
        action !== Actions.MOVING && 
        action !== Actions.WALKING &&
        action !== Actions.CARRY_IDLE && 
        action !== Actions.CARRY_WALK &&
        action !== Actions.CARRY_RUN) {
      
      // Set one-time event for animation completion
      this.playerSprite.once('animationcomplete', () => {
        if (this.playerView?.onActionComplete) {
          this.playerView.onActionComplete();
        }
      });
    }
  }
  
  private playFallbackAnimation(direction: string): void {
    if (!this.playerSprite) return;
    
    // Fallback to basic animations
    if (direction === 'left') {
      this.playerSprite.play('fallback_left');
    } else if (direction === 'right') {
      this.playerSprite.play('fallback_right');
    } else {
      this.playerSprite.play('fallback_turn');
    }
  }
}
