// @ts-nocheck
import { jest } from '@jest/globals';
import { GameScene } from '../../views/GameScene';
import { Actions } from '../../models/Actions';
import { LifecycleManager } from '../../services/LifecycleManager';
import { IRegistry } from '../../services/interfaces/IRegistry';
import { ServiceStatus } from '../../services/interfaces/ServiceStatus';
import { Registry } from '../../services/Registry';
import { GameController } from '../../controllers/GameController';

// Mock Phaser
jest.mock('phaser', () => {
  const mockScene = class Scene {
    constructor(config: any) {
      this.key = config.key;
    }
  };

  return {
    Scene: mockScene,
    GameObjects: {
      Sprite: class Sprite {
        setOrigin() { return this; }
        setPosition() { return this; }
        setScale() { return this; }
        play() { return this; }
        on(event: string, callback: Function) { return this; }
        anims = {
          play: jest.fn(),
          create: jest.fn(),
          generateFrameNumbers: jest.fn().mockReturnValue([])
        };
      },
      Rectangle: class Rectangle {
        setOrigin() { return this; }
        setPosition() { return this; }
      },
      GameObjectFactory: class GameObjectFactory {
        rectangle() { return new mockScene.GameObjects.Rectangle(); }
        sprite() { return new mockScene.GameObjects.Sprite(); }
      }
    },
    Game: class Game {},
    Loader: {
      LoaderPlugin: class LoaderPlugin {
        on() {}
        spritesheet() {}
      }
    },
    Cameras: {
      CameraManager: class CameraManager {
        main = {
          startFollow: jest.fn(),
          setZoom: jest.fn()
        }
      }
    },
    Animations: {
      AnimationManager: class AnimationManager {
        create = jest.fn();
        generateFrameNumbers = jest.fn().mockReturnValue([]);
      }
    }
  };
});

