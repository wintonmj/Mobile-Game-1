---
version: 1.0.0
last_updated: 2024-04-01
author: Development Team
---

# Game Testing Implementation Details

## Version History
- v1.0.0 (2024-04-01): Initial documentation
- For full changelog, see [CHANGELOG.md](../CHANGELOG.md)

## Document Purpose
This document provides practical code examples and implementation details for testing game-specific patterns. It aims to guide developers in implementing effective tests for state machines, event systems, and their integration in complex game components.

## Navigation
- [← Back to Testing Overview](./README.md)
- [↑ Up to Project Documentation](../README.md)

## Related Documents
- [Jest Testing Strategy](./jest-testing-strategy.md) - Overall testing strategy
- [Coverage Requirements](./coverage-requirements.md) - Test coverage standards
- [Unit Testing Guide](./unit-testing/index.md) - Unit testing guidelines
- [Integration Testing Guide](./integration-testing/index.md) - Integration testing guidelines

## Contents
- [Game-Specific Test Patterns](#game-specific-test-patterns)
  - [Service Registry Testing](#service-registry-testing)
  - [Event-Based System Testing](#event-based-system-testing)
  - [Scene Lifecycle Testing](#scene-lifecycle-testing)
  - [Game Loop and Configuration Testing](#game-loop-and-configuration-testing)
  - [State Machine Testing](#state-machine-testing)
  - [Combining State and Events in Complex Tests](#combining-state-and-events-in-complex-tests)
  - [Input Handling Tests](#input-handling-tests)
  - [Asset Loading Tests](#asset-loading-tests)
  - [Memory and Performance Testing](#memory-and-performance-testing)
  - [Physics and Collision Testing](#physics-and-collision-testing)
  - [Advanced Test Patterns](#advanced-test-patterns)

## Game-Specific Test Patterns

This section provides practical code examples for the game-specific test patterns outlined in the [Jest Testing Strategy](./jest-testing-strategy.md#game-specific-test-patterns), organized according to the components identified in the [Sprint 1 Implementation Plan](../Implementation/Sprint1ImplementationPlan.md).

### Service Registry Testing

```typescript
/**
 * @class ServiceRegistry
 * @description Core service management system that maintains references to all game services
 * @example
 * const registry = ServiceRegistry.getInstance();
 * registry.register('audioService', new AudioService());
 */
describe('ServiceRegistry', () => {
  let serviceRegistry;
  
  beforeEach(() => {
    // Reset singleton for each test
    ServiceRegistry.instance = null;
    serviceRegistry = ServiceRegistry.getInstance();
  });
  
  /**
   * @test Singleton Pattern
   * @description Verifies that ServiceRegistry maintains a single instance
   */
  test('should maintain a singleton instance', () => {
    // Arrange & Act
    const instance1 = ServiceRegistry.getInstance();
    const instance2 = ServiceRegistry.getInstance();
    
    // Assert
    expect(instance1).toBe(instance2);
  });
  
  /**
   * @test Service Registration
   * @description Tests the registration and retrieval of services
   */
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

/**
 * @interface GameEvent
 * @description Represents a game event with its payload
 * @property {string} type - The type of event
 * @property {any} payload - The event payload
 */

/**
 * @class GameEventSystem
 * @description Manages game-wide event communication
 * @example
 * const eventSystem = new GameEventSystem();
 * eventSystem.on('player.damage', (event) => handleDamage(event));
 */
describe('GameEventSystem', () => {
  let eventSystem;
  let playerEntity;
  let enemyEntity;
  
  beforeEach(() => {
    // Reset event system
    eventSystem = new GameEventSystem();
    
    // Create test entities with typed parameters
    playerEntity = createTestPlayer({ id: 'player-1', health: 100 });
    enemyEntity = createTestEnemy({ id: 'enemy-1', health: 50 });
  });
  
  /**
   * @test Event Emission
   * @description Verifies that damage events are properly emitted with correct payload
   */
  test('should emit damage event when entity takes damage', () => {
    // Arrange
    const damageSpy = jest.fn();
    eventSystem.on('entity.damaged', damageSpy);
    
    // Act
    playerEntity.takeDamage(10);
    
    // Assert
    expect(damageSpy).toHaveBeenCalledWith({
      entityId: 'player-1',
      damageAmount: 10,
      currentHealth: 90,
      type: 'physical'
    });
  });
  
  test('should handle multiple event subscriptions correctly', () => {
    // Arrange
    const gameUISpy = jest.fn();
    const audioSpy = jest.fn();
    const achievementSpy = jest.fn();
    
    eventSystem.on('entity.defeated', gameUISpy);
    eventSystem.on('entity.defeated', audioSpy);
    eventSystem.on('entity.defeated', achievementSpy);
    
    // Act
    enemyEntity.takeDamage(50); // This should defeat the enemy
    
    // Assert - all subscribers should be notified
    expect(gameUISpy).toHaveBeenCalledTimes(1);
    expect(audioSpy).toHaveBeenCalledTimes(1);
    expect(achievementSpy).toHaveBeenCalledTimes(1);
    
    // Verify payload
    expect(gameUISpy).toHaveBeenCalledWith({
      entityId: 'enemy-1',
      entityType: 'enemy',
      defeatedBy: 'player-1'
    });
  });
  
  test('should unsubscribe event listeners correctly', () => {
    // Arrange
    const inventoryUpdateSpy = jest.fn();
    const unsubscribe = eventSystem.on('inventory.updated', inventoryUpdateSpy);
    
    // Act - first event emission
    playerEntity.addToInventory({ id: 'potion', type: 'consumable' });
    
    // Assert - listener was called
    expect(inventoryUpdateSpy).toHaveBeenCalledTimes(1);
    
    // Act - unsubscribe and emit again
    unsubscribe();
    playerEntity.addToInventory({ id: 'sword', type: 'weapon' });
    
    // Assert - listener was not called again
    expect(inventoryUpdateSpy).toHaveBeenCalledTimes(1);
  });
  
  test('should bubble events up component hierarchy', () => {
    // Arrange - create component hierarchy
    const worldSpy = jest.fn();
    const zoneSpy = jest.fn();
    
    const world = new GameWorld();
    const zone = new GameZone('dungeon');
    const room = new GameRoom('boss-chamber');
    
    world.addZone(zone);
    zone.addRoom(room);
    
    world.events.on('entity.spawned', worldSpy);
    zone.events.on('entity.spawned', zoneSpy);
    
    // Act - spawn entity in room
    room.spawnEntity(enemyEntity);
    
    // Assert - event bubbled up
    expect(zoneSpy).toHaveBeenCalledTimes(1);
    expect(worldSpy).toHaveBeenCalledTimes(1);
    expect(worldSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'enemy-1',
        location: {
          world: world.id,
          zone: 'dungeon',
          room: 'boss-chamber'
        }
      })
    );
  });
  
  test('should handle event payload transformations', () => {
    // Arrange
    const questSpy = jest.fn();
    
    // Setup a quest system that transforms entity.defeated events into quest.progress events
    const questSystem = new QuestSystem(eventSystem);
    questSystem.events.on('quest.progress', questSpy);
    
    // Setup active quest that watches for enemy defeats
    questSystem.addQuest({
      id: 'kill-enemies',
      target: { entityType: 'enemy', count: 3 },
      progress: 0,
      completed: false
    });
    
    // Act - defeat enemies
    eventSystem.emit('entity.defeated', { entityId: 'enemy-1', entityType: 'enemy', defeatedBy: 'player-1' });
    
    // Assert - event was transformed
    expect(questSpy).toHaveBeenCalledWith({
      questId: 'kill-enemies',
      progress: 1,
      target: 3,
      completed: false
    });
  });
});

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
    scene = new MainGameScene();
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
    expect(scene.currentLevel).toBe('forest');
    expect(scene.playerData.health).toBe(100);
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
    
    // Assert
    expect(scene.load.image).toHaveBeenCalledWith('background', 'assets/images/forest_bg.png');
    expect(scene.load.spritesheet).toHaveBeenCalledWith(
      'player',
      'assets/sprites/player.png',
      { frameWidth: 64, frameHeight: 64 }
    );
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
    expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'background');
    expect(scene.anims.create).toHaveBeenCalled();
    expect(scene.physics.add.sprite).toHaveBeenCalled();
    expect(scene.isInitialized).toBe(true);
  });
  
  test('should update game objects on frame update', () => {
    // Arrange
    scene.init({ level: 'forest' });
    scene.create();
    scene.player = {
      update: jest.fn(),
      x: 100,
      y: 100
    };
    scene.enemies = [{ update: jest.fn() }, { update: jest.fn() }];
    const time = 1000;
    const delta = 16;
    
    // Act
    scene.update(time, delta);
    
    // Assert
    expect(scene.player.update).toHaveBeenCalledWith(time, delta);
    expect(scene.enemies[0].update).toHaveBeenCalledWith(time, delta);
    expect(scene.enemies[1].update).toHaveBeenCalledWith(time, delta);
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
      scene.scene.key,
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

### State Machine Testing

As described in our [Jest Testing Strategy](./jest-testing-strategy.md#game-specific-test-patterns), state machines are a critical part of game logic. Here are practical examples for testing state transitions:

```typescript
// Character state machine test
describe('Character State Machine', () => {
  let character;
  
  beforeEach(() => {
    character = new Character('test-character');
  });
  
  test('should transition from idle to walking when move command is issued', () => {
    // Arrange - starting state
    expect(character.currentState).toBe(CharacterState.IDLE);
    
    // Act - trigger state change
    character.move({ x: 10, y: 0 });
    
    // Assert - verify new state
    expect(character.currentState).toBe(CharacterState.WALKING);
    expect(character.velocity.x).toBe(10);
  });
  
  test('should transition from walking to running when sprint command is issued', () => {
    // Arrange - set up initial state
    character.move({ x: 10, y: 0 });
    expect(character.currentState).toBe(CharacterState.WALKING);
    
    // Act - trigger next state change
    character.sprint();
    
    // Assert - verify new state and properties
    expect(character.currentState).toBe(CharacterState.RUNNING);
    expect(character.velocity.x).toBeGreaterThan(10); // Running is faster
    expect(character.stamina).toBeLessThan(100); // Stamina should decrease
  });
  
  test('should not transition to jumping when swimming', () => {
    // Arrange - set up complex initial state
    character.move({ x: 0, y: 0 });
    character.enterWater();
    expect(character.currentState).toBe(CharacterState.SWIMMING);
    
    // Act - attempt invalid transition
    character.jump();
    
    // Assert - verify state unchanged
    expect(character.currentState).toBe(CharacterState.SWIMMING);
    expect(character.jumpAttempted).toBe(true);
    expect(character.errorMessage).toContain('Cannot jump while swimming');
  });
  
  test('should transition through complete attack sequence', () => {
    // Arrange
    const stateSpy = jest.fn();
    character.onStateChange = stateSpy;
    
    // Act - trigger attack sequence
    character.attack();
    
    // Fast-forward through animation frames
    jest.advanceTimersByTime(100); // Wind-up phase
    jest.advanceTimersByTime(100); // Strike phase
    jest.advanceTimersByTime(300); // Recovery phase
    
    // Assert - verify state transition sequence
    expect(stateSpy).toHaveBeenCalledTimes(4);
    expect(stateSpy.mock.calls[0][0]).toBe(CharacterState.ATTACK_WINDUP);
    expect(stateSpy.mock.calls[1][0]).toBe(CharacterState.ATTACK_STRIKE);
    expect(stateSpy.mock.calls[2][0]).toBe(CharacterState.ATTACK_RECOVERY);
    expect(stateSpy.mock.calls[3][0]).toBe(CharacterState.IDLE);
    
    // Verify final state
    expect(character.currentState).toBe(CharacterState.IDLE);
  });
});
```

### Combining State and Events in Complex Tests

Game systems often combine state machines and event systems. Here's an example testing their integration:

```typescript
describe('CombatSystem - State and Events Integration', () => {
  let combatSystem;
  let player;
  let enemy;
  let eventSpy;
  
  beforeEach(() => {
    combatSystem = new CombatSystem();
    player = createTestPlayer();
    enemy = createTestEnemy();
    
    // Add entities to combat system
    combatSystem.addCombatant(player);
    combatSystem.addCombatant(enemy);
    
    // Spy on all events
    eventSpy = jest.fn();
    combatSystem.events.onAny(eventSpy);
  });
  
  test('should transition through combat states and emit appropriate events', () => {
    // Arrange - ensure starting state
    expect(combatSystem.state).toBe(CombatState.INACTIVE);
    
    // Act - initialize combat
    combatSystem.initiateCombat();
    
    // Assert - verify state and events
    expect(combatSystem.state).toBe(CombatState.INITIALIZING);
    expect(eventSpy).toHaveBeenCalledWith('combat.initializing', { combatants: [player.id, enemy.id] });
    
    // Act - start combat
    eventSpy.mockClear();
    combatSystem.startCombat();
    
    // Assert
    expect(combatSystem.state).toBe(CombatState.ACTIVE);
    expect(eventSpy).toHaveBeenCalledWith('combat.started', expect.any(Object));
    
    // Act - player attacks
    eventSpy.mockClear();
    combatSystem.executeTurn({
      actorId: player.id,
      action: 'attack',
      targetId: enemy.id
    });
    
    // Assert - verify combat resolution events
    expect(eventSpy).toHaveBeenCalledWith('combat.action.started', expect.any(Object));
    expect(eventSpy).toHaveBeenCalledWith('entity.damaged', expect.any(Object));
    expect(eventSpy).toHaveBeenCalledWith('combat.action.completed', expect.any(Object));
    
    // Act - defeat enemy
    eventSpy.mockClear();
    enemy.health = 1; // Set enemy near death
    combatSystem.executeTurn({
      actorId: player.id,
      action: 'attack',
      targetId: enemy.id
    });
    
    // Assert - verify combat end state and events
    expect(eventSpy).toHaveBeenCalledWith('entity.defeated', expect.objectContaining({ entityId: enemy.id }));
    expect(eventSpy).toHaveBeenCalledWith('combat.ended', expect.any(Object));
    expect(combatSystem.state).toBe(CombatState.COMPLETED);
  });
});
```

### Input Handling Tests

Testing input handling is critical for ensuring correct game control responses. Here are examples for testing input systems:

```typescript
describe('InputManager', () => {
  let inputManager;
  let mockScene;
  let keyDownHandlers;
  let keyUpHandlers;
  
  beforeEach(() => {
    // Track event handlers
    keyDownHandlers = {};
    keyUpHandlers = {};
    
    // Mock browser keyboard events
    const mockAddEventListener = jest.fn((event, handler) => {
      if (event === 'keydown') keyDownHandlers[event] = handler;
      if (event === 'keyup') keyUpHandlers[event] = handler;
    });
    
    // Mock document
    global.document = {
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn()
    };
    
    // Mock Phaser scene
    mockScene = {
      input: {
        keyboard: {
          addKey: jest.fn(key => ({
            key: key,
            isDown: false,
            on: jest.fn((event, handler) => {
              if (event === 'down') keyDownHandlers[key] = handler;
              if (event === 'up') keyUpHandlers[key] = handler;
            })
          }))
        }
      }
    };
    
    // Create input manager with spies
    inputManager = new InputManager(mockScene);
    jest.spyOn(inputManager, 'onKeyDown');
    jest.spyOn(inputManager, 'onKeyUp');
    jest.spyOn(inputManager.events, 'emit');
  });
  
  test('should register key handlers for movement keys', () => {
    // Act
    inputManager.initialize();
    
    // Assert
    expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('W');
    expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('A');
    expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('S');
    expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('D');
    expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('SPACE');
  });
  
  test('should emit move event when movement key pressed', () => {
    // Arrange
    inputManager.initialize();
    
    // Act - simulate W key down
    if (keyDownHandlers['W']) keyDownHandlers['W']();
    
    // Assert
    expect(inputManager.onKeyDown).toHaveBeenCalled();
    expect(inputManager.events.emit).toHaveBeenCalledWith('move', { x: 0, y: -1 });
  });
  
  test('should emit action event when action button pressed', () => {
    // Arrange
    inputManager.initialize();
    const actionHandler = jest.fn();
    inputManager.events.on('action', actionHandler);
    
    // Act - simulate SPACE key down
    if (keyDownHandlers['SPACE']) keyDownHandlers['SPACE']();
    
    // Assert
    expect(inputManager.onKeyDown).toHaveBeenCalled();
    expect(actionHandler).toHaveBeenCalled();
  });
  
  test('should handle diagonal movement correctly', () => {
    // Arrange
    inputManager.initialize();
    const moveHandler = jest.fn();
    inputManager.events.on('move', moveHandler);
    
    // Act - press two keys for diagonal movement
    if (keyDownHandlers['W']) keyDownHandlers['W']();
    if (keyDownHandlers['D']) keyDownHandlers['D']();
    
    // Assert - check latest move event has both x and y components
    expect(moveHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 1, y: -1 })
    );
  });
  
  test('should clean up event listeners on destroy', () => {
    // Arrange
    inputManager.initialize();
    
    // Act
    inputManager.destroy();
    
    // Assert
    expect(global.document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(global.document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
  });
});
```

### Asset Loading Tests

Testing asset loading is vital for ensuring game resources are properly loaded. Here are practical examples:

```typescript
describe('AssetLoader', () => {
  let assetLoader;
  let mockScene;
  
  beforeEach(() => {
    // Create load event tracking
    const loadEventHandlers = {};
    
    // Mock Phaser scene with loader
    mockScene = {
      load: {
        image: jest.fn(),
        audio: jest.fn(),
        spritesheet: jest.fn(),
        atlas: jest.fn(),
        on: jest.fn((event, handler) => {
          loadEventHandlers[event] = handler;
        }),
        off: jest.fn(),
        // Method to trigger events for testing
        _triggerEvent(event, ...args) {
          if (loadEventHandlers[event]) {
            loadEventHandlers[event](...args);
          }
        }
      },
      game: {
        events: {
          emit: jest.fn()
        }
      },
      scene: {
        key: 'MainScene'
      }
    };
    
    // Create asset loader with spies
    assetLoader = new AssetLoader(mockScene);
    jest.spyOn(assetLoader.events, 'emit');
  });
  
  test('should load assets for specified level', () => {
    // Arrange
    const levelAssets = {
      images: [
        { key: 'background', path: 'assets/images/background.png' },
        { key: 'logo', path: 'assets/images/logo.png' }
      ],
      spritesheets: [
        { 
          key: 'player', 
          path: 'assets/sprites/player.png',
          frameConfig: { frameWidth: 64, frameHeight: 64 }
        }
      ],
      audio: [
        { key: 'theme', path: 'assets/audio/theme.mp3' }
      ]
    };
    
    // Act
    assetLoader.loadAssets(levelAssets);
    
    // Assert
    expect(mockScene.load.image).toHaveBeenCalledTimes(2);
    expect(mockScene.load.image).toHaveBeenCalledWith('background', 'assets/images/background.png');
    expect(mockScene.load.image).toHaveBeenCalledWith('logo', 'assets/images/logo.png');
    
    expect(mockScene.load.spritesheet).toHaveBeenCalledWith(
      'player', 
      'assets/sprites/player.png',
      { frameWidth: 64, frameHeight: 64 }
    );
    
    expect(mockScene.load.audio).toHaveBeenCalledWith('theme', 'assets/audio/theme.mp3');
  });
  
  test('should track loading progress', () => {
    // Arrange
    const progressHandler = jest.fn();
    assetLoader.events.on('progress', progressHandler);
    
    const levelAssets = {
      images: [
        { key: 'background', path: 'assets/images/background.png' },
        { key: 'logo', path: 'assets/images/logo.png' }
      ]
    };
    
    // Act
    assetLoader.loadAssets(levelAssets);
    
    // Simulate progress events at 50% and 100%
    mockScene.load._triggerEvent('progress', 0.5);
    mockScene.load._triggerEvent('progress', 1.0);
    
    // Assert
    expect(progressHandler).toHaveBeenCalledTimes(2);
    expect(progressHandler).toHaveBeenNthCalledWith(1, 0.5);
    expect(progressHandler).toHaveBeenNthCalledWith(2, 1.0);
  });
  
  test('should emit complete event when loading finishes', () => {
    // Arrange
    const completeHandler = jest.fn();
    assetLoader.events.on('complete', completeHandler);
    
    const levelAssets = {
      images: [
        { key: 'background', path: 'assets/images/background.png' }
      ]
    };
    
    // Act
    assetLoader.loadAssets(levelAssets);
    
    // Simulate complete event
    mockScene.load._triggerEvent('complete');
    
    // Assert
    expect(completeHandler).toHaveBeenCalled();
    expect(assetLoader.isLoaded).toBe(true);
  });
  
  test('should handle loading errors', () => {
    // Arrange
    const errorHandler = jest.fn();
    assetLoader.events.on('error', errorHandler);
    
    const levelAssets = {
      images: [
        { key: 'background', path: 'assets/images/background.png' }
      ]
    };
    
    // Act
    assetLoader.loadAssets(levelAssets);
    
    // Simulate file error event
    const fileObj = { key: 'background', path: 'assets/images/background.png' };
    mockScene.load._triggerEvent('fileerror', fileObj);
    
    // Assert
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        file: fileObj,
        scene: 'MainScene'
      })
    );
  });
  
  test('should cache loaded assets for future use', () => {
    // Arrange
    const levelAssets = {
      images: [
        { key: 'background', path: 'assets/images/background.png' }
      ]
    };
    
    // Act - load assets
    assetLoader.loadAssets(levelAssets);
    mockScene.load._triggerEvent('complete');
    
    // Reset load method calls for verification
    mockScene.load.image.mockClear();
    
    // Try to load same assets again
    assetLoader.loadAssets(levelAssets);
    
    // Assert - should not try to load already loaded assets
    expect(mockScene.load.image).not.toHaveBeenCalled();
  });
});
```

### Memory and Performance Testing

For testing the performance monitoring and debug utilities defined in the Sprint 1 Implementation Plan:

```typescript
describe('PerformanceMonitor', () => {
  let performanceMonitor;
  let mockGame;
  
  beforeEach(() => {
    // Mock performance measurement API
    const performanceValues = {};
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn((name) => performanceValues[name] || [])
    };
    
    // Mock RAF for timing
    global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
    
    // Mock Phaser game
    mockGame = {
      loop: {
        actualFps: 60,
        time: 1000,
        tick: 1
      },
      renderer: {
        drawCount: 100
      },
      events: {
        on: jest.fn(),
        off: jest.fn()
      }
    };
    
    // Create performance monitor
    performanceMonitor = new PerformanceMonitor(mockGame);
  });
  
  test('should track FPS over time', () => {
    // Arrange
    const fpsSpy = jest.fn();
    performanceMonitor.onFpsUpdate = fpsSpy;
    
    // Act
    performanceMonitor.startTracking();
    
    // Simulate several frames with different FPS values
    mockGame.loop.actualFps = 60;
    mockGame.events.on.mock.calls[0][1](); // Call registered frame event
    
    mockGame.loop.actualFps = 55;
    mockGame.events.on.mock.calls[0][1]();
    
    mockGame.loop.actualFps = 50;
    mockGame.events.on.mock.calls[0][1]();
    
    // Assert
    expect(fpsSpy).toHaveBeenCalledTimes(3);
    expect(performanceMonitor.getAverageFps()).toBeCloseTo(55, 0);
    expect(performanceMonitor.getMinFps()).toBe(50);
    expect(performanceMonitor.getMaxFps()).toBe(60);
  });
  
  test('should measure operation duration', async () => {
    // Arrange
    const operationName = 'expensiveCalculation';
    
    // Mock performance measurement results
    const mockMeasure = { duration: 25.5 };
    global.performance.getEntriesByName.mockImplementation(name => {
      if (name === operationName) return [mockMeasure];
      return [];
    });
    
    // Act
    performanceMonitor.startMeasure(operationName);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 25));
    
    const duration = performanceMonitor.endMeasure(operationName);
    
    // Assert
    expect(global.performance.mark).toHaveBeenCalledWith(`${operationName}_start`);
    expect(global.performance.mark).toHaveBeenCalledWith(`${operationName}_end`);
    expect(global.performance.measure).toHaveBeenCalledWith(
      operationName,
      `${operationName}_start`,
      `${operationName}_end`
    );
    expect(duration).toBeCloseTo(25.5, 1);
  });
  
  test('should detect memory leaks by monitoring object counts', () => {
    // Arrange
    const mockObjectFactory = {
      getObjectCounts: jest.fn().mockReturnValue({
        sprite: 10,
        particle: 50,
        enemy: 5
      })
    };
    
    performanceMonitor.setObjectFactory(mockObjectFactory);
    performanceMonitor.startMemoryTracking();
    
    // Act - simulate frame with same count
    mockObjectFactory.getObjectCounts.mockReturnValue({
      sprite: 10,
      particle: 50,
      enemy: 5
    });
    mockGame.events.on.mock.calls[0][1]();
    
    // Act - simulate frame with increased counts
    mockObjectFactory.getObjectCounts.mockReturnValue({
      sprite: 15, // 5 more sprites
      particle: 100, // 50 more particles
      enemy: 5
    });
    mockGame.events.on.mock.calls[0][1]();
    
    // Act - simulate more frames with continually increasing sprites (potential leak)
    for (let i = 0; i < 5; i++) {
      mockObjectFactory.getObjectCounts.mockReturnValue({
        sprite: 15 + (i * 5), // Keep increasing
        particle: 100,
        enemy: 5
      });
      mockGame.events.on.mock.calls[0][1]();
    }
    
    // Assert
    const leaks = performanceMonitor.detectPotentialLeaks();
    expect(leaks).toContainEqual(
      expect.objectContaining({
        objectType: 'sprite',
        increaseTrend: true
      })
    );
    expect(leaks).not.toContainEqual(
      expect.objectContaining({
        objectType: 'enemy',
        increaseTrend: true
      })
    );
  });
  
  test('should track rendering metrics', () => {
    // Arrange
    performanceMonitor.startTracking();
    
    // Act - simulate frames with different draw counts
    mockGame.renderer.drawCount = 100;
    mockGame.events.on.mock.calls[0][1]();
    
    mockGame.renderer.drawCount = 120;
    mockGame.events.on.mock.calls[0][1]();
    
    mockGame.renderer.drawCount = 90;
    mockGame.events.on.mock.calls[0][1]();
    
    // Assert
    const stats = performanceMonitor.getRenderingStats();
    expect(stats.averageDrawCalls).toBeCloseTo(103.33, 1);
    expect(stats.peakDrawCalls).toBe(120);
  });
  
  test('should generate performance report', () => {
    // Arrange
    performanceMonitor.startTracking();
    performanceMonitor.startMemoryTracking();
    
    // Simulate several frames
    for (let i = 0; i < 5; i++) {
      mockGame.loop.actualFps = 60 - i;
      mockGame.renderer.drawCount = 100 + (i * 10);
      mockGame.events.on.mock.calls[0][1]();
    }
    
    // Act
    const report = performanceMonitor.generateReport();
    
    // Assert
    expect(report).toHaveProperty('fps');
    expect(report).toHaveProperty('rendering');
    expect(report).toHaveProperty('memory');
    expect(report).toHaveProperty('timestamp');
    
    expect(report.fps.average).toBeCloseTo(58, 0);
    expect(report.rendering.drawCalls.average).toBeGreaterThan(100);
  });
});
```

### Physics and Collision Testing

Testing physics and collision detection is critical for game mechanics. Here are examples for testing these systems:

```typescript
describe('PhysicsSystem', () => {
  let physicsSystem;
  let mockScene;
  
  beforeEach(() => {
    // Mock Phaser physics system
    mockScene = {
      physics: {
        world: {
          setBounds: jest.fn(),
          on: jest.fn()
        },
        add: {
          collider: jest.fn().mockReturnValue({
            name: 'test-collider',
            destroy: jest.fn()
          }),
          overlap: jest.fn().mockReturnValue({
            name: 'test-overlap',
            destroy: jest.fn()
          })
        }
      },
      events: {
        on: jest.fn(),
        off: jest.fn()
      }
    };
    
    // Create physics system
    physicsSystem = new PhysicsSystem(mockScene);
    jest.spyOn(physicsSystem.events, 'emit');
  });
  
  test('should initialize physics world with correct boundaries', () => {
    // Act
    physicsSystem.initialize({
      width: 800,
      height: 600,
      gravity: { x: 0, y: 300 }
    });
    
    // Assert
    expect(mockScene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(physicsSystem.isInitialized).toBe(true);
  });
  
  test('should create collision between player and platforms', () => {
    // Arrange
    const player = { body: { onCollide: jest.fn() } };
    const platforms = { children: { iterate: jest.fn() } };
    
    // Mock collision callback
    const onCollision = jest.fn();
    
    // Act
    physicsSystem.initialize({ width: 800, height: 600 });
    physicsSystem.addCollision(player, platforms, onCollision);
    
    // Assert
    expect(mockScene.physics.add.collider).toHaveBeenCalledWith(
      player,
      platforms,
      onCollision,
      null,
      mockScene
    );
  });
  
  test('should create overlap for player and collectibles', () => {
    // Arrange
    const player = { body: {} };
    const collectibles = { children: { iterate: jest.fn() } };
    
    // Mock overlap callback
    const onOverlap = jest.fn();
    
    // Act
    physicsSystem.initialize({ width: 800, height: 600 });
    physicsSystem.addOverlap(player, collectibles, onOverlap);
    
    // Assert
    expect(mockScene.physics.add.overlap).toHaveBeenCalledWith(
      player,
      collectibles,
      onOverlap,
      null,
      mockScene
    );
  });
  
  test('should detect and emit collision events', () => {
    // Arrange
    physicsSystem.initialize({ width: 800, height: 600 });
    
    // Mock collision objects
    const playerBody = { gameObject: { name: 'player' } };
    const platformBody = { gameObject: { name: 'platform' } };
    
    // Capture collision handler
    let collisionHandler;
    mockScene.physics.world.on.mockImplementation((event, handler) => {
      if (event === 'collide') {
        collisionHandler = handler;
      }
    });
    
    // Set up collision handler
    physicsSystem.setupCollisionEvents();
    
    // Act - simulate collision
    collisionHandler(playerBody, platformBody);
    
    // Assert
    expect(physicsSystem.events.emit).toHaveBeenCalledWith(
      'collision',
      {
        bodyA: playerBody,
        bodyB: platformBody,
        gameObjects: [playerBody.gameObject, platformBody.gameObject]
      }
    );
  });
  
  test('should remove collision handlers when destroyed', () => {
    // Arrange
    physicsSystem.initialize({ width: 800, height: 600 });
    
    const collider1 = physicsSystem.addCollision({}, {});
    const collider2 = physicsSystem.addOverlap({}, {});
    
    // Act
    physicsSystem.destroy();
    
    // Assert
    expect(collider1.destroy).toHaveBeenCalled();
    expect(collider2.destroy).toHaveBeenCalled();
    expect(mockScene.events.off).toHaveBeenCalled();
  });
});
```

### Advanced Test Patterns

Beyond the basic testing patterns, here are examples of advanced test patterns mentioned in the [Jest Testing Strategy](./jest-testing-strategy.md#advanced-test-patterns):

```typescript
describe('Advanced Test Patterns', () => {
  
  describe('Snapshot Testing', () => {
    test('should match player state snapshot', () => {
      // Arrange
      const playerState = createPlayerState({
        id: 'player-1',
        position: { x: 100, y: 200 },
        attributes: {
          strength: 10,
          dexterity: 15,
          intelligence: 12
        },
        inventory: [
          { id: 'sword', type: 'weapon', damage: 5 },
          { id: 'potion', type: 'consumable', healing: 20 }
        ]
      });
      
      // Act & Assert
      expect(playerState).toMatchSnapshot();
    });
    
    test('should match UI component snapshot', () => {
      // Arrange
      const healthBar = new HealthBar({
        maxHealth: 100,
        currentHealth: 75,
        width: 200,
        height: 20,
        borderColor: 0xffffff,
        fillColor: 0x00ff00
      });
      
      // Serialize component to a snapshot-friendly format
      const serialized = healthBar.serialize();
      
      // Assert
      expect(serialized).toMatchSnapshot();
    });
  });
  
  describe('Parameterized Testing', () => {
    // Using Jest's each feature for parameterized tests
    test.each([
      [10, 5, 5],
      [20, 8, 12],
      [100, 25, 75],
      [1, 1, 0]
    ])('damage calculation: health %i - damage %i = remaining %i', (health, damage, expected) => {
      // Arrange
      const character = new Character('test');
      character.health = health;
      
      // Act
      character.takeDamage(damage);
      
      // Assert
      expect(character.health).toBe(expected);
    });
    
    // Testing different weapon types and their effects
    test.each([
      ['sword', 'physical', 10],
      ['wand', 'magical', 8],
      ['bow', 'piercing', 6],
      ['staff', 'elemental', 12]
    ])('%s deals %s damage of %i points', (weaponType, damageType, baseDamage) => {
      // Arrange
      const weapon = createWeapon(weaponType);
      
      // Act
      const damage = weapon.calculateDamage();
      
      // Assert
      expect(damage.type).toBe(damageType);
      expect(damage.amount).toBeGreaterThanOrEqual(baseDamage);
    });
  });
  
  describe('Builder Pattern for Test Data', () => {
    // Example of using a builder pattern for complex test objects
    test('should create complex game state with builder', () => {
      // Arrange
      const gameState = new GameStateBuilder()
        .withPlayer(player => player
          .withHealth(100)
          .withPosition(50, 100)
          .withInventory(inventory => inventory
            .addItem('sword')
            .addItem('shield')
            .addGold(50)
          )
        )
        .withEnemies(enemies => enemies
          .add('goblin', { x: 200, y: 100 })
          .add('orc', { x: 300, y: 150 })
        )
        .withLevel('dungeon')
        .build();
      
      // Assert
      expect(gameState.player.health).toBe(100);
      expect(gameState.player.inventory.items).toHaveLength(2);
      expect(gameState.enemies).toHaveLength(2);
      expect(gameState.level).toBe('dungeon');
    });
  });
  
  describe('Contract Tests', () => {
    // Testing that a service implementation conforms to its interface contract
    test('InventoryService should implement IInventoryService contract', () => {
      // Arrange
      const inventoryService = new InventoryService();
      
      // Assert - verify all required methods are implemented
      expect(inventoryService.addItem).toBeInstanceOf(Function);
      expect(inventoryService.removeItem).toBeInstanceOf(Function);
      expect(inventoryService.getItems).toBeInstanceOf(Function);
      expect(inventoryService.hasItem).toBeInstanceOf(Function);
      
      // Test basic contract functionality
      const testItem = { id: 'test', type: 'misc' };
      
      // Should start empty
      expect(inventoryService.getItems()).toHaveLength(0);
      
      // Should add items
      inventoryService.addItem(testItem);
      expect(inventoryService.getItems()).toHaveLength(1);
      expect(inventoryService.hasItem('test')).toBe(true);
      
      // Should remove items
      inventoryService.removeItem('test');
      expect(inventoryService.getItems()).toHaveLength(0);
      expect(inventoryService.hasItem('test')).toBe(false);
    });
  });
});
```

These examples illustrate practical implementations of the test patterns described in our [Jest Testing Strategy](./jest-testing-strategy.md) document. They showcase how to effectively test scene lifecycle, input handling, asset loading, physics systems, and memory/performance monitoring in complex game systems.