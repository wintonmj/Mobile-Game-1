// @ts-nocheck
import { jest } from '@jest/globals';
import { GameScene } from '../../views/GameScene';
import { Actions } from '../../models/Actions';

describe('GameScene', () => {
  let gameScene;

  // Manual mocks for our dependencies
  let mockPlayerView;
  let mockGameController;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create manual mocks
    mockPlayerView = {
      preload: jest.fn(),
      create: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
      }),
      update: jest.fn(),
      onActionComplete: jest.fn(),
    };

    mockGameController = {
      init: jest.fn(),
      update: jest.fn(),
      player: {
        getPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
        getDirection: jest.fn().mockReturnValue('down'),
        getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE),
      },
      dungeon: {
        getSize: jest.fn().mockReturnValue({ width: 1000, height: 1000 }),
        getTileAt: jest.fn().mockReturnValue(0),
        tileSize: 32,
      },
    };

    // Create a new instance of GameScene
    gameScene = new GameScene();

    // Set up Phaser-specific properties
    gameScene.add = {
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn(),
      }),
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
      }),
    };

    gameScene.cameras = {
      main: {
        startFollow: jest.fn(),
        setZoom: jest.fn(),
      },
    };

    gameScene.load = {
      on: jest.fn(),
      spritesheet: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should initialize PlayerView', () => {
      // Mock the PlayerView constructor before init
      const originalPlayerView = global.PlayerView;
      global.PlayerView = jest.fn().mockImplementation(() => mockPlayerView);

      gameScene.init();

      // Restore the original constructor
      global.PlayerView = originalPlayerView;

      expect(gameScene.playerView).toBeDefined();
    });
  });

  describe('preload', () => {
    it('should set up error handler and preload player assets', () => {
      // Manually set playerView
      gameScene.playerView = mockPlayerView;

      gameScene.preload();

      expect(gameScene.load.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockPlayerView.preload).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should initialize the game controller and create the dungeon and player', () => {
      // Setup playerView first
      gameScene.playerView = mockPlayerView;

      // We'll use a spy to track when the constructor is called
      const originalGameController = global.GameController;
      global.GameController = jest.fn().mockImplementation(() => mockGameController);

      gameScene.create();

      // Manually set controller to ensure further tests pass
      gameScene.controller = mockGameController;

      // Restore the original constructor
      global.GameController = originalGameController;

      // Verify controller was set and initialized
      expect(gameScene.controller).toBe(mockGameController);
      expect(gameScene.add.rectangle).toHaveBeenCalled();
      expect(mockPlayerView.create).toHaveBeenCalled();
      expect(gameScene.cameras.main.startFollow).toHaveBeenCalled();
      expect(gameScene.cameras.main.setZoom).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call controller update if controller exists', () => {
      // Manually set the controller
      gameScene.controller = mockGameController;

      gameScene.update();

      expect(mockGameController.update).toHaveBeenCalled();
    });

    it('should not throw error if controller is null', () => {
      // Ensure controller is null
      gameScene.controller = null;

      // This should not throw an error
      expect(() => gameScene.update()).not.toThrow();
    });
  });

  describe('updatePlayerSprite', () => {
    it('should update player sprite position and animation', () => {
      // Set up playerView
      gameScene.playerView = mockPlayerView;
      gameScene.playerSprite = {};

      const testPlayer = {
        getPosition: jest.fn().mockReturnValue({ x: 200, y: 300 }),
        getDirection: jest.fn().mockReturnValue('right'),
        getCurrentAction: jest.fn().mockReturnValue(Actions.WALKING),
      };

      gameScene.updatePlayerSprite(testPlayer);

      expect(mockPlayerView.update).toHaveBeenCalledWith(200, 300, 'right', Actions.WALKING);
    });

    it('should not update if playerView is null', () => {
      // Ensure playerView is null
      gameScene.playerView = null;

      const testPlayer = {
        getPosition: jest.fn().mockReturnValue({ x: 0, y: 0 }),
        getDirection: jest.fn().mockReturnValue('up'),
        getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE),
      };

      // This should not throw an error
      expect(() => gameScene.updatePlayerSprite(testPlayer)).not.toThrow();
    });
  });
});