// Mock window object
const mockWindow = {
  gameRegistry: null,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Mock NPC class
class MockNPC {
  private x: number;
  private y: number;
  private name: string;

  constructor(npcType: string, name: string, x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
    this.name = name;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'Knight';
  }

  isInteractable() {
    return true;
  }

  getPlacementConstraints() {
    return [];
  }

  getPlacementPriority() {
    return 5;
  }
}

// Mock GameController constructor
jest.mock('../../controllers/GameController', () => {
  return {
    GameController: jest.fn().mockImplementation(() => {
      return {
        init: jest.fn(),
        dungeon: {
          getSize: jest.fn().mockReturnValue({ width: 992, height: 992 }),
          tileSize: 32,
          getTileAt: jest.fn().mockReturnValue(1)
        },
        player: {
          getPosition: jest.fn().mockReturnValue({ x: 400, y: 300 })
        },
        update: jest.fn()
      };
    })
  };
});

describe('GameScene', () => {
  let gameScene;
  let mockLifecycleManager;
  let mockRegistry;
  let mockNPC;
  let mockPlayerView;
  let mockNPCView;
  let mockGameController;
  let mockObjectPlacementController;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation();

    // Create mock ObjectPlacementController first
    mockObjectPlacementController = {
      registerObject: jest.fn(),
      placeObject: jest.fn(),
      getValidPosition: jest.fn().mockReturnValue({ x: 100, y: 100 })
    };

    // Create mock GameController with all dependencies
    mockGameController = {
      init: jest.fn().mockImplementation(() => {
        // Ensure objectPlacementController is set during initialization
        mockGameController.objectPlacementController = mockObjectPlacementController;
        return Promise.resolve();
      }),
      update: jest.fn(),
      objectPlacementController: mockObjectPlacementController,
      player: {
        getPosition: jest.fn().mockReturnValue({ x: 400, y: 300 }),
        getDirection: jest.fn().mockReturnValue('down'),
        getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE)
      },
      dungeon: {
        getSize: jest.fn().mockReturnValue({ width: 992, height: 992 }), // Multiple of tileSize
        getTileAt: jest.fn().mockReturnValue(0),
        tileSize: 32,
        getRooms: jest.fn().mockReturnValue([]),
        getCurrentRoom: jest.fn().mockReturnValue({
          getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 })
        })
      }
    };

    // Create mock NPC and NPCView
    mockNPC = new MockNPC('Knight', 'testNPC');
    mockNPCView = {
      create: jest.fn(),
      update: jest.fn(),
      preload: jest.fn(),
    };

    // Create mock registry with required methods
    mockRegistry = {
      getService: jest.fn().mockImplementation((serviceName) => {
        if (serviceName === 'gameController') {
          return mockGameController;
        }
        return null;
      }),
      registerService: jest.fn(),
      getServiceStatus: jest.fn().mockReturnValue(ServiceStatus.READY),
    } as IRegistry;

    // Set up the game registry in the window object
    mockWindow.gameRegistry = mockRegistry;

    // Create manual mocks
    mockPlayerView = {
      preload: jest.fn(),
      create: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      update: jest.fn(),
      onActionComplete: jest.fn(),
    };

    // Mock LifecycleManager
    mockLifecycleManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      start: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
    };

    // Mock the getInstance method
    jest.spyOn(LifecycleManager, 'getInstance').mockReturnValue(mockLifecycleManager);

    // Create a new instance of GameScene
    gameScene = new GameScene();
    
    // Add load property to gameScene
    gameScene.load = {
      on: jest.fn(),
      spritesheet: jest.fn(),
    };

    // Add add property to gameScene
    gameScene.add = {
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
    };

    // Add anims property to gameScene
    gameScene.anims = {
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
    };

    // Add cameras property to gameScene
    gameScene.cameras = {
      main: {
        startFollow: jest.fn(),
        setZoom: jest.fn(),
      },
    };
  });

  describe('Initialization', () => {
    it('should have null controller after init()', async () => {
      await gameScene.init();
      expect(gameScene.controller).toBeNull();
    });
  });

  describe('GameScene initialization', () => {
    it('should properly initialize the scene with required dependencies', async () => {
      // Arrange
      // Mock the PlayerView constructor before init
      const originalPlayerView = global.PlayerView;
      global.PlayerView = jest.fn().mockImplementation(() => mockPlayerView);

      // Act
      await gameScene.init();

      // Restore the original constructor
      global.PlayerView = originalPlayerView;

      // Assert
      expect(mockLifecycleManager.initialize).toHaveBeenCalledWith(gameScene);
      expect(gameScene.lifecycleManager).toBeDefined();
      expect(gameScene.playerView).toBeDefined();
      expect(gameScene.controller).toBeNull(); // controller is initialized in create()
    });

    it('should throw error if registry is not found', async () => {
      // Arrange
      mockWindow.gameRegistry = null;

      // Act & Assert
      await expect(gameScene.init()).rejects.toThrow('Game registry not found');
    });
  });

  describe('GameScene preloading', () => {
    it('should preload required assets', () => {
      // Arrange
      gameScene.playerView = mockPlayerView;
      gameScene.npcViews = new Map([
        ['testNPC', mockNPCView]
      ]);

      // Act
      gameScene.preload();

      // Assert
      expect(mockPlayerView.preload).toHaveBeenCalled();
      expect(mockNPCView.preload).toHaveBeenCalled();
      expect(gameScene.load.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle preload errors gracefully', () => {
      // Arrange
      const mockError = new Error('Load error');
      gameScene.load.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          handler(mockError);
        }
      });

      // Act
      gameScene.preload();

      // Assert
      expect(console.error).toHaveBeenCalledWith('Load error:', mockError);
    });
  });

  describe('GameScene world creation', () => {
    it('should create the game world with proper setup', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;

      // Act
      await gameScene.create();

      // Assert
      expect(mockLifecycleManager.start).toHaveBeenCalled();
      expect(GameController).toHaveBeenCalled();
      expect(gameScene.add.rectangle).toHaveBeenCalled();
      expect(gameScene.dungeonTiles.length).toBeGreaterThan(0);
    });

    it('should create dungeon tiles with correct properties', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;

      // Mock dungeon size and tile size
      const mockController = {
        init: jest.fn(),
        dungeon: {
          getSize: jest.fn().mockReturnValue({ width: 992, height: 992 }),
          tileSize: 32,
          getTileAt: jest.fn().mockReturnValue(1)
        },
        player: {
          getPosition: jest.fn().mockReturnValue({ x: 400, y: 300 })
        },
        update: jest.fn()
      };
      (GameController as jest.Mock).mockImplementationOnce(() => mockController);

      // Act
      await gameScene.create();

      // Assert
      const expectedTiles = (992 / 32) * (992 / 32); // 31 * 31 = 961 tiles
      expect(gameScene.dungeonTiles.length).toBe(expectedTiles);
      expect(gameScene.add.rectangle).toHaveBeenCalledTimes(expectedTiles + 1); // +1 for background
    });
  });

  describe('GameScene player creation', () => {
    it('should create and setup the player correctly', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = mockPlayerView;

      // Act
      await gameScene.create();

      // Assert
      expect(mockPlayerView.create).toHaveBeenCalled();
      expect(gameScene.playerSprite).toBeDefined();
    });

    it('should create player at correct position', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = mockPlayerView;

      // Mock player position
      const mockController = {
        init: jest.fn(),
        dungeon: {
          getSize: jest.fn().mockReturnValue({ width: 992, height: 992 }),
          tileSize: 32,
          getTileAt: jest.fn().mockReturnValue(1)
        },
        player: {
          getPosition: jest.fn().mockReturnValue({ x: 400, y: 300 })
        },
        update: jest.fn()
      };
      (GameController as jest.Mock).mockImplementationOnce(() => mockController);

      // Act
      await gameScene.create();

      // Assert
      expect(mockPlayerView.create).toHaveBeenCalledWith(400, 300);
    });

    it('should handle missing playerView gracefully', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = null;

      // Act & Assert
      await expect(gameScene.create()).resolves.not.toThrow();
      expect(gameScene.playerSprite).toBeNull();
    });

    it('should setup camera to follow player', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = mockPlayerView;
      const mockSprite = {
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      };
      mockPlayerView.create.mockReturnValue(mockSprite);

      // Act
      await gameScene.create();

      // Assert
      expect(gameScene.cameras.main.startFollow).toHaveBeenCalledWith(mockSprite);
      expect(gameScene.cameras.main.setZoom).toHaveBeenCalledWith(1);
    });

    it('should handle camera setup without player sprite', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = null;

      // Mock controller to avoid null error
      const mockController = {
        init: jest.fn(),
        dungeon: {
          getSize: jest.fn().mockReturnValue({ width: 992, height: 992 }),
          tileSize: 32,
          getTileAt: jest.fn().mockReturnValue(1)
        },
        player: {
          getPosition: jest.fn().mockReturnValue({ x: 400, y: 300 })
        },
        update: jest.fn()
      };
      (GameController as jest.Mock).mockImplementationOnce(() => mockController);

      // Act
      await gameScene.create();

      // Assert
      expect(gameScene.cameras.main.startFollow).not.toHaveBeenCalled();
      expect(gameScene.cameras.main.setZoom).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should initialize the game controller and create the dungeon and player', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.playerView = mockPlayerView;
      
      // Act
      await gameScene.create();
      
      // Verify the sequence of operations
      expect(GameController).toHaveBeenCalled();
      expect(gameScene.add.rectangle).toHaveBeenCalled();
      expect(mockPlayerView.create).toHaveBeenCalled();
      expect(gameScene.cameras.main.startFollow).toHaveBeenCalled();
      expect(gameScene.cameras.main.setZoom).toHaveBeenCalledWith(1);
    });

    it('should throw error if gameRegistry is not found', async () => {
      // Remove gameRegistry from window
      mockWindow.gameRegistry = null;

      await expect(gameScene.create()).rejects.toThrow('Game registry not found');
    });
  });

  describe('lifecycle methods', () => {
    beforeEach(() => {
      gameScene.lifecycleManager = mockLifecycleManager;
    });

    it('should call pause on lifecycle manager', async () => {
      await gameScene.pause();
      expect(mockLifecycleManager.pause).toHaveBeenCalled();
    });

    it('should call resume on lifecycle manager', async () => {
      await gameScene.resume();
      expect(mockLifecycleManager.resume).toHaveBeenCalled();
    });

    it('should call stop on lifecycle manager', async () => {
      await gameScene.shutdown();
      expect(mockLifecycleManager.stop).toHaveBeenCalled();
    });

    it('should clean up resources on destroy', async () => {
      await gameScene.destroy();
      expect(gameScene.dungeonTiles).toEqual([]);
      expect(gameScene.npcs).toEqual([]);
      expect(gameScene.npcViews.size).toBe(0);
      expect(gameScene.playerView).toBeNull();
      expect(gameScene.playerSprite).toBeNull();
      expect(gameScene.controller).toBeNull();
      expect(gameScene.lifecycleManager).toBeNull();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      gameScene.lifecycleManager = mockLifecycleManager;
      gameScene.controller = mockGameController;
    });

    it('should call lifecycle manager update and controller update', () => {
      // Act
      gameScene.update(1000, 16);

      // Assert
      expect(mockLifecycleManager.update).toHaveBeenCalledWith(1000, 16);
      expect(mockGameController.update).toHaveBeenCalled();
    });

    it('should not throw error if controller is null', () => {
      // Arrange
      gameScene.controller = null;

      // Act & Assert
      expect(() => gameScene.update(1000, 16)).not.toThrow();
      expect(mockLifecycleManager.update).toHaveBeenCalledWith(1000, 16);
    });

    it('should not throw error if lifecycle manager is null', () => {
      // Arrange
      gameScene.lifecycleManager = null;

      // Act & Assert
      expect(() => gameScene.update(1000, 16)).not.toThrow();
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

  describe('GameScene camera setup', () => {
    // ... existing camera setup tests ...
  });

  describe('GameScene error handling', () => {
    it('should throw error if registry is not found', async () => {
      // Arrange
      mockWindow.gameRegistry = null;

      // Act & Assert
      await expect(gameScene.init()).rejects.toThrow('Game registry not found');
    });

    it('should throw error if lifecycle manager is not initialized', async () => {
      // Arrange
      await gameScene.init();
      gameScene.lifecycleManager = null;

      // Act & Assert
      await expect(gameScene.create()).rejects.toThrow('Lifecycle manager not initialized');
    });

    it('should handle missing controller gracefully', async () => {
      // Arrange
      await gameScene.init();
      gameScene.preload();
      gameScene.lifecycleManager = mockLifecycleManager;
      
      // Mock GameController constructor to return null
      (GameController as jest.Mock).mockImplementationOnce(() => null);

      // Act & Assert
      await expect(gameScene.create()).rejects.toThrow('Game controller not initialized');
    });
  });
});
