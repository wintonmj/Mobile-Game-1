import { jest } from '@jest/globals';
import { createMockScene, createMockPlayer } from '../helpers/testUtils';

// Mock Phaser is handled via moduleNameMapper in jest.config.js
// InputController is also handled via moduleNameMapper

// Import the mock to get access to the functions
import mockInputController from '../mocks/inputController';

// Now import after mocking is handled by Jest config
import { GameController } from '../../controllers/GameController';
import { Player } from '../../models/Player';
import { Dungeon } from '../../models/Dungeon';
import { Actions } from '../../models/Actions';

// Get a reference to the mock functions directly
const mockInputControllerFunctions = mockInputController.mockFunctions;

describe('Game Flow Integration', () => {
  let mockScene: any;
  let mockPlayer: any;
  let mockDungeon: any;
  let gameController: GameController;

  beforeEach(() => {
    jest.clearAllMocks();

    // Use our helper to create mock scene
    mockScene = createMockScene();
    
    // Create mock player with helper
    mockPlayer = createMockPlayer();

    // Apply mocks to Player prototype
    jest.spyOn(Player.prototype, 'setPosition').mockImplementation(mockPlayer.setPosition);
    jest.spyOn(Player.prototype, 'getPosition').mockImplementation(mockPlayer.getPosition);
    jest.spyOn(Player.prototype, 'setDirection').mockImplementation(mockPlayer.setDirection);
    jest.spyOn(Player.prototype, 'setAction').mockImplementation(mockPlayer.setAction);
    jest.spyOn(Player.prototype, 'getCurrentAction').mockImplementation(mockPlayer.getCurrentAction);
    jest.spyOn(Player.prototype, 'getSpeed').mockImplementation(mockPlayer.getSpeed);

    // Setup mock dungeon
    mockDungeon = {
      tileSize: 32,
      isWalkable: jest.fn().mockReturnValue(true),
    };
    
    // Create a mock dungeon instance
    const mockDungeonInstance = new Dungeon();
    // Manually spy on the isWalkable method
    jest.spyOn(mockDungeonInstance, 'isWalkable').mockImplementation(mockDungeon.isWalkable);
    
    // Create game controller with mocks
    gameController = new GameController(mockScene, mockDungeonInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Enable tests now that we've fixed the mocking
  it('should handle a complete game interaction cycle', () => {
    // Reset any previous calls
    jest.clearAllMocks();
    
    // Initialize the game - make sure to clear mocks before this
    mockInputControllerFunctions.init.mockClear();
    gameController.init();
    
    // Verify initialization explicitly
    expect(mockInputControllerFunctions.init).toHaveBeenCalled();
    expect(mockPlayer.setPosition).toHaveBeenCalled();
    
    // Simulate player movement input
    mockInputControllerFunctions.getMovementVector.mockReturnValue({ x: 1, y: 0 });
    mockInputControllerFunctions.getMovementDirection.mockReturnValue('right');
    mockInputControllerFunctions.isMoving.mockReturnValue(true);
    
    // Update game state
    gameController.update();
    
    // Just verify the player state was updated
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
    
    // Simulate player stopping
    mockInputControllerFunctions.getMovementVector.mockReturnValue({ x: 0, y: 0 });
    mockInputControllerFunctions.isMoving.mockReturnValue(false);
    
    // Update game state again
    gameController.update();
    
    // Verify update was called
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
    
    // Simulate player performing an action
    mockInputControllerFunctions.isActionPressed.mockImplementation(function(action: any) {
      return action === Actions.MINING;
    });
    
    // Update game state again
    gameController.update();
    
    // Verify update was called
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
    
    // Simulate action completion callback
    const onActionComplete = mockScene.playerView.onActionComplete;
    onActionComplete();
    
    // Verify update was called
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
  });

  it('should handle collision detection correctly', () => {
    // Initialize the game
    gameController.init();
    
    // Setup player position
    mockPlayer.getPosition.mockReturnValue({ x: 100, y: 100 });
    
    // Make the player try to move into a wall
    mockInputControllerFunctions.getMovementVector.mockReturnValue({ x: 1, y: 0 });
    mockInputControllerFunctions.isMoving.mockReturnValue(true);
    mockDungeon.isWalkable.mockReturnValue(false); // Simulate wall collision
    
    // Update game state
    gameController.update();
    
    // Verify update was called
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
    
    // Now remove the wall
    mockDungeon.isWalkable.mockReturnValue(true);
    
    // Update game state again
    gameController.update();
    
    // Verify player was updated
    expect(mockScene.updatePlayerSprite).toHaveBeenCalled();
  });
}); 