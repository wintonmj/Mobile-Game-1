# Comprehensive Mocking Strategies

## Overview
This document provides detailed mocking techniques and patterns for testing game services, components, and Phaser.js integrations in our browser-based RPG. It focuses on pragmatic approaches to creating reliable, maintainable, and type-safe mocks that support effective testing.

## Contents
- [Mocking Fundamentals](#mocking-fundamentals)
- [Type-Safe Mocking](#type-safe-mocking)
- [Service Mocking Patterns](#service-mocking-patterns)
- [Mocking Phaser Components](#mocking-phaser-components)
- [MockFactory Pattern](#mockfactory-pattern)
- [Jest Mock Implementation](#jest-mock-implementation)
- [Complex Dependency Chains](#complex-dependency-chains)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Debugging Mocks](#debugging-mocks)
- [Phaser-Specific Mocking Strategies](#phaser-specific-mocking-strategies)

## Mocking Fundamentals

### Types of Mocks

1. **Stub**: Provides canned answers to calls during tests
2. **Spy**: Records calls and parameters for verification
3. **Mock**: Pre-programmed with expectations about calls
4. **Fake**: Working implementation with shortcuts unsuitable for production

### When to Use Each Mock Type

| Mock Type | Use When | Implementation |
|-----------|----------|----------------|
| Stub | You need to control method return values | `jest.fn().mockReturnValue()` |
| Spy | You need to verify how something was called | `jest.spyOn()` |
| Mock | You need to verify complex interaction patterns | `jest.mock()` with implementation |
| Fake | You need stateful behavior in tests | Create simplified implementation class |

### Basic Mock Implementation

```typescript
// Basic function mock
const mockFunction = jest.fn();
mockFunction.mockReturnValue(42);

// Basic object mock
const mockObject = {
  method1: jest.fn().mockReturnValue('result1'),
  method2: jest.fn().mockImplementation((param) => param * 2)
};
```

## Type-Safe Mocking

### Using jest-mock-extended

```typescript
import { mock, mockReset } from 'jest-mock-extended';
import { IAssetService } from '../services/asset.service';

describe('AssetService Tests', () => {
  // Create a type-safe mock that enforces IAssetService interface
  const mockAssetService = mock<IAssetService>();
  
  beforeEach(() => {
    // Reset mock before each test
    mockReset(mockAssetService);
    
    // Set up default behavior
    mockAssetService.isLoaded.mockReturnValue(true);
    mockAssetService.clearAssets.mockImplementation(() => {});
  });
  
  test('should verify asset is loaded', () => {
    // Call the mocked method
    const result = mockAssetService.isLoaded('test-asset');
    
    // Verify the result and the call
    expect(result).toBe(true);
    expect(mockAssetService.isLoaded).toHaveBeenCalledWith('test-asset');
  });
});
```

### Mocking Classes with TypeScript

```typescript
import { AudioService } from '../services/audio.service';

// Create a mock class that extends the real class
class MockAudioService extends AudioService {
  // Override methods as needed
  playSound = jest.fn().mockReturnValue({} as Phaser.Sound.BaseSound);
  playMusic = jest.fn().mockReturnValue({} as Phaser.Sound.BaseSound);
  setVolume = jest.fn();
  
  // Track internal state for testing
  _mockInternalState = {
    currentMusic: null,
    isPaused: false
  };
  
  // Override getter
  get isPaused(): boolean {
    return this._mockInternalState.isPaused;
  }
}

// Use in tests
const mockAudioService = new MockAudioService();
```

## Service Mocking Patterns

### Core Game Service Mock

```typescript
import { IGameService } from '../core/service.interface';

/**
 * Creates a mock implementation of IGameService
 */
export function createMockGameService(): jest.Mocked<IGameService> {
  return {
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn()
  };
}

// Usage example
test('should initialize all services', async () => {
  const mockService1 = createMockGameService();
  const mockService2 = createMockGameService();
  
  // Set up ServiceRegistry with mocks
  const registry = ServiceRegistry.getInstance();
  registry.register('service1', mockService1);
  registry.register('service2', mockService2);
  
  // Test initialization
  await registry.initializeAll();
  
  // Verify all services were initialized
  expect(mockService1.init).toHaveBeenCalledTimes(1);
  expect(mockService2.init).toHaveBeenCalledTimes(1);
});
```

### AudioService Comprehensive Mock

Based on the IAudioService interface from core-services-api.md:

```typescript
import { IAudioService } from '../services/audio.service';

/**
 * Creates a comprehensive mock of the IAudioService
 */
export function createMockAudioService(): jest.Mocked<IAudioService> {
  // Create sound mock that can be returned by playSound/playMusic
  const createMockSound = () => ({
    play: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    resume: jest.fn().mockReturnThis(),
    setVolume: jest.fn().mockReturnThis(),
    setRate: jest.fn().mockReturnThis(),
    setLoop: jest.fn().mockReturnThis(),
    isPlaying: false,
    isPaused: false,
    key: 'mock-sound'
  }) as unknown as jest.Mocked<Phaser.Sound.BaseSound>;
  
  // Create mock sound instances that can be tracked
  const mockSoundEffects = new Map<string, Phaser.Sound.BaseSound>();
  let mockCurrentMusic: Phaser.Sound.BaseSound | null = null;
  let mockIsPaused = false;
  
  // Create the service mock with stateful behavior
  const mockService: jest.Mocked<IAudioService> = {
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockImplementation(() => {
      mockSoundEffects.clear();
      mockCurrentMusic = null;
    }),
    
    playSound: jest.fn().mockImplementation((key: string) => {
      if (mockIsPaused) {
        return {} as Phaser.Sound.BaseSound;
      }
      
      let sound = mockSoundEffects.get(key);
      if (!sound) {
        sound = createMockSound();
        mockSoundEffects.set(key, sound);
      }
      
      // Update the sound state
      (sound as any).isPlaying = true;
      sound.play();
      return sound;
    }),
    
    playMusic: jest.fn().mockImplementation((key: string) => {
      if (mockIsPaused) {
        return {} as Phaser.Sound.BaseSound;
      }
      
      // Stop current music if playing
      if (mockCurrentMusic) {
        mockCurrentMusic.stop();
        (mockCurrentMusic as any).isPlaying = false;
      }
      
      const music = createMockSound();
      (music as any).key = key;
      (music as any).isPlaying = true;
      mockCurrentMusic = music;
      music.play();
      return music;
    }),
    
    stop: jest.fn().mockImplementation((key?: string) => {
      if (key) {
        const sound = mockSoundEffects.get(key);
        if (sound) {
          sound.stop();
          (sound as any).isPlaying = false;
        } else if (mockCurrentMusic && (mockCurrentMusic as any).key === key) {
          mockCurrentMusic.stop();
          (mockCurrentMusic as any).isPlaying = false;
        }
      } else {
        // Stop all sounds
        mockSoundEffects.forEach(sound => {
          sound.stop();
          (sound as any).isPlaying = false;
        });
        
        if (mockCurrentMusic) {
          mockCurrentMusic.stop();
          (mockCurrentMusic as any).isPlaying = false;
        }
      }
    }),
    
    setVolume: jest.fn(),
    
    pause: jest.fn().mockImplementation(() => {
      if (!mockIsPaused) {
        mockIsPaused = true;
        
        mockSoundEffects.forEach(sound => {
          if ((sound as any).isPlaying) {
            sound.pause();
            (sound as any).isPaused = true;
          }
        });
        
        if (mockCurrentMusic && (mockCurrentMusic as any).isPlaying) {
          mockCurrentMusic.pause();
          (mockCurrentMusic as any).isPaused = true;
        }
      }
    }),
    
    resume: jest.fn().mockImplementation(() => {
      if (mockIsPaused) {
        mockIsPaused = false;
        
        mockSoundEffects.forEach(sound => {
          if ((sound as any).isPaused) {
            sound.resume();
            (sound as any).isPaused = false;
            (sound as any).isPlaying = true;
          }
        });
        
        if (mockCurrentMusic && (mockCurrentMusic as any).isPaused) {
          mockCurrentMusic.resume();
          (mockCurrentMusic as any).isPaused = false;
          (mockCurrentMusic as any).isPlaying = true;
        }
      }
    }),
    
    get isPaused(): boolean {
      return mockIsPaused;
    }
  };
  
  return mockService;
}

// Usage example
test('should handle audio pausing and resuming', () => {
  const mockAudio = createMockAudioService();
  
  // Play sound and music
  const sound = mockAudio.playSound('explosion');
  const music = mockAudio.playMusic('background');
  
  // Verify playing state
  expect(sound.play).toHaveBeenCalled();
  expect(music.play).toHaveBeenCalled();
  
  // Pause audio
  mockAudio.pause();
  expect(mockAudio.isPaused).toBe(true);
  expect(sound.pause).toHaveBeenCalled();
  expect(music.pause).toHaveBeenCalled();
  
  // Resume audio
  mockAudio.resume();
  expect(mockAudio.isPaused).toBe(false);
  expect(sound.resume).toHaveBeenCalled();
  expect(music.resume).toHaveBeenCalled();
});
```

### SceneService Mock

```typescript
import { ISceneService, SceneStartOptions, TransitionConfig } from '../services/scene.service';

export function createMockSceneService(): jest.Mocked<ISceneService> {
  // Track current active scene
  let currentScene = '';
  const pausedScenes: string[] = [];
  
  return {
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    registerScenes: jest.fn(),
    
    startScene: jest.fn().mockImplementation((key: string) => {
      currentScene = key;
    }),
    
    transitionTo: jest.fn().mockImplementation((from: string, to: string) => {
      if (currentScene === from) {
        currentScene = to;
      }
    }),
    
    getCurrentScene: jest.fn().mockImplementation(() => currentScene),
    
    pauseScene: jest.fn().mockImplementation((key: string) => {
      if (!pausedScenes.includes(key)) {
        pausedScenes.push(key);
      }
    }),
    
    resumeScene: jest.fn().mockImplementation((key: string) => {
      const index = pausedScenes.indexOf(key);
      if (index >= 0) {
        pausedScenes.splice(index, 1);
      }
    })
  };
}

// Usage example
test('should transition between scenes', () => {
  const mockScene = createMockSceneService();
  
  // Start initial scene
  mockScene.startScene('MainMenu');
  expect(mockScene.getCurrentScene()).toBe('MainMenu');
  
  // Transition to gameplay
  mockScene.transitionTo('MainMenu', 'Gameplay');
  expect(mockScene.getCurrentScene()).toBe('Gameplay');
});
```

## Mocking Phaser Components

### Mocking Phaser Scene

```typescript
export function createMockScene() {
  return {
    // Scene properties
    add: {
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      image: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      container: jest.fn().mockReturnValue({
        add: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
          setPosition: jest.fn().mockReturnThis(),
          setFrequency: jest.fn().mockReturnThis(),
          setSpeed: jest.fn().mockReturnThis(),
          stop: jest.fn().mockReturnThis(),
          start: jest.fn().mockReturnThis(),
        }),
      }),
      tween: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
      }),
    },
    
    // Physics
    physics: {
      add: {
        sprite: jest.fn().mockReturnValue({
          setVelocity: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setImmovable: jest.fn().mockReturnThis(),
          setDrag: jest.fn().mockReturnThis(),
          setAngularVelocity: jest.fn().mockReturnThis(),
          setMass: jest.fn().mockReturnThis(),
          setFriction: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          play: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
        }),
        group: jest.fn().mockReturnValue({
          add: jest.fn().mockReturnThis(),
          setVelocity: jest.fn().mockReturnThis(),
        }),
      },
      world: {
        setBounds: jest.fn(),
        on: jest.fn(),
      },
      overlap: jest.fn(),
      collide: jest.fn(),
    },
    
    // Input
    input: {
      on: jest.fn(),
      off: jest.fn(),
      keyboard: {
        on: jest.fn(),
        addKey: jest.fn().mockReturnValue({
          on: jest.fn(),
          isDown: false,
        }),
      },
      mouse: {
        on: jest.fn(),
      },
    },
    
    // Scene management
    scene: {
      pause: jest.fn(),
      resume: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      launch: jest.fn(),
    },
    
    // Events
    events: {
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    
    // Cameras
    cameras: {
      main: {
        setBackgroundColor: jest.fn(),
        startFollow: jest.fn(),
        setBounds: jest.fn(),
        setZoom: jest.fn(),
        shake: jest.fn(),
        flash: jest.fn(),
        fadeIn: jest.fn(),
        fadeOut: jest.fn(),
      },
    },
    
    // Data
    data: {
      set: jest.fn(),
      get: jest.fn(),
      values: {},
    },
    
    // Time
    time: {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn(),
        paused: false,
      }),
      delayedCall: jest.fn(),
    },
    
    // Lifecycle methods
    create: jest.fn(),
    update: jest.fn(),
    preload: jest.fn(),
    init: jest.fn(),
  };
}

// Usage
test('should create player sprite', () => {
  const mockScene = createMockScene();
  const playerController = new PlayerController(mockScene as unknown as Phaser.Scene);
  
  playerController.createPlayer(100, 200);
  
  // Verify sprite was created with correct parameters
  expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(100, 200, 'player');
});
```

### Mocking Phaser Game Objects

```typescript
export function createMockSprite() {
  return {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    visible: true,
    active: true,
    
    setPosition: jest.fn(function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }),
    
    setVelocity: jest.fn(function(x, y) {
      this.body.velocity.x = x;
      this.body.velocity.y = y;
      return this;
    }),
    
    setActive: jest.fn(function(value) {
      this.active = value;
      return this;
    }),
    
    setVisible: jest.fn(function(value) {
      this.visible = value;
      return this;
    }),
    
    play: jest.fn().mockReturnThis(),
    
    on: jest.fn().mockReturnThis(),
    
    destroy: jest.fn(),
    
    body: {
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      setBounce: jest.fn().mockReturnThis(),
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setDrag: jest.fn().mockReturnThis(),
    },
  };
}

// Usage
test('should update sprite position', () => {
  const sprite = createMockSprite();
  const controller = new SpriteController(sprite as unknown as Phaser.Physics.Arcade.Sprite);
  
  controller.moveRight(5);
  
  expect(sprite.setVelocity).toHaveBeenCalledWith(5, 0);
  expect(sprite.body.velocity.x).toBe(5);
});
```

## MockFactory Pattern

### Implementation

```typescript
// tests/helpers/mock-factory.ts
import { IGameService, IUpdatableService, IPausableService } from '../../src/services/interfaces';

/**
 * Factory for creating type-safe mock services with consistent interfaces
 */
export class MockFactory {
  /**
   * Create a base game service mock
   */
  static createGameService(serviceName: string = 'mockService'): jest.Mocked<IGameService> {
    return {
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
    };
  }
  
  /**
   * Create an updatable service mock
   */
  static createUpdatableService(serviceName: string = 'mockUpdatableService'): jest.Mocked<IUpdatableService> {
    return {
      ...this.createGameService(serviceName),
      update: jest.fn(),
    };
  }
  
  /**
   * Create a pausable service mock
   */
  static createPausableService(serviceName: string = 'mockPausableService'): jest.Mocked<IPausableService> {
    let isPaused = false;
    
    const mock = {
      ...this.createGameService(serviceName),
      pause: jest.fn().mockImplementation(() => {
        isPaused = true;
      }),
      resume: jest.fn().mockImplementation(() => {
        isPaused = false;
      }),
      get isPaused() {
        return isPaused;
      }
    };
    
    // Workaround for jest limitation with getters in mocks
    Object.defineProperty(mock, 'isPaused', {
      get: jest.fn(() => isPaused)
    });
    
    return mock;
  }
  
  /**
   * Create a mock for any service interface that extends IGameService
   */
  static createServiceMock<T extends IGameService>(
    baseType: 'basic' | 'updatable' | 'pausable',
    customImplementation: Partial<T> = {}
  ): jest.Mocked<T> {
    let baseMock;
    
    switch (baseType) {
      case 'updatable':
        baseMock = this.createUpdatableService();
        break;
      case 'pausable':
        baseMock = this.createPausableService();
        break;
      default:
        baseMock = this.createGameService();
    }
    
    return {
      ...baseMock,
      ...customImplementation
    } as jest.Mocked<T>;
  }
}

// Usage
import { MockFactory } from '../helpers/mock-factory';
import { IAudioService } from '../../src/services/audio.service';

describe('Game Engine Tests', () => {
  test('should pause all pausable services', () => {
    // Create various service mocks
    const mockAudio = MockFactory.createServiceMock<IAudioService>('pausable', {
      playSound: jest.fn(),
      playMusic: jest.fn(),
      stop: jest.fn(),
      setVolume: jest.fn()
    });
    
    const mockUpdatable = MockFactory.createUpdatableService();
    const mockBasic = MockFactory.createGameService();
    
    // Set up service registry with mocks
    const registry = ServiceRegistry.getInstance();
    registry.register('audio', mockAudio);
    registry.register('updatable', mockUpdatable);
    registry.register('basic', mockBasic);
    
    // Create engine under test
    const gameEngine = new GameEngine(registry);
    
    // Act
    gameEngine.pauseGame();
    
    // Assert - pausable services should be paused
    expect(mockAudio.pause).toHaveBeenCalled();
    
    // Non-pausable services should not have pause called
    expect((mockUpdatable as any).pause).toBeUndefined();
    expect((mockBasic as any).pause).toBeUndefined();
  });
});
```

## Jest Mock Implementation

### Automatic Mocking

```typescript
// Automatically mock all imports from a specific module
jest.mock('../../src/services/storage.service');

import { StorageService } from '../../src/services/storage.service';

// The imported StorageService is now automatically mocked
// Every method is a mock function

// Customize mock implementation for specific methods
(StorageService.getInstance as jest.Mock).mockReturnValue({
  save: jest.fn().mockResolvedValue(undefined),
  load: jest.fn().mockImplementation((key, defaultValue) => {
    if (key === 'test-key') {
      return Promise.resolve({ value: 'test-value' });
    }
    return Promise.resolve(defaultValue);
  }),
  remove: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  has: jest.fn().mockResolvedValue(false)
});

test('should load data from storage', async () => {
  const storage = StorageService.getInstance();
  
  // Using our custom implementation
  const result = await storage.load('test-key', null);
  
  expect(result).toEqual({ value: 'test-value' });
  expect(storage.load).toHaveBeenCalledWith('test-key', null);
});
```

### Manual Module Mock Implementation

```typescript
// __mocks__/phaser.js
const Phaser = {
  Game: jest.fn().mockImplementation(() => ({
    destroy: jest.fn()
  })),
  
  Scene: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    create: jest.fn(),
    preload: jest.fn()
  })),
  
  AUTO: 0,
  CANVAS: 1,
  WEBGL: 2,
  HEADLESS: 3,
  
  Sound: {
    SoundManagerCreator: {
      create: jest.fn()
    },
    BaseSound: jest.fn()
  },
  
  Physics: {
    Arcade: {
      Sprite: jest.fn(),
      Group: jest.fn(),
      Body: jest.fn()
    }
  },
  
  Input: {
    Keyboard: {
      Key: jest.fn(),
      KeyCodes: {
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
      }
    }
  }
};

module.exports = Phaser;
```

## Complex Dependency Chains

### Mocking Service Registry and Dependencies

```typescript
import { ServiceRegistry } from '../../src/core/service-registry';
import { IInputService } from '../../src/services/input.service';
import { IStorageService } from '../../src/services/storage.service';
import { IAssetService } from '../../src/services/asset.service';
import { MockFactory } from '../helpers/mock-factory';

// Mock the entire service registry
jest.mock('../../src/core/service-registry');

describe('Player Controller Tests', () => {
  // Set up mock services
  const mockInput = MockFactory.createServiceMock<IInputService>('updatable', {
    registerActions: jest.fn(),
    activateContext: jest.fn(),
    isActionActive: jest.fn(),
    isActionJustTriggered: jest.fn().mockReturnValue(false),
    addActionListener: jest.fn(),
    removeActionListener: jest.fn()
  });
  
  const mockStorage = MockFactory.createServiceMock<IStorageService>('basic', {
    save: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    has: jest.fn().mockResolvedValue(false)
  });
  
  const mockAsset = MockFactory.createServiceMock<IAssetService>('basic', {
    preloadAssets: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
    clearAssets: jest.fn()
  });
  
  // Mock registry get method to return our mocks
  const mockRegistry = {
    get: jest.fn().mockImplementation((name: string) => {
      switch (name) {
        case 'input': return mockInput;
        case 'storage': return mockStorage;
        case 'asset': return mockAsset;
        default: throw new Error(`Unexpected service request: ${name}`);
      }
    }),
    register: jest.fn(),
    has: jest.fn().mockReturnValue(true),
    initializeAll: jest.fn().mockResolvedValue(undefined),
    destroyAll: jest.fn()
  };
  
  // Replace the getInstance singleton with our mock
  (ServiceRegistry.getInstance as jest.Mock).mockReturnValue(mockRegistry);
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset specific mock behaviors that might change during tests
    mockInput.isActionJustTriggered.mockReturnValue(false);
  });
  
  test('should initialize with saved player data', async () => {
    // Set up player data in mock storage
    const savedPlayerData = { health: 80, position: { x: 100, y: 200 } };
    mockStorage.load.mockResolvedValueOnce(savedPlayerData);
    
    // Create controller under test
    const playerController = new PlayerController();
    await playerController.initialize();
    
    // Verify storage was queried
    expect(mockStorage.load).toHaveBeenCalledWith('player.data', expect.any(Object));
    
    // Verify player was initialized with saved data
    expect(playerController.getHealth()).toBe(80);
    expect(playerController.getPosition()).toEqual({ x: 100, y: 200 });
  });
  
  test('should handle jump action', () => {
    // Create controller
    const playerController = new PlayerController();
    
    // Setup sprites and physics (implementation specific)
    const mockSprite = createMockSprite();
    playerController.setSprite(mockSprite as any);
    
    // Simulate jump input
    mockInput.isActionJustTriggered.mockReturnValueOnce(true); // First call returns true
    
    // Update controller
    playerController.update(0.016); // 16ms frame
    
    // Verify jump velocity was applied
    expect(mockSprite.setVelocity).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    expect(mockSprite.body.velocity.y).toBeLessThan(0); // Negative Y velocity for jump
  });
});
```

## Anti-Patterns to Avoid

### Anti-Pattern: Overmocking

```typescript
// ❌ BAD: Excessive mocking creates brittle tests
test('should process input - overmocked', () => {
  // Creating mocks for everything, including implementation details
  const mockInput = { isDown: jest.fn().mockReturnValue(true) };
  const mockKeyboard = { addKey: jest.fn().mockReturnValue(mockInput) };
  const mockSprite = { x: 0, setVelocity: jest.fn() };
  const mockPhysics = { world: { bounds: {} } };
  const mockAdd = { sprite: jest.fn().mockReturnValue(mockSprite) };
  const mockScene = { 
    input: { keyboard: mockKeyboard },
    physics: mockPhysics,
    add: mockAdd
  };
  
  // Creating the controller with excessive dependencies
  const controller = new PlayerController(mockScene);
  controller.update();
  
  // Assertions tightly coupled to implementation
  expect(mockInput.isDown).toHaveBeenCalled();
  expect(mockSprite.setVelocity).toHaveBeenCalledWith(expect.any(Number), 0);
});

// ✅ GOOD: Mock at the right level of abstraction
test('should process input - properly mocked', () => {
  // Use the input service abstraction instead of mocking Phaser details
  const mockInputService = MockFactory.createServiceMock<IInputService>('updatable', {
    isActionActive: jest.fn().mockImplementation(action => action === 'moveRight')
  });
  
  // Mock just what we need at the appropriate level
  const mockSprite = createMockSprite();
  
  // Create controller with proper abstractions
  const controller = new PlayerController(mockInputService);
  controller.setSprite(mockSprite as any);
  controller.update(0.016);
  
  // Assertions focus on behavior, not implementation
  expect(mockSprite.setVelocity).toHaveBeenCalledWith(expect.any(Number), 0);
  expect(mockSprite.body.velocity.x).toBeGreaterThan(0);
});
```

### Anti-Pattern: Testing Implementation Details

```typescript
// ❌ BAD: Testing private methods and implementation details
test('should calculate damage - testing implementation details', () => {
  const combatService = new CombatService();
  
  // Expose and directly test a private method
  const calculateDamage = jest.spyOn(combatService as any, '_calculateDamage');
  
  combatService.processCombatTurn({ attack: 10 }, { defense: 5 });
  
  // This test breaks when implementation changes
  expect(calculateDamage).toHaveBeenCalledWith(10, 5);
});

// ✅ GOOD: Testing public interface and observable behavior
test('should calculate damage - testing behavior', () => {
  const combatService = new CombatService();
  const attacker = { attack: 10 };
  const defender = { defense: 5, health: 100 };
  
  // Test the public method and observe results
  combatService.processCombatTurn(attacker, defender);
  
  // Test observable outcomes, not implementation
  expect(defender.health).toBeLessThan(100);
  expect(defender.health).toBe(95); // Expecting 10 - 5 = 5 damage
});
```

## Debugging Mocks

### Debugging Mock Calls

```typescript
test('debugging mock interactions', () => {
  const mockService = jest.fn().mockImplementation(() => ({
    doSomething: jest.fn(),
    processData: jest.fn().mockReturnValue('processed')
  }));
  
  const service = new mockService();
  
  // Call the mocked methods
  service.doSomething('arg1', 'arg2');
  service.processData('input');
  
  // Debug mock calls
  console.log('Constructor called:', mockService.mock.calls);
  console.log('doSomething called with:', service.doSomething.mock.calls);
  console.log('processData called with:', service.processData.mock.calls);
  console.log('processData results:', service.processData.mock.results);
  
  // Typical assertions
  expect(service.doSomething).toHaveBeenCalledWith('arg1', 'arg2');
  expect(service.processData).toHaveBeenCalledWith('input');
});
```

### Using mockImplementation to Debug

```typescript
test('using mockImplementation for debugging', () => {
  const mockFunction = jest.fn().mockImplementation((...args) => {
    console.log('Function called with args:', args);
    
    // You can also add conditional logic for debugging
    if (args[0] === 'special') {
      console.log('Special value detected!');
      return 'special result';
    }
    
    return 'normal result';
  });
  
  // Use the mock
  const result1 = mockFunction('normal', 123);
  const result2 = mockFunction('special', 456);
  
  // Assert results
  expect(result1).toBe('normal result');
  expect(result2).toBe('special result');
});
```

This document provides a comprehensive reference for creating effective mocks across the game project. By following these patterns and examples, you can create maintainable, type-safe tests that verify behavior without being brittle or overly complex.

// Mock for dependent services
export function createMockDependentService(
  serviceName: string,
  dependencies: string[]
): jest.Mocked<IDependentService> {
  return {
    ...MockFactory.createGameService(serviceName),
    dependencies: dependencies,
  };
}

// Enhanced event bus mocking with scoping
export function createMockEventBus(): jest.Mocked<IEventBus> {
  const mockEventBus = MockFactory.createServiceMock<IEventBus>('basic', {
    on: jest.fn().mockImplementation(() => jest.fn()), // Returns unsubscribe function
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn().mockImplementation(() => jest.fn()),
    throttle: jest.fn(),
    createScope: jest.fn().mockImplementation((scope: string) => ({
      scope,
      on: jest.fn().mockImplementation(() => jest.fn()),
      off: jest.fn(),
      emit: jest.fn(),
      once: jest.fn().mockImplementation(() => jest.fn()),
      throttle: jest.fn()
    }))
  });
  
  return mockEventBus;
}

## Phaser-Specific Mocking Strategies

### Setting Up Phaser Mocks

#### 1. Jest Configuration
```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',  // Required for Phaser's browser APIs
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^phaser$': '<rootDir>/__mocks__/phaser.js'  // Map Phaser imports to our mock
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true  // Enable ES modules support
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules', 'src']
};
```

#### 2. Browser Environment Setup
```javascript
// jest.setup.js
import { jest } from '@jest/globals';

const mock = () => {
  const canvas = {
    getContext: () => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      // ... other canvas context methods
    }),
    style: {},
    width: 800,
    height: 600,
  };

  // Mock browser globals
  global.document = {
    createElement: (tag) => tag === 'canvas' ? canvas : {},
    documentElement: { style: {} },
  };
  
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    devicePixelRatio: 1,
    innerWidth: 800,
    innerHeight: 600,
    // ... other window properties
  };
  
  global.Image = class {
    constructor() {
      setTimeout(() => this.onload?.());
    }
  };
  
  global.HTMLCanvasElement = class {};
  global.ImageData = class {};
};

mock();
```

#### 3. Phaser Mock Implementation
```javascript
// __mocks__/phaser.js
import { jest } from '@jest/globals';

class Scene {
  constructor(config) {
    Object.assign(this, config);
  }
  
  update() {}
  create() {}
  preload() {}
  init() {}
}

const GameObjects = {
  Sprite: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  Image: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  Text: jest.fn().mockImplementation(() => ({
    setPosition: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
};

// Export Phaser components
export {
  Scene,
  Game: jest.fn().mockImplementation(() => ({ destroy: jest.fn() })),
  GameObjects,
  Physics: {
    Arcade: {
      Sprite: jest.fn(),
      Group: jest.fn(),
      Body: jest.fn()
    }
  },
  Scale: {
    NONE: 'NONE',
    FIT: 'FIT',
    RESIZE: 'RESIZE',
  },
  // ... other Phaser exports
};
```

### Testing Phaser Scenes

#### Scene Test Setup Pattern
```typescript
import { jest } from '@jest/globals';
import { Scene } from 'phaser';

describe('GameScene', () => {
  let scene: GameScene;

  beforeEach(() => {
    scene = new GameScene();
    
    // Mock required scene properties
    const mockText = {
      setOrigin: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
    };

    scene.add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue(mockText),
    } as any;

    scene.input = {
      on: jest.fn(),
      keyboard: {
        on: jest.fn(),
      },
    } as any;

    // Store references for assertions
    (scene as any).gameText = mockText;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

#### Testing Scene Lifecycle Methods
```typescript
describe('Scene Lifecycle', () => {
  it('should initialize correctly', () => {
    scene.create();
    
    // Verify game objects were created
    const addImage = scene.add.image as jest.Mock;
    expect(addImage).toHaveBeenCalledWith(0, 0, 'background');
    expect(addImage.mock.results[0].value.setOrigin)
      .toHaveBeenCalledWith(0, 0);
  });

  it('should handle input events', () => {
    scene.create();
    
    // Get and verify event handlers
    const inputOn = scene.input.on as jest.Mock;
    const clickHandler = inputOn.mock.calls[0][1] as () => void;
    
    clickHandler();
    
    expect(scene.gameText.setText)
      .toHaveBeenCalledWith(expect.any(String));
  });
});
```

### Best Practices for Phaser Testing

1. **Type Safety**
   - Use TypeScript type assertions carefully with mocks
   - Create interfaces for mock objects
   - Handle private members through type assertions
   - Use jest.Mock type for mocked functions

2. **Mock Organization**
   - Keep mock implementations minimal
   - Group related mock objects (GameObjects, Input, etc.)
   - Use factory functions for common mock objects
   - Maintain mock hierarchy matching Phaser's structure

3. **Testing Patterns**
   - Test scene lifecycle methods independently
   - Verify game object creation and configuration
   - Test event handler registration and execution
   - Check state changes and updates
   - Validate scene transitions

4. **Common Pitfalls**
   - Avoid testing Phaser internals
   - Don't over-mock Phaser features
   - Handle async operations properly
   - Clean up resources between tests
   - Reset mocks in afterEach

### Example: Testing Scene Transitions
```typescript
describe('Scene Transitions', () => {
  it('should transition to new scene on event', () => {
    // Arrange
    const scene = new GameScene();
    scene.scene = { start: jest.fn() } as any;
    
    // Act
    scene.handleTransition();
    
    // Assert
    expect(scene.scene.start)
      .toHaveBeenCalledWith('NextScene');
  });
});
```
