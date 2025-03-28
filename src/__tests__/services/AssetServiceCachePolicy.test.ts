import { jest } from '@jest/globals';
import { AssetService } from '../../services/AssetService';
import { AssetType, CachePolicy } from '../../types/assets';
import { IRegistry } from '../../services/interfaces/IRegistry';

describe('AssetService Cache Policy Enforcement', () => {
  let assetService: AssetService;
  let mockScene: any;
  let mockRegistry: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Setup fake timers
    jest.useFakeTimers();

    // Create event handlers map to store callbacks
    const eventHandlers = new Map<string, Array<(data?: any) => void>>();

    // Enhanced mock scene with proper event handling
    mockScene = {
      load: {
        image: jest.fn(),
        on: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
          const [event, callback] = args;
          if (!eventHandlers.has(event)) {
            eventHandlers.set(event, []);
          }
          eventHandlers.get(event)?.push(callback);
        }),
        once: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
          const [event, callback] = args;
          if (!eventHandlers.has(event)) {
            eventHandlers.set(event, []);
          }
          // For once, we'll call the callback immediately and remove it
          callback();
          const handlers = eventHandlers.get(event);
          if (handlers) {
            const index = handlers.indexOf(callback);
            if (index !== -1) {
              handlers.splice(index, 1);
            }
          }
        }),
        off: jest.fn().mockImplementation(function(this: any, ...args: any[]) {
          const [event, callback] = args;
          const handlers = eventHandlers.get(event);
          if (handlers) {
            const index = handlers.indexOf(callback);
            if (index !== -1) {
              handlers.splice(index, 1);
            }
          }
        }),
        start: jest.fn().mockImplementation(() => {
          // Simulate file progress
          const progressHandlers = eventHandlers.get('fileprogress') || [];
          progressHandlers.forEach(handler => {
            handler({ key: 'persistent-asset', percentComplete: 50 });
          });

          // Simulate file complete
          const completeHandlers = eventHandlers.get('filecomplete') || [];
          completeHandlers.forEach(handler => {
            handler('persistent-asset');
          });

          // Simulate load complete
          const loadCompleteHandlers = eventHandlers.get('complete') || [];
          loadCompleteHandlers.forEach(handler => {
            handler();
          });
        }),
      },
      textures: {
        get: jest.fn().mockReturnValue({
          source: [{
            width: 32,
            height: 32
          }]
        }),
        exists: jest.fn().mockReturnValue(true),
      },
    };

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    };

    mockRegistry = {
      getService: jest.fn().mockReturnValue(mockEventBus),
    };

    assetService = new AssetService(mockScene, mockRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should keep persistent assets in cache', async () => {
    console.log('Test started');
    
    // 1. Setup with minimal mocks
    const key = 'persistent-asset';
    
    // 2. Register asset
    assetService.registerAsset(key, 'assets/test.png', AssetType.IMAGE, {
      cachePolicy: CachePolicy.PERSISTENT
    });

    // 3. Load asset and wait for completion
    const loadPromise = assetService.loadAsset(key);
    mockScene.load.start();
    
    // 4. Wait for the promise to resolve
    await loadPromise;

    // 5. Verify initial state
    expect(assetService.isLoaded(key)).toBe(true);

    // 6. Clear assets
    assetService.clearAssets();

    // 7. Verify persistent asset remains
    expect(assetService.isLoaded(key)).toBe(true);
    expect(() => assetService.getTexture(key)).not.toThrow();
    
    console.log('Test completed');
  }, 5000); // Reduced timeout to 5 seconds since we're properly handling events now
}); 