# Sprint 1 Testing Patterns

## Document Purpose
This document provides practical code examples and implementation details for testing the specific components outlined in the [Sprint 1 Implementation Plan](../Implementation/Sprint1ImplementationPlan.md). It aims to guide developers in implementing effective tests for the core architecture and infrastructure components being developed in Sprint 1.

## Related Documents
- [Sprint1ImplementationPlan.md](../Implementation/Sprint1ImplementationPlan.md) - Implementation plan for Sprint 1
- [Jest Testing Strategy](./jest-testing-strategy.md) - Overall testing strategy for the project

## Table of Contents
- [Getting Started with Testing](#getting-started-with-testing)
  - [Jest Configuration Details](#jest-configuration-details)
  - [Testing Environment Setup](#testing-environment-setup)
  - [Test Organization for Larger Test Suites](#test-organization-for-larger-test-suites)
- [Core Component Testing](#core-component-testing)
  - [Service Registry Testing](#service-registry-testing)
  - [Event-Based System Testing](#event-based-system-testing)
  - [Scene Lifecycle Testing](#scene-lifecycle-testing)
  - [Game Loop and Configuration Testing](#game-loop-and-configuration-testing)
- [Advanced Testing Techniques](#advanced-testing-techniques)
  - [Integration Testing Between Components](#integration-testing-between-components)
  - [Snapshot Testing for Configuration Objects](#snapshot-testing-for-configuration-objects)
  - [Phaser-Specific Testing Best Practices](#phaser-specific-testing-best-practices)
  - [Asset Testing](#asset-testing)
- [Quality Assurance](#quality-assurance)
  - [Test Coverage Reporting](#test-coverage-reporting)
  - [Integration with Code Quality Tools](#integration-with-code-quality-tools)
  - [Visual Regression Testing](#visual-regression-testing)
  - [Performance Benchmarking](#performance-benchmarking)
  - [Dependency Verification Testing](#dependency-verification-testing)

## Getting Started with Testing

### Jest Configuration Details

The project uses Jest 29.7+ as its primary testing framework, configured specifically for TypeScript and Phaser game development needs:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['jest-canvas-mock'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
};
```

Key configuration aspects:
- `preset: 'ts-jest'`: Enables TypeScript support without requiring manual transpilation
- `testEnvironment: 'jsdom'`: Simulates a DOM environment for testing UI interactions and Canvas rendering
- `setupFiles: ['jest-canvas-mock']`: Provides mocks for HTML5 Canvas APIs that Phaser depends on
- `moduleNameMapper`: Handles non-JavaScript assets in tests by providing mock implementations

This configuration ensures compatibility with our Phaser.js and TypeScript stack while enabling both unit and integration tests to run in a simulated browser environment.

### Testing Environment Setup

Proper test environment setup is crucial for reliably testing Phaser game components. This includes:

```typescript
// test/setup.ts - Global setup file
import 'jest-canvas-mock';

// Create global mocks for browser objects that Phaser uses
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  // Minimal WebGL/Canvas context mock
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: jest.fn(),
  drawArrays: jest.fn(),
  uniformMatrix4fv: jest.fn()
}));

// Mock window's requestAnimationFrame for game loop testing
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(() => callback(Date.now()), 16);
});

// Mock Phaser namespace if needed
global.Phaser = {
  Game: jest.fn().mockImplementation(() => ({
    // Minimal Game object implementation for testing
    destroy: jest.fn(),
    scene: {
      add: jest.fn(),
      start: jest.fn()
    }
  }))
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

For specific Phaser game tests, you may need to create specialized helpers:

```typescript
// test/helpers/phaserTestHelper.ts
export function createMockPhaserGame() {
  return {
    scene: {
      add: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      switch: jest.fn()
    },
    events: {
      emit: jest.fn(),
      on: jest.fn()
    },
    loop: {
      start: jest.fn(),
      stop: jest.fn(),
      time: 0,
      delta: 16
    },
    renderer: {
      width: 800,
      height: 600
    }
  };
}

// Usage in tests
import { createMockPhaserGame } from '../helpers/phaserTestHelper';

describe('Scene Test', () => {
  let mockGame;
  
  beforeEach(() => {
    mockGame = createMockPhaserGame();
  });
  
  test('scene initialization', () => {
    // Test with mockGame
  });
});
```

### Test Organization for Larger Test Suites

As our test suite grows, organization becomes crucial for maintainability and clarity.

#### Directory Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── services/           # Tests for game services
│   ├── scenes/             # Tests for game scenes
│   └── utils/              # Tests for utility functions
├── integration/            # Integration tests between components
├── e2e/                    # End-to-end tests
├── fixtures/               # Shared test fixtures/data
│   ├── mockData.ts         # Mock data used across tests
│   └── testHelpers.ts      # Helper functions for tests
└── setup/                  # Test setup files
    └── jest.setup.ts       # Global Jest setup
```

#### Test Grouping and Naming

Tests should be organized by feature and named consistently:

```typescript
// Service tests naming pattern: [ServiceName].test.ts
// Example: ServiceRegistry.test.ts

// Proper test organization within a file
describe('ServiceRegistry', () => {
  // Group related tests in nested describe blocks
  describe('instance management', () => {
    test('should maintain a singleton instance', () => { /* ... */ });
    test('should reset instance when explicitly cleared', () => { /* ... */ });
  });
  
  describe('service registration', () => {
    test('should register services correctly', () => { /* ... */ });
    test('should prevent duplicate service names', () => { /* ... */ });
  });
  
  describe('service lifecycle', () => {
    test('should initialize all services', () => { /* ... */ });
    test('should destroy all services', () => { /* ... */ });
  });
});
```

#### Shared Test Utilities

Create reusable utilities to reduce duplication:

```typescript
// fixtures/testHelpers.ts
export function createMockService(name: string): GameService {
  return {
    name,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    update: jest.fn()
  };
}

export function createMockEventSystem(): GameEventSystem {
  const listeners = new Map();
  
  return {
    on: jest.fn((event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
      
      // Return unsubscribe function
      return () => {
        const callbacks = listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      };
    }),
    
    emit: jest.fn((event, data) => {
      if (listeners.has(event)) {
        listeners.get(event).forEach(callback => callback(data));
      }
    })
  };
}

// Using the helper in tests
import { createMockService, createMockEventSystem } from '../fixtures/testHelpers';

describe('GameService tests', () => {
  test('service should respond to events', () => {
    // Arrange
    const mockService = createMockService('testService');
    const mockEvents = createMockEventSystem();
    
    // Act & Assert
    // ... test with mock objects
  });
});
```

## Core Component Testing

### Service Registry Testing

For testing the `ServiceRegistry` pattern, which is a core component of our architecture as described in the Sprint 1 Implementation Plan:

```typescript
// ServiceRegistry test
describe('ServiceRegistry', () => {
  let serviceRegistry;
  
  beforeEach(() => {
    // Reset singleton for each test
    ServiceRegistry.instance = null;
    serviceRegistry = ServiceRegistry.getInstance();
  });
  
  test('should maintain a singleton instance', () => {
    // Arrange & Act
    const instance1 = ServiceRegistry.getInstance();
    const instance2 = ServiceRegistry.getInstance();
    
    // Assert
    expect(instance1).toBe(instance2);
  });
  
  test('should register and retrieve services', () => {
    // Arrange
    const mockService = {
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    };
    
    // Act
    serviceRegistry.register('mockService', mockService);
    const retrievedService = serviceRegistry.get('mockService');
    
    // Assert
    expect(retrievedService).toBe(mockService);
  });
  
  test('should throw error when getting non-existent service', () => {
    // Act & Assert
    expect(() => {
      serviceRegistry.get('nonExistentService');
    }).toThrow('Service not found: nonExistentService');
  });
  
  test('should initialize all registered services', async () => {
    // Arrange
    const service1 = { init: jest.fn().mockResolvedValue(undefined), destroy: jest.fn() };
    const service2 = { init: jest.fn().mockResolvedValue(undefined), destroy: jest.fn() };
    
    serviceRegistry.register('service1', service1);
    serviceRegistry.register('service2', service2);
    
    // Act
    await serviceRegistry.initServices();
    
    // Assert
    expect(service1.init).toHaveBeenCalled();
    expect(service2.init).toHaveBeenCalled();
  });
  
  test('should destroy all registered services', () => {
    // Arrange
    const service1 = { init: jest.fn().mockResolvedValue(undefined), destroy: jest.fn() };
    const service2 = { init: jest.fn().mockResolvedValue(undefined), destroy: jest.fn() };
    
    serviceRegistry.register('service1', service1);
    serviceRegistry.register('service2', service2);
    
    // Act
    serviceRegistry.destroyServices();
    
    // Assert
    expect(service1.destroy).toHaveBeenCalled();
    expect(service2.destroy).toHaveBeenCalled();
  });
});
```

### Event-Based System Testing

For testing the `EventBus` system, which is a key component for game-wide communication as described in the Sprint 1 Implementation Plan:

```typescript
// Game events test
describe('GameEventSystem', () => {
  let eventSystem;
  
  beforeEach(() => {
    // Reset event system
    eventSystem = new GameEventSystem();
  });
  
  test('should emit and receive events', () => {
    // Arrange
    const eventSpy = jest.fn();
    eventSystem.on('test.event', eventSpy);
    
    // Act
    eventSystem.emit('test.event', { data: 'test' });
    
    // Assert
    expect(eventSpy).toHaveBeenCalledWith({ data: 'test' });
  });
  
  test('should handle multiple event subscriptions correctly', () => {
    // Arrange
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();
    
    eventSystem.on('multi.event', listener1);
    eventSystem.on('multi.event', listener2);
    eventSystem.on('multi.event', listener3);
    
    // Act
    eventSystem.emit('multi.event', { value: 42 });
    
    // Assert - all subscribers should be notified
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);
    
    // Verify payload
    expect(listener1).toHaveBeenCalledWith({ value: 42 });
  });
  
  test('should unsubscribe event listeners correctly', () => {
    // Arrange
    const eventListener = jest.fn();
    const unsubscribe = eventSystem.on('unsubscribe.test', eventListener);
    
    // Act - first event emission
    eventSystem.emit('unsubscribe.test', { count: 1 });
    
    // Assert - listener was called
    expect(eventListener).toHaveBeenCalledTimes(1);
    
    // Act - unsubscribe and emit again
    unsubscribe();
    eventSystem.emit('unsubscribe.test', { count: 2 });
    
    // Assert - listener was not called again
    expect(eventListener).toHaveBeenCalledTimes(1);
  });
  
  test('should support event namespacing', () => {
    // Arrange
    const rootListener = jest.fn();
    const childListener = jest.fn();
    
    eventSystem.on('parent', rootListener);
    eventSystem.on('parent.child', childListener);
    
    // Act
    eventSystem.emit('parent.child', { data: 'nested' });
    
    // Assert - both should receive events with namespacing
    expect(rootListener).toHaveBeenCalledTimes(1);
    expect(childListener).toHaveBeenCalledTimes(1);
  });
  
  test('should support event wildcards', () => {
    // Arrange
    const wildcardListener = jest.fn();
    eventSystem.on('system.*', wildcardListener);
    
    // Act
    eventSystem.emit('system.start', { status: 'starting' });
    eventSystem.emit('system.stop', { status: 'stopping' });
    
    // Assert
    expect(wildcardListener).toHaveBeenCalledTimes(2);
  });
});
```

### Scene Lifecycle Testing

For testing the base scene architecture, which is a fundamental component defined in the Sprint 1 Implementation Plan:

```typescript
// Scene lifecycle test
describe('GameScene Lifecycle', () => {
  let scene;
  let mockGame;
  
  beforeEach(() => {
    // Mock Phaser.Game instance
    mockGame = {
      scene: {
        add: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        switch: jest.fn()
      },
      events: {
        emit: jest.fn(),
        on: jest.fn()
      }
    };
    
    // Create scene with spies for lifecycle methods
    scene = new BaseScene('TestScene');
    jest.spyOn(scene, 'init');
    jest.spyOn(scene, 'preload');
    jest.spyOn(scene, 'create');
    jest.spyOn(scene, 'update');
    jest.spyOn(scene, 'shutdown');
    
    // Attach scene to mock game
    scene.game = mockGame;
    scene.cameras = { main: { setBackgroundColor: jest.fn() } };
    scene.add = { 
      image: jest.fn().mockReturnValue({ setOrigin: jest.fn() }),
      sprite: jest.fn().mockReturnValue({ 
        setOrigin: jest.fn(), 
        play: jest.fn(),
        setInteractive: jest.fn().mockReturnThis()
      })
    };
  });
  
  test('should initialize scene with correct data', () => {
    // Act
    scene.init({ level: 'forest', playerData: { health: 100 } });
    
    // Assert
    expect(scene.init).toHaveBeenCalledWith({ level: 'forest', playerData: { health: 100 } });
    expect(scene.sceneData.level).toBe('forest');
    expect(scene.sceneData.playerData.health).toBe(100);
  });
  
  test('should preload required assets', () => {
    // Arrange
    scene.load = {
      image: jest.fn(),
      spritesheet: jest.fn(),
      audio: jest.fn(),
      on: jest.fn()
    };
    
    // Act
    scene.preload();
    
    // Assert - verify asset loading is called appropriately
    expect(scene.load.image).toHaveBeenCalled();
    expect(scene.load.spritesheet).toHaveBeenCalled();
  });
  
  test('should create game objects and initialize systems', () => {
    // Arrange
    scene.init({ level: 'forest' });
    scene.anims = { create: jest.fn() };
    scene.physics = { 
      add: { 
        sprite: jest.fn().mockReturnValue({
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis()
        }) 
      } 
    };
    
    // Act
    scene.create();
    
    // Assert
    expect(scene.isInitialized).toBe(true);
  });
  
  test('should properly clean up resources on shutdown', () => {
    // Arrange
    scene.init({ level: 'forest' });
    scene.create();
    
    // Create mock services to test cleanup
    scene.services = {
      audio: { destroy: jest.fn() },
      input: { destroy: jest.fn() },
      physics: { destroy: jest.fn() }
    };
    
    // Mock event listeners
    scene.events = {
      off: jest.fn(),
      removeAllListeners: jest.fn()
    };
    
    // Act
    scene.shutdown();
    
    // Assert
    expect(scene.services.audio.destroy).toHaveBeenCalled();
    expect(scene.services.input.destroy).toHaveBeenCalled();
    expect(scene.services.physics.destroy).toHaveBeenCalled();
    expect(scene.events.removeAllListeners).toHaveBeenCalled();
    expect(scene.isInitialized).toBe(false);
  });
  
  test('should correctly transition between scenes', () => {
    // Arrange
    scene.init({ level: 'forest' });
    scene.create();
    
    const nextSceneKey = 'CaveScene';
    const transitionData = {
      playerPosition: { x: 250, y: 400 },
      inventory: ['sword', 'potion']
    };
    
    // Act
    scene.transitionToScene(nextSceneKey, transitionData);
    
    // Assert
    expect(mockGame.scene.switch).toHaveBeenCalledWith(
      'TestScene',
      nextSceneKey,
      transitionData
    );
  });
});
```

### Game Loop and Configuration Testing

For testing the game loop implementation and configuration system, which are core components of the game infrastructure as defined in the Sprint 1 Implementation Plan:

```typescript
// Game configuration test
describe('GameConfigurationSystem', () => {
  let configSystem;
  
  beforeEach(() => {
    // Initialize configuration system
    configSystem = new GameConfigurationSystem();
  });
  
  test('should load configuration with correct defaults', () => {
    // Act
    const config = configSystem.getConfig();
    
    // Assert
    expect(config).toHaveProperty('display');
    expect(config).toHaveProperty('physics');
    expect(config.display.width).toBe(800);
    expect(config.display.height).toBe(600);
  });
  
  test('should override configuration values', () => {
    // Arrange
    const customConfig = {
      display: {
        width: 1024,
        height: 768
      }
    };
    
    // Act
    configSystem.setConfig(customConfig);
    const config = configSystem.getConfig();
    
    // Assert
    expect(config.display.width).toBe(1024);
    expect(config.display.height).toBe(768);
    // Default values should remain
    expect(config.physics.gravity).toEqual({ x: 0, y: 300 });
  });
  
  test('should validate configuration values', () => {
    // Arrange
    const invalidConfig = {
      display: {
        width: -100, // Invalid negative value
        height: 768
      }
    };
    
    // Act & Assert
    expect(() => {
      configSystem.setConfig(invalidConfig);
    }).toThrow('Invalid configuration: display width must be positive');
  });
  
  test('should handle environment-specific configurations', () => {
    // Arrange
    configSystem.setEnvironment('development');
    
    // Act
    const devConfig = configSystem.getConfig();
    
    // Assert
    expect(devConfig.debug.enabled).toBe(true);
    
    // Change environment
    configSystem.setEnvironment('production');
    const prodConfig = configSystem.getConfig();
    
    // Debug should be disabled in production
    expect(prodConfig.debug.enabled).toBe(false);
  });
});

// Game loop test
describe('GameLoop', () => {
  let gameLoop;
  let mockPhaser;
  
  beforeEach(() => {
    // Mock Phaser.Game
    mockPhaser = {
      loop: {
        start: jest.fn(),
        stop: jest.fn()
      }
    };
    
    // Create game loop
    gameLoop = new GameLoop(mockPhaser);
  });
  
  test('should register update callbacks', () => {
    // Arrange
    const updateCallback = jest.fn();
    
    // Act
    gameLoop.addUpdateCallback('test', updateCallback);
    
    // Assert
    expect(gameLoop.updateCallbacks.size).toBe(1);
    expect(gameLoop.updateCallbacks.has('test')).toBe(true);
  });
  
  test('should execute update callbacks in order', () => {
    // Arrange
    const executionOrder = [];
    
    const callback1 = jest.fn(() => { executionOrder.push(1); });
    const callback2 = jest.fn(() => { executionOrder.push(2); });
    const callback3 = jest.fn(() => { executionOrder.push(3); });
    
    gameLoop.addUpdateCallback('callback1', callback1, 2); // Priority 2
    gameLoop.addUpdateCallback('callback2', callback2, 1); // Priority 1 (higher)
    gameLoop.addUpdateCallback('callback3', callback3, 3); // Priority 3
    
    // Act
    gameLoop.update(1000, 16); // time, delta
    
    // Assert
    expect(executionOrder).toEqual([2, 1, 3]); // Ordered by priority
  });
  
  test('should remove update callbacks', () => {
    // Arrange
    const updateCallback = jest.fn();
    gameLoop.addUpdateCallback('test', updateCallback);
    
    // Act
    gameLoop.removeUpdateCallback('test');
    
    // Assert
    expect(gameLoop.updateCallbacks.size).toBe(0);
  });
  
  test('should handle fixed update callbacks separately from variable updates', () => {
    // Arrange
    const variableUpdateSpy = jest.fn();
    const fixedUpdateSpy = jest.fn();
    
    gameLoop.addUpdateCallback('variable', variableUpdateSpy);
    gameLoop.addFixedUpdateCallback('fixed', fixedUpdateSpy);
    
    // Act - 4 frames with delta that would cause 2 fixed updates
    gameLoop.update(1000, 10); // Frame 1
    gameLoop.update(1010, 10); // Frame 2
    gameLoop.update(1020, 10); // Frame 3
    gameLoop.update(1030, 10); // Frame 4
    
    // Assert
    expect(variableUpdateSpy).toHaveBeenCalledTimes(4); // Every frame
    expect(fixedUpdateSpy).toHaveBeenCalledTimes(2);    // Every other frame
  });
  
  test('should start and stop the game loop', () => {
    // Act
    gameLoop.start();
    
    // Assert
    expect(mockPhaser.loop.start).toHaveBeenCalled();
    
    // Act
    gameLoop.stop();
    
    // Assert
    expect(mockPhaser.loop.stop).toHaveBeenCalled();
  });
  
  test('should report performance metrics', () => {
    // Arrange
    gameLoop.update(1000, 16);
    gameLoop.update(1016, 16);
    gameLoop.update(1032, 16);
    
    // Act
    const metrics = gameLoop.getPerformanceMetrics();
    
    // Assert
    expect(metrics).toHaveProperty('averageDelta');
    expect(metrics).toHaveProperty('updateCount');
    expect(metrics.updateCount).toBe(3);
    expect(metrics.averageDelta).toBe(16);
  });
});
```

## Advanced Testing Techniques

### Integration Testing Between Components

Integration tests are essential for verifying that our core architectural components work together correctly. These tests focus on the interactions between components rather than isolated functionality.

```typescript
// Integration test between ServiceRegistry and EventSystem
describe('ServiceRegistry and EventSystem Integration', () => {
  let serviceRegistry;
  let eventSystem;
  
  beforeEach(() => {
    // Reset singletons
    ServiceRegistry.instance = null;
    serviceRegistry = ServiceRegistry.getInstance();
    
    // Create and register event system
    eventSystem = new GameEventSystem();
    serviceRegistry.register('events', eventSystem);
  });
  
  test('should propagate events through registered EventSystem service', async () => {
    // Arrange
    const eventSpy = jest.fn();
    eventSystem.on('game.start', eventSpy);
    
    // Create game service that uses event system
    const gameService = {
      init: jest.fn().mockImplementation(() => {
        // Get event system from registry and emit event
        const events = serviceRegistry.get('events');
        events.emit('game.start', { timestamp: Date.now() });
        return Promise.resolve();
      }),
      destroy: jest.fn()
    };
    
    serviceRegistry.register('game', gameService);
    
    // Act
    await serviceRegistry.initServices();
    
    // Assert
    expect(eventSpy).toHaveBeenCalled();
    expect(gameService.init).toHaveBeenCalled();
  });
  
  test('should handle service dependencies correctly', async () => {
    // Arrange
    const initOrder = [];
    
    const audioService = {
      init: jest.fn().mockImplementation(() => {
        initOrder.push('audio');
        return Promise.resolve();
      }),
      destroy: jest.fn()
    };
    
    const playerService = {
      init: jest.fn().mockImplementation(() => {
        // This service depends on audio being initialized first
        const audio = serviceRegistry.get('audio');
        expect(audio).toBeDefined();
        initOrder.push('player');
        return Promise.resolve();
      }),
      destroy: jest.fn(),
      dependencies: ['audio']
    };
    
    serviceRegistry.register('audio', audioService);
    serviceRegistry.register('player', playerService);
    
    // Act
    await serviceRegistry.initServices();
    
    // Assert - verify initialization order respects dependencies
    expect(initOrder).toEqual(['audio', 'player']);
  });
});

// Integration test between Scene and GameLoop
describe('Scene and GameLoop Integration', () => {
  let scene;
  let gameLoop;
  let mockGame;
  
  beforeEach(() => {
    // Mock Phaser.Game
    mockGame = {
      loop: {
        start: jest.fn(),
        stop: jest.fn()
      },
      scene: {
        add: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        switch: jest.fn()
      },
      events: {
        emit: jest.fn(),
        on: jest.fn()
      }
    };
    
    // Create scene
    scene = new BaseScene('TestScene');
    scene.game = mockGame;
    
    // Create game loop
    gameLoop = new GameLoop(mockGame);
    
    // Spy on scene update method
    jest.spyOn(scene, 'update');
  });
  
  test('should call scene update method from game loop', () => {
    // Arrange
    const deltaTime = 16.667; // ~60fps
    const sceneUpdateCallback = (time, delta) => scene.update(time, delta);
    
    // Register scene's update method to game loop
    gameLoop.addUpdateCallback('sceneUpdate', sceneUpdateCallback);
    
    // Act
    gameLoop.update(1000, deltaTime);
    
    // Assert
    expect(scene.update).toHaveBeenCalledWith(1000, deltaTime);
  });
  
  test('should handle scene transitions in conjunction with game loop', () => {
    // Arrange
    const currentScene = 'TestScene';
    const nextScene = 'NextScene';
    const eventSystem = new GameEventSystem();
    const sceneTransitionSpy = jest.fn();
    
    // Listen for scene transition events
    eventSystem.on('scene.transition', sceneTransitionSpy);
    
    // Mock scene manager to emit event when switching scenes
    mockGame.scene.switch = jest.fn().mockImplementation((from, to, data) => {
      eventSystem.emit('scene.transition', { from, to, data });
    });
    
    // Act
    scene.transitionToScene(nextScene, { playerData: { health: 100 } });
    
    // Run update one last time for current scene
    gameLoop.update(1000, 16);
    
    // Assert
    expect(mockGame.scene.switch).toHaveBeenCalled();
    expect(sceneTransitionSpy).toHaveBeenCalledWith({
      from: currentScene,
      to: nextScene,
      data: { playerData: { health: 100 } }
    });
  });
});
```

### Snapshot Testing for Configuration Objects

Snapshot testing is particularly useful for configuration objects to detect unintended changes to default settings or structure.

```typescript
// Game configuration snapshot test
describe('GameConfigurationSystem Snapshots', () => {
  let configSystem;
  
  beforeEach(() => {
    configSystem = new GameConfigurationSystem();
  });
  
  test('default configuration should match snapshot', () => {
    // Act
    const defaultConfig = configSystem.getConfig();
    
    // Assert
    expect(defaultConfig).toMatchSnapshot();
  });
  
  test('development environment configuration should match snapshot', () => {
    // Arrange
    configSystem.setEnvironment('development');
    
    // Act
    const devConfig = configSystem.getConfig();
    
    // Assert
    expect(devConfig).toMatchSnapshot();
  });
  
  test('production environment configuration should match snapshot', () => {
    // Arrange
    configSystem.setEnvironment('production');
    
    // Act
    const prodConfig = configSystem.getConfig();
    
    // Assert
    expect(prodConfig).toMatchSnapshot();
  });
  
  test('should detect changes in configuration structure', () => {
    // Arrange
    const customConfig = {
      display: {
        width: 1024,
        height: 768,
        // Adding a new property that wasn't in the original config
        fullscreen: true
      }
    };
    
    // Act
    configSystem.setConfig(customConfig);
    const config = configSystem.getConfig();
    
    // Assert - This will fail if fullscreen property wasn't expected
    // Which alerts us to potential structure changes
    expect(config).toMatchSnapshot();
  });
});

// Example of a snapshot file (auto-generated by Jest)
// __snapshots__/GameConfigurationSystem.test.ts.snap
/*
exports[`GameConfigurationSystem Snapshots default configuration should match snapshot 1`] = `
Object {
  "debug": Object {
    "enabled": false,
    "showFPS": false,
    "showHitboxes": false,
  },
  "display": Object {
    "backgroundColor": "#000000",
    "height": 600,
    "width": 800,
  },
  "physics": Object {
    "enabled": true,
    "gravity": Object {
      "x": 0,
      "y": 300,
    },
  },
}
`;
*/
```

### Phaser-Specific Testing Best Practices

Testing Phaser games presents unique challenges. Here are some best practices:

```typescript
// Testing Phaser scenes
describe('PhaserScene Testing', () => {
  // Mock the Phaser namespace and objects
  beforeAll(() => {
    global.Phaser = {
      Scene: class MockScene {
        constructor(config) {
          this.config = config;
          this.sys = {
            settings: { active: false },
            events: { emit: jest.fn(), on: jest.fn(), once: jest.fn() }
          };
        }
      },
      GameObjects: {
        Image: class MockImage {
          constructor() {
            this.setOrigin = jest.fn().mockReturnThis();
            this.setPosition = jest.fn().mockReturnThis();
            this.setDepth = jest.fn().mockReturnThis();
          }
        },
        Sprite: class MockSprite {
          constructor() {
            this.setOrigin = jest.fn().mockReturnThis();
            this.play = jest.fn().mockReturnThis();
            this.setInteractive = jest.fn().mockReturnThis();
          }
        }
      }
    };
  });
  
  test('should handle Phaser-specific lifecycle methods', () => {
    // Arrange
    class TestScene extends Phaser.Scene {
      constructor() {
        super({ key: 'test' });
      }
      
      init(data) { this.sceneData = data; }
      preload() { /* preload logic */ }
      create() { /* create logic */ }
      update() { /* update logic */ }
    }
    
    // Create scene instance
    const scene = new TestScene();
    
    // Mock required Phaser objects
    scene.add = {
      image: jest.fn().mockReturnValue(new Phaser.GameObjects.Image()),
      sprite: jest.fn().mockReturnValue(new Phaser.GameObjects.Sprite())
    };
    
    scene.load = {
      image: jest.fn(),
      spritesheet: jest.fn()
    };
    
    // Act - call lifecycle methods
    scene.init({ level: 'test' });
    scene.preload();
    scene.create();
    
    // Assert
    expect(scene.sceneData.level).toBe('test');
  });
  
  test('should test input handlers correctly', () => {
    // Arrange
    const scene = new Phaser.Scene({ key: 'test' });
    const clickHandler = jest.fn();
    
    // Mock sprite and input system
    const sprite = new Phaser.GameObjects.Sprite();
    sprite.on = jest.fn();
    
    scene.input = {
      on: jest.fn()
    };
    
    // Act - set up click handler
    sprite.on('pointerdown', clickHandler);
    
    // Simulate click by directly calling the event handler
    const pointerEvent = { x: 100, y: 100 };
    sprite.on.mock.calls[0][1](pointerEvent);
    
    // Assert
    expect(clickHandler).toHaveBeenCalledWith(pointerEvent);
  });
  
  test('should test physics interactions', () => {
    // Arrange
    const scene = new Phaser.Scene({ key: 'test' });
    const collisionHandler = jest.fn();
    
    // Mock physics system
    scene.physics = {
      add: {
        collider: jest.fn(),
        overlap: jest.fn((obj1, obj2, callback) => {
          // Store the callback for manual triggering
          scene.testOverlapCallback = callback;
          return { active: true };
        })
      }
    };
    
    const player = { body: { velocity: { x: 0, y: 0 } } };
    const coin = { destroy: jest.fn() };
    
    // Act - set up collision handler
    scene.physics.add.overlap(player, coin, collisionHandler);
    
    // Manually trigger the collision callback
    scene.testOverlapCallback(player, coin);
    
    // Assert
    expect(collisionHandler).toHaveBeenCalledWith(player, coin);
  });
});

// Best practices for testing Phaser games
// 1. Isolate Phaser-dependent code for easier testing
// 2. Create abstraction layers that can be mocked
// 3. Use dependency injection for Phaser objects

// Example of testable, abstracted game component
class CollectibleManager {
  constructor(scene, collectibleFactory) {
    this.scene = scene;
    this.collectibleFactory = collectibleFactory;
    this.collectibles = [];
  }
  
  create(count, positions) {
    for (let i = 0; i < count; i++) {
      const pos = positions[i] || this.getRandomPosition();
      this.collectibles.push(
        this.collectibleFactory.create(pos.x, pos.y)
      );
    }
    return this.collectibles;
  }
  
  getRandomPosition() {
    // Generate random position
    return {
      x: Math.random() * 800,
      y: Math.random() * 600
    };
  }
}

// Testing the abstracted component
test('CollectibleManager should create correct number of collectibles', () => {
  // Arrange
  const mockScene = {};
  const mockFactory = {
    create: jest.fn().mockImplementation((x, y) => ({ x, y, type: 'coin' }))
  };
  
  const manager = new CollectibleManager(mockScene, mockFactory);
  
  // Act
  const positions = [{ x: 100, y: 200 }, { x: 300, y: 400 }];
  const collectibles = manager.create(2, positions);
  
  // Assert
  expect(collectibles.length).toBe(2);
  expect(mockFactory.create).toHaveBeenCalledTimes(2);
  expect(mockFactory.create).toHaveBeenCalledWith(100, 200);
  expect(mockFactory.create).toHaveBeenCalledWith(300, 400);
});
```

### Asset Testing

Game assets require specific testing to ensure they load correctly and perform as expected:

```typescript
// assetTesting.test.ts
describe('Game Asset Tests', () => {
  let assetLoader;
  
  beforeEach(() => {
    // Create asset loader with mocked Phaser loader
    assetLoader = new AssetLoader({
      load: {
        image: jest.fn().mockImplementation((key, path) => {
          return { key, path };
        }),
        audio: jest.fn().mockImplementation((key, path) => {
          return { key, path };
        }),
        spritesheet: jest.fn().mockImplementation((key, path, config) => {
          return { key, path, config };
        }),
        on: jest.fn()
      }
    });
  });
  
  test('should load sprite sheets with correct dimensions', async () => {
    // Mock image load response
    const mockImage = {
      width: 384,
      height: 256
    };
    
    // Test sprite sheet configuration
    const spritesheet = assetLoader.loadSpritesheet('player', 'assets/player.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Calculate expected frames based on dimensions
    const expectedFrames = (mockImage.width / 32) * (mockImage.height / 32);
    
    // Verify dimensions and frame count
    expect(spritesheet.config.frameWidth).toBe(32);
    expect(spritesheet.config.frameHeight).toBe(32);
    expect(Math.floor(mockImage.width / spritesheet.config.frameWidth) * 
           Math.floor(mockImage.height / spritesheet.config.frameHeight)).toBe(expectedFrames);
  });
  
  test('should verify audio asset formats for cross-browser support', () => {
    // Test audio format support
    const audioAsset = assetLoader.loadAudio('background', [
      'assets/audio/background.mp3',
      'assets/audio/background.ogg'
    ]);
    
    // Check format support
    const formats = Array.isArray(audioAsset.path) ? audioAsset.path : [audioAsset.path];
    const hasMP3 = formats.some(path => path.endsWith('.mp3'));
    const hasOGG = formats.some(path => path.endsWith('.ogg'));
    
    // Verify multiple formats for browser compatibility
    expect(hasMP3).toBe(true);
    expect(hasOGG).toBe(true);
  });
  
  test('should optimize texture atlases', () => {
    // Test atlas configuration
    const atlas = assetLoader.loadAtlas('ui', 'assets/ui/atlas.png', 'assets/ui/atlas.json');
    
    // Mock atlas data
    const atlasData = {
      frames: {
        'button': { frame: { x: 0, y: 0, w: 100, h: 50 } },
        'icon': { frame: { x: 0, y: 50, w: 32, h: 32 } }
      }
    };
    
    // Verify atlas processing
    const efficiency = calculateAtlasEfficiency(atlasData);
    expect(efficiency).toBeGreaterThan(0.75); // At least 75% space utilization
  });
  
  // Helper to calculate atlas efficiency (unused space)
  function calculateAtlasEfficiency(atlasData) {
    // Calculate total frame area
    let totalFrameArea = 0;
    Object.values(atlasData.frames).forEach(frame => {
      const f = frame.frame;
      totalFrameArea += f.w * f.h;
    });
    
    // Estimate atlas size (find max bounds)
    let maxX = 0, maxY = 0;
    Object.values(atlasData.frames).forEach(frame => {
      const f = frame.frame;
      maxX = Math.max(maxX, f.x + f.w);
      maxY = Math.max(maxY, f.y + f.h);
    });
    
    const atlasArea = maxX * maxY;
    return totalFrameArea / atlasArea;
  }
});

### Asset State Persistence Testing

Tests to verify that asset state is correctly saved and loaded:

```typescript
// assetPersistence.test.ts
describe('Asset State Persistence Tests', () => {
  let saveService;
  let assetService;
  
  beforeEach(() => {
    // Mock localStorage
    const mockStorage = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        clear: jest.fn(() => { store = {}; })
      };
    })();
    
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    
    // Initialize services
    saveService = new SaveService();
    assetService = new AssetService(saveService);
  });
  
  test('should persist modified world object states', async () => {
    // Arrange
    const objectState = {
      id: 'chest_123',
      type: 'chest',
      position: { x: 100, y: 200 },
      isOpen: true,
      contents: ['gold_coin', 'health_potion']
    };
    
    // Act
    await assetService.trackWorldObjectState(objectState);
    await saveService.saveGame('test-save');
    
    // Get saved data
    const savedData = JSON.parse(localStorage.getItem('gameState_test-save'));
    
    // Assert
    expect(savedData.worldObjects).toBeDefined();
    expect(savedData.worldObjects['chest_123']).toEqual(objectState);
  });
  
  test('should optimize storage by saving only state delta for modified objects', async () => {
    // Arrange
    const originalState = {
      id: 'door_456',
      type: 'door',
      position: { x: 300, y: 400 },
      isLocked: true,
      requiredKey: 'rusty_key'
    };
    
    // Mock a template object (assumed to be in original game data)
    assetService.registerTemplateObject('door_456', {
      id: 'door_456',
      type: 'door',
      position: { x: 300, y: 400 },
      isLocked: true,
      requiredKey: 'rusty_key'
    });
    
    // Modified state (only isLocked changed)
    const modifiedState = {
      ...originalState,
      isLocked: false
    };
    
    // Act
    await assetService.trackWorldObjectState(modifiedState);
    await saveService.saveGame('delta-test');
    
    // Get saved data
    const savedData = JSON.parse(localStorage.getItem('gameState_delta-test'));
    
    // Assert
    expect(savedData.worldObjects['door_456']).toEqual({
      id: 'door_456',
      isLocked: false  // Only the changed property should be stored
    });
  });
  
  test('should correctly restore world objects from saved state', async () => {
    // Arrange
    const savedState = {
      worldObjects: {
        'resource_789': {
          id: 'resource_789',
          type: 'ore_vein',
          harvested: true,
          respawnTime: 300000  // 5 minutes
        }
      }
    };
    
    // Mock local storage with saved game
    localStorage.setItem('gameState_restore-test', JSON.stringify(savedState));
    
    // Act
    await saveService.loadGame('restore-test');
    const restoredObject = assetService.getWorldObjectState('resource_789');
    
    // Assert
    expect(restoredObject).toBeDefined();
    expect(restoredObject.harvested).toBe(true);
    expect(restoredObject.respawnTime).toBe(300000);
  });
});
```

### Save Data Storage Optimization Tests

Tests to verify storage optimization strategies:

```typescript
// storageOptimization.test.ts
describe('Save Data Storage Optimization Tests', () => {
  let saveService;
  let storageService;
  
  beforeEach(() => {
    storageService = new StorageService();
    saveService = new SaveService(storageService);
  });
  
  test('should use reference-based saving for static assets', async () => {
    // Arrange
    const gameState = {
      player: {
        equipment: {
          weapon: 'iron_sword',  // Reference to a static asset
          armor: 'leather_armor'  // Reference to a static asset
        }
      }
    };
    
    // Act
    await saveService.saveGameState('reference-test', gameState);
    const savedData = await storageService.getData('gameState_reference-test');
    
    // Assert
    expect(savedData.player.equipment.weapon).toBe('iron_sword');
    expect(savedData.player.equipment.armor).toBe('leather_armor');
    // Verify no unnecessary duplication of static asset data
    expect(savedData.assets).toBeUndefined();
  });
  
  test('should correctly handle save data exceeding localStorage limits', async () => {
    // Arrange
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn().mockImplementation(() => {
        // Simulate quota exceeded error on the third call
        if (mockStorage.setItem.mock.calls.length === 3) {
          throw new Error('QuotaExceededError');
        }
      }),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    
    // Mock IndexedDB
    const mockIDBRequest = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null
    };
    const mockIDB = {
      open: jest.fn().mockReturnValue(mockIDBRequest)
    };
    Object.defineProperty(window, 'indexedDB', { value: mockIDB });
    
    // Large game state
    const largeGameState = {
      player: { /* ... */ },
      inventory: Array(1000).fill(0).map((_, i) => ({ id: `item_${i}` })),
      worldState: { /* ... */ }
    };
    
    // Act
    const savePromise = saveService.saveGameState('large-test', largeGameState);
    
    // Simulate IndexedDB success
    mockIDBRequest.onsuccess?.({});
    
    // Assert
    await savePromise;
    expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
    expect(mockIDB.open).toHaveBeenCalled();
  });
  
  test('should optimize save size using delta encoding', async () => {
    // Arrange
    const originalState = {
      player: {
        position: { x: 100, y: 200 },
        health: 100,
        mana: 50,
        inventory: ['potion', 'scroll']
      }
    };
    
    // Mock previous save
    await storageService.saveData('gameState_delta-encode-test', originalState);
    
    // Slightly modified state
    const newState = {
      player: {
        position: { x: 105, y: 210 }, // Changed
        health: 90,                    // Changed
        mana: 50,                      // Same
        inventory: ['potion', 'scroll', 'gold'] // Changed
      }
    };
    
    // Act - save with delta encoding
    await saveService.saveGameStateWithDelta('delta-encode-test', newState);
    
    // Get saved delta
    const savedDelta = await storageService.getData('gameState_delta-encode-test_delta');
    
    // Assert - only changed properties should be in delta
    expect(savedDelta).toEqual({
      player: {
        position: { x: 105, y: 210 },
        health: 90,
        inventory: ['potion', 'scroll', 'gold']
      }
    });
    expect(savedDelta.player.mana).toBeUndefined(); // Unchanged property not in delta
  });
});
```

### Asset Version Compatibility Testing

Tests to verify version compatibility and migration:

```typescript
// assetVersioning.test.ts
describe('Asset Version Compatibility Tests', () => {
  let assetService;
  let saveService;
  
  beforeEach(() => {
    assetService = new AssetService();
    saveService = new SaveService(assetService);
  });
  
  test('should handle loading saves with outdated asset versions', async () => {
    // Arrange - Create save with old asset version
    const oldSaveData = {
      version: '0.9.0',
      assets: {
        versions: {
          'playerSprite': '1.0',
          'worldTiles': '1.2'
        }
      },
      player: {
        sprite: 'playerSprite',
        position: { x: 100, y: 200 }
      }
    };
    
    // Mock current asset versions
    assetService.currentAssetVersions = {
      'playerSprite': '1.1', // Updated version
      'worldTiles': '1.3',   // Updated version
      'newAsset': '1.0'      // New asset
    };
    
    // Define migration paths
    assetService.registerMigrationPath('playerSprite', '1.0', '1.1', (oldData) => {
      // Transform data for compatibility
      return { ...oldData, animationVersion: 'updated' };
    });
    
    // Mock localStorage with old save
    localStorage.setItem('gameState_version-test', JSON.stringify(oldSaveData));
    
    // Act
    const compatibilityResult = await saveService.checkSaveCompatibility('version-test');
    await saveService.loadGame('version-test');
    
    // Assert
    expect(compatibilityResult.compatible).toBe(true);
    expect(compatibilityResult.migratedAssets).toEqual(['playerSprite', 'worldTiles']);
    expect(compatibilityResult.missing).toEqual([]);
    
    // Verify migration was applied
    const playerData = saveService.getCurrentGameState().player;
    expect(playerData.animationVersion).toBe('updated');
  });
  
  test('should detect incompatible saves that cannot be migrated', async () => {
    // Arrange - Create save with incompatible asset version
    const incompatibleSaveData = {
      version: '0.5.0', // Very old version
      assets: {
        versions: {
          'oldAsset': '1.0' // Asset that no longer exists
        }
      }
    };
    
    // Mock current asset versions (missing the old asset)
    assetService.currentAssetVersions = {
      'newAsset1': '1.0',
      'newAsset2': '1.0'
    };
    
    // No migration path available
    
    // Mock localStorage with incompatible save
    localStorage.setItem('gameState_incompatible-test', JSON.stringify(incompatibleSaveData));
    
    // Act
    const compatibilityResult = await saveService.checkSaveCompatibility('incompatible-test');
    
    // Assert
    expect(compatibilityResult.compatible).toBe(false);
    expect(compatibilityResult.missingAssets).toEqual(['oldAsset']);
    expect(compatibilityResult.tooOldVersion).toBe(true);
  });
  
  test('should generate valid data checksums for integrity validation', async () => {
    // Arrange
    const gameState = {
      player: {
        position: { x: 100, y: 200 },
        health: 100
      },
      worldObjects: {
        'chest_123': { isOpen: true }
      }
    };
    
    // Act
    const checksum = saveService.generateChecksum(gameState);
    await saveService.saveGameState('checksum-test', gameState);
    
    // Get saved data
    const savedData = JSON.parse(localStorage.getItem('gameState_checksum-test'));
    
    // Assert
    expect(savedData._checksum).toBeDefined();
    expect(savedData._checksum).toBe(checksum);
    
    // Verify checksum validation works
    const isValid = saveService.validateChecksum(savedData, savedData._checksum);
    expect(isValid).toBe(true);
    
    // Modify data and verify checksum fails
    savedData.player.health = 90;
    const isModifiedValid = saveService.validateChecksum(savedData, savedData._checksum);
    expect(isModifiedValid).toBe(false);
  });
});
```

### Browser Storage Limits and Fallback Tests

Tests to verify handling of browser storage limitations:

```typescript
// browserStorageLimits.test.ts
describe('Browser Storage Limits and Fallback Tests', () => {
  let storageService;
  
  beforeEach(() => {
    // Mock storage with size tracking
    const mockLocalStorage = (() => {
      let store = {};
      let usedBytes = 0;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB mock limit
      
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          // Calculate size
          const itemSize = (key.length + value.length) * 2; // Unicode = 2 bytes per char
          
          // Check if adding this would exceed quota
          if (usedBytes + itemSize > MAX_SIZE) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          
          store[key] = value;
          usedBytes += itemSize;
        }),
        clear: jest.fn(() => { 
          store = {}; 
          usedBytes = 0;
        }),
        removeItem: jest.fn(key => {
          if (store[key]) {
            usedBytes -= (key.length + store[key].length) * 2;
            delete store[key];
          }
        }),
        // Helper to simulate storage being almost full
        fillStorage: (percentFull) => {
          const fillSize = MAX_SIZE * percentFull / 100;
          const dummyData = 'x'.repeat(fillSize / 2); // Divide by 2 for Unicode
          try {
            mockLocalStorage.setItem('__dummy__', dummyData);
          } catch (e) {
            // Ignore overflow errors during test setup
          }
        }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Mock IndexedDB
    const mockIndexedDB = createMockIndexedDB();
    Object.defineProperty(window, 'indexedDB', { value: mockIndexedDB });
    
    // Initialize storage service
    storageService = new StorageService();
  });
  
  test('should automatically fall back to IndexedDB when localStorage is full', async () => {
    // Arrange - Fill localStorage to 90% capacity
    localStorage.fillStorage(90);
    
    // Create data large enough to exceed remaining localStorage
    const largeData = {
      id: 'test-large-data',
      content: 'x'.repeat(1024 * 1024) // 1MB of data
    };
    
    // Act
    await storageService.saveData('large-data-key', largeData);
    
    // Assert
    expect(localStorage.setItem).toHaveBeenCalled();
    // Verify we attempted IndexedDB after localStorage failed
    expect(window.indexedDB.open).toHaveBeenCalled();
  });
  
  test('should prioritize critical data in localStorage and move non-critical to IndexedDB', async () => {
    // Arrange
    const criticalData = {
      player: {
        position: { x: 100, y: 200 },
        health: 100
      }
    };
    
    const nonCriticalData = {
      discoveredLocations: Array(100).fill(0).map((_, i) => ({ 
        id: `location_${i}`,
        name: `Location ${i}`,
        discovered: true
      }))
    };
    
    // Act
    await storageService.saveCriticalData('player-data', criticalData);
    await storageService.saveNonCriticalData('discovered-locations', nonCriticalData);
    
    // Assert
    expect(localStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('player-data'),
      expect.any(String)
    );
    expect(window.indexedDB.open).toHaveBeenCalled();
  });
  
  test('should implement size reduction strategies when storage is nearly full', async () => {
    // Arrange - Fill localStorage to 95% capacity
    localStorage.fillStorage(95);
    
    // Mock a service that handles storage optimization
    const storageOptimizer = {
      reduceSize: jest.fn(async () => {
        // Simulate removing some items to free space
        localStorage.removeItem('__dummy__');
        return true;
      })
    };
    
    storageService.setOptimizer(storageOptimizer);
    
    // Data to save
    const newData = { id: 'test-data', value: 'important information' };
    
    // Act
    await storageService.saveData('important-key', newData);
    
    // Assert
    expect(storageOptimizer.reduceSize).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'important-key',
      expect.stringContaining('important information')
    );
  });
  
  test('should handle complete storage failure with error reporting', async () => {
    // Arrange - Mock both localStorage and IndexedDB to fail
    localStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    window.indexedDB.open.mockImplementation(() => {
      const request = {};
      setTimeout(() => {
        request.onerror?.({ target: { error: new Error('IndexedDB error') } });
      }, 10);
      return request;
    });
    
    // Create error handler spy
    const errorHandler = jest.fn();
    storageService.setErrorHandler(errorHandler);
    
    // Data to save
    const data = { id: 'test-data', value: 'cannot be saved' };
    
    // Act & Assert
    await expect(storageService.saveData('doomed-key', data)).rejects.toThrow();
    expect(errorHandler).toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ 
        type: 'STORAGE_FAILURE', 
        attempts: expect.any(Number)
      })
    );
  });
});

// Helper to create mock IndexedDB
function createMockIndexedDB() {
  const stores = new Map();
  
  return {
    open: jest.fn().mockImplementation((dbName) => {
      const request = {
        result: {
          createObjectStore: jest.fn((storeName) => {
            stores.set(storeName, new Map());
            return {
              put: jest.fn(),
              transaction: { commit: jest.fn() }
            };
          }),
          transaction: jest.fn().mockImplementation((storeNames, mode) => {
            return {
              objectStore: jest.fn().mockImplementation((storeName) => {
                if (!stores.has(storeName)) {
                  stores.set(storeName, new Map());
                }
                
                return {
                  put: jest.fn().mockImplementation((value, key) => {
                    const putRequest = {};
                    stores.get(storeName).set(key, value);
                    setTimeout(() => {
                      putRequest.onsuccess?.({});
                    }, 10);
                    return putRequest;
                  }),
                  get: jest.fn().mockImplementation((key) => {
                    const getRequest = {};
                    setTimeout(() => {
                      getRequest.result = stores.get(storeName).get(key);
                      getRequest.onsuccess?.({});
                    }, 10);
                    return getRequest;
                  })
                };
              }),
              commit: jest.fn()
            };
          })
        },
        onsuccess: null,
        onerror: null
      };
      
      setTimeout(() => {
        request.onsuccess?.({});
      }, 10);
      
      return request;
    })
  };
}
```

These comprehensive asset and storage tests ensure:
1. Assets are correctly tracked in the save system
2. Storage optimization techniques work properly
3. Asset versioning and compatibility are maintained
4. Browser storage limitations are handled gracefully

By implementing these tests, we can ensure the asset/save integration remains robust as the game evolves. 