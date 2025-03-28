import { jest } from '@jest/globals';
import { AssetService } from '../../services/AssetService';
import { AssetType, CachePolicy } from '../../types/assets';
import { IRegistry } from '../../services/interfaces/IRegistry';
import { 
  advanceTimersAndRunMicrotasks, 
  runAllTimersAndMicrotasks,
  waitForCondition,
  withFakeTimers,
  waitForTime,
  setupFakeTimers,
  restoreRealTimers,
  TimerError
} from '../helpers/timerTestUtils';
import { EventBusService } from '../../services/EventBusService';

describe('AssetService', () => {
  let assetService: AssetService;
  let mockScene: any;
  let mockRegistry: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Mock Phaser loader and registry
    mockScene = {
      load: {
        image: jest.fn(),
        spritesheet: jest.fn(),
        atlas: jest.fn(),
        audio: jest.fn(),
        json: jest.fn(),
        bitmapFont: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        start: jest.fn(),
      },
      textures: {
        get: jest.fn().mockReturnValue({}),
        exists: jest.fn().mockReturnValue(false),
      },
      sound: {
        add: jest.fn().mockReturnValue({}),
      },
      cache: {
        json: {
          get: jest.fn().mockReturnValue({}),
        },
      },
    };

    // Mock EventBusService
    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      once: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    };

    mockRegistry = {
      getService: jest.fn().mockReturnValue(mockEventBus),
    };

    assetService = new AssetService(mockScene, mockRegistry);
  });

  describe('Asset Registration', () => {
    test('should register a single asset', () => {
      // Arrange & Act
      assetService.registerAsset('player', 'assets/player.png', AssetType.IMAGE);

      // Assert
      expect(assetService.getTotalAssetCount()).toBe(1);
      expect(assetService.getAssetInfo('player')).toEqual(
        expect.objectContaining({
          key: 'player',
          path: 'assets/player.png',
          type: AssetType.IMAGE,
          loaded: false,
        })
      );
    });

    test('should handle duplicate asset registration', () => {
      // Arrange
      assetService.registerAsset('player', 'assets/player.png', AssetType.IMAGE);

      // Act - try to register again with same key
      assetService.registerAsset('player', 'assets/player_alt.png', AssetType.IMAGE);

      // Assert
      expect(assetService.getTotalAssetCount()).toBe(1);
      expect(assetService.getAssetInfo('player')?.path).toBe('assets/player.png');
    });

    test('should throw error for invalid asset type', () => {
      // Act & Assert
      expect(() => {
        assetService.registerAsset('player', 'assets/player.png', 'invalid-type' as AssetType);
      }).toThrow();
    });

    test('should emit event when registering asset', () => {
      // Arrange & Act
      assetService.registerAsset('player', 'assets/player.png', AssetType.IMAGE);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'asset.state.changed',
        expect.objectContaining({
          key: 'player',
          previousState: 'unregistered',
          newState: 'registered',
        })
      );
    });
  });

  describe('Asset Registration - Multiple', () => {
    test('should register multiple assets', () => {
      // Arrange
      const assets = [
        { key: 'player', path: 'assets/player.png', type: AssetType.IMAGE },
        { key: 'enemy', path: 'assets/enemy.png', type: AssetType.IMAGE },
        { key: 'music', path: 'assets/music.mp3', type: AssetType.AUDIO },
      ];

      // Act
      assetService.registerMultiple(assets);

      // Assert
      expect(assetService.getTotalAssetCount()).toBe(3);
      expect(assetService.getAssetInfo('player')).not.toBeNull();
      expect(assetService.getAssetInfo('enemy')).not.toBeNull();
      expect(assetService.getAssetInfo('music')).not.toBeNull();
    });

    test('should throw error if assets parameter is not an array', () => {
      // Act & Assert
      expect(() => {
        assetService.registerMultiple('not-an-array' as any);
      }).toThrow();
    });

    test('should handle cache policy in bulk registration', () => {
      // Arrange
      const assets = [
        {
          key: 'player',
          path: 'assets/player.png',
          type: AssetType.IMAGE,
          cachePolicy: CachePolicy.LEVEL,
        },
        {
          key: 'music',
          path: 'assets/music.mp3',
          type: AssetType.AUDIO,
          cachePolicy: CachePolicy.SESSION,
        },
      ];

      // Act
      assetService.registerMultiple(assets);

      // Assert
      expect(assetService.getAssetInfo('player')?.cachePolicy).toBe(CachePolicy.LEVEL);
      expect(assetService.getAssetInfo('music')?.cachePolicy).toBe(CachePolicy.SESSION);
    });

    test('should continue processing even if one asset fails', () => {
      // Arrange
      const assets = [
        { key: 'player', path: 'assets/player.png', type: AssetType.IMAGE },
        { key: 'invalid', path: 'assets/invalid.png', type: 'invalid-type' as AssetType },
        { key: 'music', path: 'assets/music.mp3', type: AssetType.AUDIO },
      ];

      // Spy on console.error to suppress output during test
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      assetService.registerMultiple(assets);

      // Assert
      expect(assetService.getTotalAssetCount()).toBe(2);
      expect(assetService.getAssetInfo('player')).not.toBeNull();
      expect(assetService.getAssetInfo('invalid')).toBeNull();
      expect(assetService.getAssetInfo('music')).not.toBeNull();
    });
  });

  describe('Asset Registry Query Methods', () => {
    beforeEach(() => {
      // Register some test assets
      assetService.registerMultiple([
        { key: 'player', path: 'assets/player.png', type: AssetType.IMAGE },
        { key: 'enemy', path: 'assets/enemy.png', type: AssetType.IMAGE },
        { key: 'music', path: 'assets/music.mp3', type: AssetType.AUDIO },
      ]);
    });

    test('should get total asset count', () => {
      expect(assetService.getTotalAssetCount()).toBe(3);
    });

    test('should get loaded asset count', () => {
      // Initially no assets are loaded
      expect(assetService.getLoadedAssetCount()).toBe(0);

      // Manually mark an asset as loaded for testing
      const playerAsset = assetService.getAssetInfo('player');
      if (playerAsset) {
        playerAsset.loaded = true;
      }

      // Check count again
      expect(assetService.getLoadedAssetCount()).toBe(1);
    });

    test('should check if asset is loaded', () => {
      // Initially not loaded
      expect(assetService.isLoaded('player')).toBe(false);

      // Manually mark asset as loaded
      const playerAsset = assetService.getAssetInfo('player');
      if (playerAsset) {
        playerAsset.loaded = true;
      }

      // Check again
      expect(assetService.isLoaded('player')).toBe(true);
    });

    test('should return null for non-existent asset info', () => {
      expect(assetService.getAssetInfo('non-existent')).toBeNull();
    });

    test('should return loading status', () => {
      // Simulate an asset in loading state
      const loadingPromises = (assetService as any).loadingPromises;
      loadingPromises.set('player', new Promise(() => {}));

      // Get loading status
      const status = assetService.getLoadingStatus();

      // Verify status
      expect(status.total).toBe(3);
      expect(status.loaded).toBe(0);
      expect(status.inProgress).toEqual(['player']);
    });
  });

  describe('EventBus Integration', () => {
    test('should handle missing EventBusService gracefully', () => {
      // Arrange
      const mockDisconnectedRegistry = {
        getService: jest.fn<() => never>().mockImplementation(() => {
          throw new Error('Service not found');
        }),
        registerService: jest.fn<() => void>(),
        hasService: jest.fn<() => boolean>(),
        unregisterService: jest.fn<() => void>(),
        clear: jest.fn<() => void>(),
        registerDependencies: jest.fn<() => void>(),
        getServiceDependencies: jest.fn<() => string[]>().mockReturnValue([]),
        initialize: jest.fn<() => Promise<void>>().mockResolvedValue(void 0),
        shutdown: jest.fn<() => Promise<void>>().mockResolvedValue(void 0),
        initializeBasicServices: jest.fn<() => void>(),
      } as unknown as IRegistry;

      const disconnectedService = new AssetService(mockScene, mockDisconnectedRegistry);

      // Verify initially disconnected
      expect(disconnectedService.isEventBusAvailable()).toBe(false);

      // Act - attempt reconnection
      const reconnected = disconnectedService.reconnectEventBus(mockRegistry);

      // Assert
      expect(reconnected).toBe(true);
      expect(disconnectedService.isEventBusAvailable()).toBe(true);
    });

    test('should provide event subscriptions', () => {
      // Arrange
      const mockCallback = jest.fn();

      // Act
      const subscription = assetService.subscribe('asset.memory.warning', mockCallback);

      // Assert
      expect(mockEventBus.on).toHaveBeenCalledWith('asset.memory.warning', expect.any(Function));
      expect(subscription).not.toBeNull();
    });

    test('should maintain event history', () => {
      // Arrange & Act
      // Force emit an event via private method
      (assetService as any).emitEvent('asset.state.changed', {
        key: 'test',
        previousState: 'unregistered',
        newState: 'registered',
      });

      // Assert
      const history = assetService.getEventHistory();
      expect(history.length).toBe(1);
      expect(history[0].event).toBe('asset.state.changed');
      expect(history[0].data.key).toBe('test');
    });
  });
});
