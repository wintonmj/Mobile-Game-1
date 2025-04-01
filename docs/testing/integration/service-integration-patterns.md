# Service Integration Testing Patterns

## Overview
This document provides a comprehensive guide to integration testing patterns for game services, combining practical patterns with strategic implementation guidelines. It focuses on service interactions, state management, error handling, and performance considerations.

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [EventBus Service Integration](#eventbus-service-integration)
3. [Scene Transition Testing](#scene-transition-testing)
4. [Service Load Testing](#service-load-testing)
5. [Error Propagation Testing](#error-propagation-testing)
6. [Service Recovery Testing](#service-recovery-testing)
7. [Type-Safe Integration](#type-safe-integration)
8. [Test Organization](#test-organization)
9. [Best Practices](#best-practices)
10. [Dependency Graph Testing](#dependency-graph-testing)
11. [Initialization Order Testing](#initialization-order-testing)
12. [Type Boundary Testing](#type-boundary-testing)

## Test Environment Setup

### Basic Setup
```typescript
// integrationTestSetup.ts
import { ServiceRegistry } from '../../src/core/ServiceRegistry';
import { GameEventBus } from '../../src/core/GameEventBus';

export function setupTestServiceEnvironment() {
  // Reset singleton instances
  ServiceRegistry.reset();
  GameEventBus.reset();
  
  // Get fresh instances
  const registry = ServiceRegistry.getInstance();
  const eventBus = GameEventBus.getInstance();
  
  return { registry, eventBus };
}
```

### Mock vs. Real Implementation Strategy
- Use real implementations for key services under test
- Use real implementations for direct dependencies
- Use simplified mocks for indirect dependencies
- Always mock external systems (file system, network, etc.)

## EventBus Service Integration

### Testing Service Communication
```typescript
describe('Service Communication via EventBus', () => {
  let eventBus: EventBus;
  let serviceA: GameService;
  let serviceB: GameService;

  beforeEach(() => {
    eventBus = new EventBus();
    serviceA = new GameService(eventBus);
    serviceB = new GameService(eventBus);
  });

  test('should propagate events between services', async () => {
    // Arrange
    const eventSpy = jest.fn();
    serviceB.on('gameEvent', eventSpy);

    // Act
    await serviceA.emit('gameEvent', { data: 'test' });

    // Assert
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ data: 'test' })
    );
  });
});
```

### Testing Event Order and Sequencing
```typescript
test('should process events in correct order', async () => {
  // Arrange
  const events: string[] = [];
  
  serviceA.on('event1', () => events.push('event1'));
  serviceA.on('event2', () => events.push('event2'));
  
  // Act
  await Promise.all([
    serviceB.emit('event1'),
    serviceB.emit('event2')
  ]);
  
  // Assert
  expect(events).toEqual(['event1', 'event2']);
});
```

## Scene Transition Testing

### Testing Service State During Transitions
```typescript
describe('Scene Transition Integration', () => {
  let sceneManager: SceneManager;
  let gameService: GameService;

  test('should maintain service state during scene transition', async () => {
    // Arrange
    const initialState = { score: 100 };
    gameService.setState(initialState);

    // Act
    await sceneManager.start('NextScene');

    // Assert
    expect(gameService.getState()).toEqual(initialState);
  });
});
```

### Testing Multiple Service Interactions
```typescript
test('should coordinate multiple services during transition', async () => {
  // Arrange
  const audioService = new AudioService();
  const gameStateService = new GameStateService();
  
  // Act
  await sceneManager.transition('GameScene', 'MenuScene');
  
  // Assert
  expect(audioService.currentTrack).toBe('menuTheme');
  expect(gameStateService.isPaused()).toBe(true);
});
```

## Service Load Testing

### Testing Concurrent Service Operations
```typescript
test('should handle multiple concurrent service operations', async () => {
  // Arrange
  const operations = Array(100).fill(null).map((_, i) => ({
    type: 'update',
    data: { id: i }
  }));

  // Act
  const results = await Promise.all(
    operations.map(op => gameService.processOperation(op))
  );

  // Assert
  expect(results.every(r => r.success)).toBe(true);
  expect(gameService.isResponsive()).toBe(true);
});
```

### Testing Event Bus Under Load
```typescript
test('should maintain event order under high load', async () => {
  // Arrange
  const eventCount = 1000;
  const receivedEvents: number[] = [];
  
  // Act
  await Promise.all(
    Array(eventCount)
      .fill(null)
      .map((_, i) => eventBus.emit('test', { sequence: i }))
  );
  
  // Assert
  expect(receivedEvents).toHaveLength(eventCount);
  expect(receivedEvents).toEqual([...Array(eventCount).keys()]);
});
```

## Error Propagation Testing

### Testing Service Error Handling
```typescript
test('should propagate errors through service chain', async () => {
  // Arrange
  const errorSpy = jest.fn();
  serviceA.onError(errorSpy);
  
  // Act
  await serviceB.triggerError();
  
  // Assert
  expect(errorSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      source: 'ServiceB',
      propagationPath: ['ServiceB', 'ServiceA']
    })
  );
});
```

### Testing Error Recovery
```typescript
test('should recover from service errors gracefully', async () => {
  // Arrange
  const recoveryHandler = jest.fn();
  serviceA.onRecovery(recoveryHandler);
  
  // Act
  await serviceA.triggerError();
  await serviceA.recover();
  
  // Assert
  expect(recoveryHandler).toHaveBeenCalled();
  expect(serviceA.isHealthy()).toBe(true);
});
```

## Service Recovery Testing

### Testing Service State Recovery
```typescript
test('should restore service state after failure', async () => {
  // Arrange
  const initialState = { data: 'important' };
  serviceA.setState(initialState);
  
  // Act
  await serviceA.simulateFailure();
  await serviceA.recover();
  
  // Assert
  expect(serviceA.getState()).toEqual(initialState);
});
```

### Testing Cascading Recovery
```typescript
test('should recover dependent services in correct order', async () => {
  // Arrange
  const recoveryOrder: string[] = [];
  const services = [serviceA, serviceB, serviceC];
  
  services.forEach(service => 
    service.onRecover(() => recoveryOrder.push(service.name))
  );
  
  // Act
  await ServiceRecoveryManager.recoverAll(services);
  
  // Assert
  expect(recoveryOrder).toEqual(['ServiceC', 'ServiceB', 'ServiceA']);
});
```

## Type-Safe Integration

### Type-Safe Service Communication
```typescript
describe('Type-Safe Service Integration', () => {
  let registry: ServiceRegistry;
  
  beforeEach(async () => {
    const env = setupTestServiceEnvironment();
    registry = env.registry;
  });

  test('services should maintain type safety across boundaries', async () => {
    // Define strongly-typed service interfaces
    interface IPlayerState {
      id: string;
      health: number;
      position: { x: number; y: number };
    }
    
    interface IPlayerService extends IGameService {
      getPlayerState(id: string): IPlayerState;
      updatePlayerHealth(id: string, health: number): void;
    }
    
    // Register type-safe services
    const playerService = createMockPlayerService();
    
    // Act - Test type-safe interactions
    const initialState = playerService.getPlayerState('player1');
    await playerService.updatePlayerHealth('player1', 90);
    const finalState = playerService.getPlayerState('player1');
    
    // Assert with type checking
    expect(initialState.health).toBeGreaterThan(finalState.health);
  });
});
```

### Type-Safe Event System
```typescript
describe('Type-Safe Event System', () => {
  // Define type-safe event map
  interface GameEventMap {
    'player.damage': {
      playerId: string;
      amount: number;
      damageType: 'physical' | 'magical';
      source?: string;
    };
    'player.heal': {
      playerId: string;
      amount: number;
      healType: 'potion' | 'spell' | 'ability';
    };
    'game.state': {
      state: 'loading' | 'playing' | 'paused' | 'ended';
      timestamp: number;
    };
  }

  // Type-safe event bus implementation
  class TypedEventBus<T extends Record<string, any>> {
    emit<K extends keyof T>(event: K, payload: T[K]): void;
    on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void;
  }

  test('should enforce type safety for event payloads', () => {
    const eventBus = new TypedEventBus<GameEventMap>();

    // Valid event emission
    eventBus.emit('player.damage', {
      playerId: 'player1',
      amount: 50,
      damageType: 'physical'
    });

    // TypeScript would catch these errors:
    // @ts-expect-error - Invalid damage type
    eventBus.emit('player.damage', {
      playerId: 'player1',
      amount: 50,
      damageType: 'invalid'
    });

    // @ts-expect-error - Missing required field
    eventBus.emit('player.heal', {
      playerId: 'player1',
      amount: 30
    });
  });
});
```

### Generic Service Patterns
```typescript
describe('Generic Service Patterns', () => {
  // Generic repository interface
  interface IRepository<T extends { id: string }> {
    get(id: string): Promise<T>;
    save(item: T): Promise<void>;
    delete(id: string): Promise<void>;
    list(): Promise<T[]>;
  }

  // Generic service interface
  interface IEntityService<T extends { id: string }, TCreate = Omit<T, 'id'>> {
    create(data: TCreate): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
    get(id: string): Promise<T>;
  }

  test('should maintain type safety with generic services', async () => {
    interface Player {
      id: string;
      name: string;
      level: number;
      class: 'warrior' | 'mage' | 'rogue';
    }

    class PlayerService implements IEntityService<Player> {
      constructor(private repository: IRepository<Player>) {}

      async create(data: Omit<Player, 'id'>): Promise<Player> {
        const player = { ...data, id: generateId() };
        await this.repository.save(player);
        return player;
      }

      // Other methods implementation...
    }

    const playerService = new PlayerService(mockRepository);

    // TypeScript ensures type safety
    await playerService.create({
      name: 'Hero',
      level: 1,
      class: 'warrior'
    });

    // TypeScript would catch these errors:
    // @ts-expect-error - Invalid class type
    await playerService.create({
      name: 'Hero',
      level: 1,
      class: 'invalid'
    });
  });
});
```

### Discriminated Unions for State Management
```typescript
describe('State Management with Discriminated Unions', () => {
  // Define possible game states using discriminated union
  type GameState =
    | { type: 'loading'; progress: number }
    | { type: 'playing'; playerHealth: number; score: number }
    | { type: 'paused'; previousState: Omit<GameState, 'type'> }
    | { type: 'gameOver'; finalScore: number };

  class GameStateService {
    private currentState: GameState;

    transition(newState: GameState): void {
      // Type narrowing works automatically
      if (newState.type === 'playing') {
        // TypeScript knows playerHealth exists here
        this.validateHealth(newState.playerHealth);
      }
      this.currentState = newState;
    }

    private validateHealth(health: number): void {
      if (health < 0) throw new Error('Health cannot be negative');
    }
  }

  test('should handle state transitions type-safely', () => {
    const service = new GameStateService();

    // Valid transitions
    service.transition({ type: 'loading', progress: 0.5 });
    service.transition({ 
      type: 'playing', 
      playerHealth: 100, 
      score: 0 
    });

    // TypeScript would catch these errors:
    // @ts-expect-error - Missing required field
    service.transition({ type: 'playing', score: 0 });

    // @ts-expect-error - Invalid state type
    service.transition({ type: 'invalid' });
  });
});
```

### Type-Safe Mocking
```typescript
describe('Type-Safe Mocking', () => {
  interface IGameService {
    initialize(config: GameConfig): Promise<void>;
    getState(): GameState;
    update(delta: number): void;
  }

  // Type-safe mock creation
  function createTypedMock<T>(): jest.Mocked<T> {
    return {
      [Symbol.toStringTag]: 'Mock'
    } as jest.Mocked<T>;
  }

  test('should create type-safe mocks', () => {
    // Create mock with full type safety
    const mockGameService = createTypedMock<IGameService>();

    // TypeScript ensures correct types for mock implementations
    mockGameService.initialize.mockImplementation(async (config) => {
      // TypeScript knows the shape of config
      console.log(config.debugMode);
    });

    // TypeScript would catch these errors:
    // @ts-expect-error - Wrong parameter type
    mockGameService.initialize.mockImplementation(async (wrongType: string) => {});

    // @ts-expect-error - Wrong return type
    mockGameService.getState.mockImplementation(() => "wrong type");
  });
});
```

### Integration Testing with Type Guards
```typescript
describe('Type Guards in Integration Tests', () => {
  // Define type guard
  function isPlayerEntity(entity: unknown): entity is PlayerEntity {
    return (
      typeof entity === 'object' &&
      entity !== null &&
      'id' in entity &&
      'health' in entity &&
      'position' in entity
    );
  }

  test('should validate service responses with type guards', async () => {
    const gameService = registry.get<IGameService>('game');
    const entity = await gameService.spawnEntity('player');

    // Use type guard to validate and narrow type
    if (!isPlayerEntity(entity)) {
      throw new Error('Invalid entity type returned from service');
    }

    // TypeScript now knows entity is PlayerEntity
    expect(entity.health).toBeGreaterThan(0);
    expect(entity.position).toHaveProperty('x');
    expect(entity.position).toHaveProperty('y');
  });
});
```

## Test Organization

### Directory Structure
```
tests/
├── integration/
│   ├── services/
│   │   ├── combat-inventory-integration.test.ts
│   │   ├── player-quest-integration.test.ts
│   │   └── save-system-integration.test.ts
│   ├── features/
│   │   ├── character-progression.test.ts
│   │   └── quest-completion.test.ts
│   └── end-to-end/
│       └── game-initialization.test.ts
└── helpers/
    └── integration-test-helpers.ts
```

### Test Data Management
```typescript
// fixtures/gameStates.ts
export const testGameState = {
  player: { id: 'player1', name: 'TestPlayer', level: 1 },
  inventory: { items: [] },
  quests: { active: [], completed: [] }
};

async function seedServiceState(registry: ServiceRegistry, state: GameState) {
  await registry.get('player').initializePlayer(state.player);
  await registry.get('inventory').setItems(state.player.id, state.inventory.items);
  await registry.get('quest').initializeQuestLog(state.player.id, state.quests);
}
```

## Best Practices

1. **Test Setup and Organization**
   - Use beforeEach to reset service state
   - Initialize services in isolation
   - Mock external dependencies
   - Use test doubles for complex interactions
   - Keep tests focused and atomic
   - Use descriptive test names
   - Document complex test scenarios
   - Follow the Arrange-Act-Assert pattern

2. **Type Safety and Error Handling**
   - Maintain type safety across service boundaries
   - Test both success and failure paths
   - Verify service state after operations
   - Check event propagation
   - Validate error handling
   - Test error recovery scenarios

3. **Performance and Load Testing**
   - Use appropriate timeouts for async operations
   - Consider test execution time
   - Clean up resources after tests
   - Monitor memory usage during load tests
   - Test concurrent operations
   - Verify system behavior under stress

4. **Integration Patterns**
   - Test service initialization order
   - Verify cross-service communication
   - Test data flow between services
   - Validate shared state management
   - Test service lifecycle events
   - Verify error propagation chains

## Related Documentation
- [Jest Testing Strategy](../jest-testing-strategy.md)
- [Service Testing Patterns](../unit-testing/services.md)
- [Event Testing](../unit-testing/events.md)
- [Performance Testing Guide](../performance-testing/README.md)
- [TypeScript Testing Guidelines](../typescript-testing.md)

## Dependency Graph Testing

### Overview
Dependency graph testing ensures that service dependencies are correctly defined, initialized, and managed throughout the application lifecycle. This section covers patterns for testing service dependency relationships, circular dependency detection, and initialization order validation.

### Testing Service Dependencies
```typescript
describe('Service Dependency Graph', () => {
  let registry: ServiceRegistry;
  let dependencyGraph: DependencyGraph;

  beforeEach(() => {
    registry = ServiceRegistry.getInstance();
    dependencyGraph = new DependencyGraph();
  });

  test('should detect all service dependencies', () => {
    // Arrange
    const audioService = new AudioService();
    const gameStateService = new GameStateService();
    const playerService = new PlayerService(audioService, gameStateService);

    // Act
    dependencyGraph.addService(playerService);

    // Assert
    expect(dependencyGraph.getDependencies('PlayerService')).toEqual([
      'AudioService',
      'GameStateService'
    ]);
  });

  test('should detect circular dependencies', () => {
    // Arrange
    const serviceA = new ServiceA();
    const serviceB = new ServiceB(serviceA);
    serviceA.setDependency(serviceB); // Creates circular dependency

    // Act & Assert
    expect(() => {
      dependencyGraph.validateDependencies([serviceA, serviceB]);
    }).toThrow('Circular dependency detected: ServiceA -> ServiceB -> ServiceA');
  });
});
```

### Testing Dependency Resolution
```typescript
describe('Dependency Resolution', () => {
  test('should resolve dependencies in correct order', () => {
    // Arrange
    const services = [
      new DatabaseService(),
      new CacheService(),
      new AuthService(['DatabaseService']),
      new UserService(['AuthService', 'CacheService'])
    ];

    // Act
    const initOrder = DependencyResolver.getInitializationOrder(services);

    // Assert
    expect(initOrder).toEqual([
      'DatabaseService',
      'CacheService',
      'AuthService',
      'UserService'
    ]);
  });

  test('should handle optional dependencies', () => {
    // Arrange
    const service = new GameService({
      required: ['CoreService'],
      optional: ['AnalyticsService']
    });

    // Act
    const canInitialize = DependencyResolver.canInitialize(service);

    // Assert
    expect(canInitialize).toBe(true);
    expect(service.getInitializedDependencies()).toContain('CoreService');
  });
});
```

### Testing Dynamic Dependencies
```typescript
describe('Dynamic Service Dependencies', () => {
  test('should handle runtime dependency injection', async () => {
    // Arrange
    const dynamicService = new DynamicService();
    const dependencyTracker = new DependencyTracker();

    // Act
    await dynamicService.addDependency('NewFeatureService');
    
    // Assert
    expect(dependencyTracker.getUpdatedGraph()).toEqual(
      expect.objectContaining({
        'DynamicService': expect.arrayContaining(['NewFeatureService'])
      })
    );
  });

  test('should validate dynamic dependency changes', async () => {
    // Arrange
    const service = new GameService();
    const dependencyManager = new DependencyManager();

    // Act
    await service.removeDependency('OptionalService');
    
    // Assert
    expect(dependencyManager.isValid()).toBe(true);
    expect(service.getDependencies()).not.toContain('OptionalService');
  });
});
```

### Testing Dependency Health
```typescript
describe('Dependency Health Monitoring', () => {
  test('should detect unhealthy dependencies', async () => {
    // Arrange
    const healthMonitor = new ServiceHealthMonitor();
    const services = setupServiceGraph();

    // Act
    await services.database.simulateFailure();
    
    // Assert
    expect(healthMonitor.getUnhealthyDependencies('UserService'))
      .toEqual(['DatabaseService']);
    expect(healthMonitor.getAffectedServices())
      .toEqual(['UserService', 'AuthService']);
  });

  test('should track dependency performance impact', async () => {
    // Arrange
    const performanceTracker = new DependencyPerformanceTracker();
    const service = new GameService();

    // Act
    await service.executeWithDependencies();
    
    // Assert
    expect(performanceTracker.getBottlenecks()).toEqual(
      expect.arrayContaining([{
        service: 'DatabaseService',
        avgResponseTime: expect.any(Number),
        impactedServices: expect.any(Array)
      }])
    );
  });
});

### Best Practices for Dependency Testing
1. **Comprehensive Validation**
   - Test both direct and indirect dependencies
   - Verify dependency resolution order
   - Check for circular dependencies
   - Validate optional dependency handling

2. **Performance Considerations**
   - Monitor dependency initialization time
   - Track dependency chain impact on performance
   - Test dependency lazy loading
   - Measure memory impact of dependency graphs

3. **Error Handling**
   - Test dependency failure scenarios
   - Verify graceful degradation with missing optional dependencies
   - Ensure proper error propagation through dependency chain
   - Test recovery procedures

4. **Maintenance and Scalability**
   - Keep dependency graphs documented and updated
   - Monitor dependency complexity metrics
   - Regular audits of dependency relationships
   - Version compatibility testing

## Initialization Order Testing

### Testing Service Dependencies
```typescript
describe('Service Initialization Order', () => {
  let registry: ServiceRegistry;
  let serviceA: DatabaseService;
  let serviceB: CacheService;
  let serviceC: GameStateService;

  beforeEach(() => {
    registry = new ServiceRegistry();
    serviceA = new DatabaseService();
    serviceB = new CacheService();
    serviceC = new GameStateService();
  });

  test('should initialize services in correct dependency order', async () => {
    // Arrange
    const initOrder: string[] = [];
    const trackInit = (name: string) => initOrder.push(name);

    // Mock initialization with tracking
    jest.spyOn(serviceA, 'init').mockImplementation(async () => {
      trackInit('DatabaseService');
      return Promise.resolve();
    });
    jest.spyOn(serviceB, 'init').mockImplementation(async () => {
      trackInit('CacheService');
      return Promise.resolve();
    });
    jest.spyOn(serviceC, 'init').mockImplementation(async () => {
      trackInit('GameStateService');
      return Promise.resolve();
    });

    // Register services with dependencies
    registry.register('database', serviceA);
    registry.register('cache', serviceB, ['database']);
    registry.register('gameState', serviceC, ['cache']);

    // Act
    await registry.initializeAll();

    // Assert
    expect(initOrder).toEqual([
      'DatabaseService',
      'CacheService',
      'GameStateService'
    ]);
  });
});
```

### Testing Circular Dependencies
```typescript
describe('Service Circular Dependency Detection', () => {
  let registry: ServiceRegistry;
  let serviceA: ServiceA;
  let serviceB: ServiceB;

  beforeEach(() => {
    registry = new ServiceRegistry();
    serviceA = new ServiceA();
    serviceB = new ServiceB();
  });

  test('should detect and reject circular dependencies', () => {
    // Arrange
    registry.register('serviceA', serviceA, ['serviceB']);
    registry.register('serviceB', serviceB, ['serviceA']);

    // Act & Assert
    expect(registry.initializeAll()).rejects.toThrow(
      'Circular dependency detected: serviceA -> serviceB -> serviceA'
    );
  });
});
```

### Testing Initialization Failure Handling
```typescript
describe('Service Initialization Failure Handling', () => {
  let registry: ServiceRegistry;
  let serviceA: DatabaseService;
  let serviceB: CacheService;

  beforeEach(() => {
    registry = new ServiceRegistry();
    serviceA = new DatabaseService();
    serviceB = new CacheService();
  });

  test('should handle initialization failures gracefully', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    jest.spyOn(serviceA, 'init').mockRejectedValue(error);
    
    registry.register('database', serviceA);
    registry.register('cache', serviceB, ['database']);

    // Act & Assert
    await expect(registry.initializeAll()).rejects.toThrow(error);
    expect(serviceB.init).not.toHaveBeenCalled();
  });

  test('should rollback successfully initialized services on failure', async () => {
    // Arrange
    const rollbackA = jest.spyOn(serviceA, 'destroy');
    jest.spyOn(serviceB, 'init').mockRejectedValue(new Error('Cache init failed'));
    
    registry.register('database', serviceA);
    registry.register('cache', serviceB, ['database']);

    // Act
    try {
      await registry.initializeAll();
    } catch (error) {
      // Assert
      expect(rollbackA).toHaveBeenCalled();
    }
  });
});
```

### Testing Lazy Initialization
```typescript
describe('Service Lazy Initialization', () => {
  let registry: ServiceRegistry;
  let serviceA: LazyService;

  beforeEach(() => {
    registry = new ServiceRegistry();
    serviceA = new LazyService();
  });

  test('should initialize service only when first accessed', async () => {
    // Arrange
    const initSpy = jest.spyOn(serviceA, 'init');
    registry.register('lazy', serviceA, [], { lazy: true });

    // Act
    await registry.initializeAll();

    // Assert - service should not be initialized yet
    expect(initSpy).not.toHaveBeenCalled();

    // Act - access the service
    await registry.get('lazy');

    // Assert - service should now be initialized
    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Initialization Events
```typescript
describe('Service Initialization Events', () => {
  let registry: ServiceRegistry;
  let eventBus: EventBus;
  let serviceA: GameService;

  beforeEach(() => {
    registry = new ServiceRegistry();
    eventBus = new EventBus();
    serviceA = new GameService();
  });

  test('should emit events during initialization lifecycle', async () => {
    // Arrange
    const events: string[] = [];
    eventBus.onAny((event) => events.push(event));

    registry.register('game', serviceA);
    registry.setEventBus(eventBus);

    // Act
    await registry.initializeAll();

    // Assert
    expect(events).toEqual([
      'service.initializing',
      'service.initialized',
      'registry.initialization.complete'
    ]);
  });
});
```

## Type Boundary Testing

### Testing Type Safety Boundaries
```typescript
describe('Type Safety Boundaries', () => {
  test('should enforce type safety for service registration', () => {
    // Arrange
    const invalidService = {};

    // Act & Assert
    expect(() => registry.register('invalid', invalidService as IGameService))
      .toThrow('Invalid service implementation');
  });

  test('should validate event payload types', () => {
    // Arrange
    const eventBus = new GameEventBus();
    const invalidPayload = { invalid: 'data' };

    // Act & Assert
    expect(() => eventBus.emit('playerMove', invalidPayload))
      .toThrow('Invalid event payload type');
  });

  test('should enforce type constraints on service methods', () => {
    // Arrange
    interface NumericConfig {
      value: number;
      range: [number, number];
    }

    class TypedService {
      configure<T extends NumericConfig>(config: T): void {
        if (typeof config.value !== 'number' || !Array.isArray(config.range)) {
          throw new TypeError('Invalid configuration type');
        }
      }
    }

    const service = new TypedService();

    // Act & Assert
    expect(() => {
      service.configure({ value: 'invalid' as any, range: [0, 10] });
    }).toThrow('Invalid configuration type');
  });
});
```

### Testing Generic Type Boundaries
```typescript
describe('Generic Type Boundaries', () => {
  // Define a generic service interface
  interface IDataService<T> {
    getData(): Promise<T>;
    setData(data: T): Promise<void>;
    validate(data: unknown): data is T;
  }

  // Implementation for testing
  class PlayerDataService implements IDataService<PlayerData> {
    private data?: PlayerData;

    async getData(): Promise<PlayerData> {
      if (!this.data) throw new Error('No data set');
      return this.data;
    }

    async setData(data: PlayerData): Promise<void> {
      if (!this.validate(data)) {
        throw new TypeError('Invalid player data');
      }
      this.data = data;
    }

    validate(data: unknown): data is PlayerData {
      return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        'name' in data &&
        'level' in data
      );
    }
  }

  test('should enforce generic type constraints', async () => {
    // Arrange
    const service = new PlayerDataService();
    const validData: PlayerData = { id: '1', name: 'Player', level: 1 };
    const invalidData = { id: '1', name: 'Player' }; // missing level

    // Act & Assert
    await expect(service.setData(validData)).resolves.not.toThrow();
    await expect(service.setData(invalidData as any)).rejects.toThrow('Invalid player data');
  });

  test('should maintain type safety across async boundaries', async () => {
    // Arrange
    const service = new PlayerDataService();
    await service.setData({ id: '1', name: 'Player', level: 1 });

    // Act
    const data = await service.getData();

    // Assert
    expect(data).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      level: expect.any(Number)
    });
  });
});
```

### Testing Type Narrowing and Guards
```typescript
describe('Type Narrowing and Guards', () => {
  // Define discriminated union type
  type GameEvent =
    | { type: 'damage'; amount: number; target: string }
    | { type: 'heal'; amount: number; target: string }
    | { type: 'status'; effect: 'poison' | 'stun'; duration: number };

  class EventProcessor {
    processEvent(event: GameEvent): void {
      switch (event.type) {
        case 'damage':
          // TypeScript knows event has amount and target
          this.applyDamage(event.amount, event.target);
          break;
        case 'heal':
          this.applyHeal(event.amount, event.target);
          break;
        case 'status':
          this.applyStatus(event.effect, event.duration);
          break;
      }
    }

    private applyDamage(amount: number, target: string): void {}
    private applyHeal(amount: number, target: string): void {}
    private applyStatus(effect: 'poison' | 'stun', duration: number): void {}
  }

  test('should handle discriminated union types correctly', () => {
    // Arrange
    const processor = new EventProcessor();
    const processSpy = jest.spyOn(processor as any, 'applyDamage');

    // Act
    processor.processEvent({ type: 'damage', amount: 50, target: 'player1' });

    // Assert
    expect(processSpy).toHaveBeenCalledWith(50, 'player1');
  });

  test('should enforce type guard constraints', () => {
    // Arrange
    const processor = new EventProcessor();

    // Act & Assert
    expect(() => {
      // @ts-expect-error - Invalid event type
      processor.processEvent({ type: 'invalid', amount: 50 });
    }).toThrow();
  });
});
```

### Testing Type Inference and Covariance
```typescript
describe('Type Inference and Covariance', () => {
  // Base interfaces
  interface Entity {
    id: string;
    type: string;
  }

  interface Character extends Entity {
    name: string;
    level: number;
  }

  interface Player extends Character {
    class: string;
    experience: number;
  }

  // Service with covariant return type
  class EntityService<T extends Entity> {
    protected entities: T[] = [];

    add(entity: T): void {
      this.entities.push(entity);
    }

    get(id: string): T | undefined {
      return this.entities.find(e => e.id === id);
    }
  }

  test('should maintain type safety with inheritance', () => {
    // Arrange
    const playerService = new EntityService<Player>();
    const player: Player = {
      id: '1',
      type: 'player',
      name: 'Hero',
      level: 1,
      class: 'warrior',
      experience: 0
    };

    // Act
    playerService.add(player);
    const retrieved = playerService.get('1');

    // Assert
    expect(retrieved).toBeDefined();
    if (retrieved) {
      // TypeScript knows this is a Player
      expect(retrieved.class).toBe('warrior');
      expect(retrieved.experience).toBe(0);
    }
  });

  test('should enforce type constraints in generic services', () => {
    // Arrange
    const characterService = new EntityService<Character>();
    const invalidEntity = { id: '1', type: 'invalid' }; // missing name and level

    // Act & Assert
    expect(() => {
      // @ts-expect-error - Missing required properties
      characterService.add(invalidEntity);
    }).toThrow();
  });
});
```

### Best Practices for Type Boundary Testing
1. **Type Safety Verification**
   - Test type constraints at service boundaries
   - Verify generic type parameters
   - Test discriminated unions
   - Validate type guard behavior
   - Check covariant and contravariant relationships

2. **Error Handling**
   - Test invalid type scenarios
   - Verify error messages for type violations
   - Test type assertion failures
   - Validate type guard error cases

3. **Integration Considerations**
   - Test type safety across service boundaries
   - Verify type preservation in async operations
   - Test generic type constraints in service composition
   - Validate type inference in complex scenarios

4. **Documentation**
   - Document type boundary test cases
   - Explain type constraints and their purpose
   - Provide examples of valid and invalid types
   - Document type guard usage and behavior
   - Test type safety for service registration
   - Validate event payload types
   - Ensure type constraints on service methods
   - Test generic type boundaries
   - Verify type inference and covariance
   - Document best practices for type boundary testing
   - Test type safety for service registration
   - Validate event payload types
   - Ensure type constraints on service methods
   - Test generic type boundaries
   - Verify type inference and covariance
   - Document best practices for type boundary testing
   - Test type safety for service registration
   - Validate event payload types
   - Ensure type constraints on service methods
   - Test generic type boundaries
   - Verify type inference and covariance
   - Document best practices for type boundary testing
   - Test type safety for service registration
   - Validate event payload types
   - Ensure type constraints on service methods
   - Test generic type boundaries
   - Verify type inference and covariance
   - Document best practices for type boundary testing 