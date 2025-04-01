# Service Unit Testing Guide

## Overview
This document provides detailed guidance for unit testing individual services in our game architecture. It focuses on testing services in isolation, complementing the integration testing strategy outlined in the service integration testing documentation.

## Related Documentation
- [Service Integration Architecture](../../architecture/patterns/service-integration.md) - Service integration patterns and standards
- [Service Registry API](../../api/services/sprint1/service-registry-api.md) - Service registry implementation details
- [Service Integration Testing Strategy](../integration-testing/service-integration-testing-strategy.md) - Integration testing guidelines
- [Jest Testing Strategy](../jest-testing-strategy.md) - Overall testing approach
- [TypeScript Standards](../../.cursor/rules/typescript.mdc) - TypeScript coding standards
- [Sprint 1 Implementation Plan](../../architecture/decisions/sprint1-implementation-plan.md) - Implementation details and timeline

## Contents
1. [Test Organization](#test-organization)
2. [Service Testing Patterns](#service-testing-patterns)
3. [Coverage Requirements](#coverage-requirements)
4. [Mocking Dependencies](#mocking-dependencies)
5. [State Management Testing](#state-management-testing)
6. [Error Handling Testing](#error-handling-testing)
7. [Lifecycle Testing](#lifecycle-testing)
8. [Documentation Standards](#documentation-standards)
9. [Examples](#examples)
10. [Performance Testing](#performance-testing)

## Test Organization

### Directory Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── core/
│   │   │   ├── EventBus.test.ts
│   │   │   └── ServiceRegistry.test.ts
│   │   ├── game/
│   │   │   ├── PlayerService.test.ts
│   │   │   ├── CombatService.test.ts
│   │   │   └── InventoryService.test.ts
│   │   └── utils/
│   │       ├── StorageService.test.ts
│   │       └── LoggingService.test.ts
│   └── helpers/
│       ├── service-test-utils.ts
│       └── mock-factories.ts
```

### Test File Structure
```typescript
/**
 * Tests for PlayerService
 * 
 * @group unit
 * @group services
 * @coverage-target 90%
 */
import { PlayerService } from '../../../src/services/PlayerService';
import { createMockEventBus } from '../../helpers/mock-factories';
import type { IEventBus } from '../../../src/interfaces/IEventBus';

describe('PlayerService', () => {
  let service: PlayerService;
  let mockEventBus: jest.Mocked<IEventBus>;
  
  beforeEach(async () => {
    mockEventBus = createMockEventBus();
    service = new PlayerService(mockEventBus);
    await service.init();
  });
  
  afterEach(async () => {
    await service.destroy();
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    // Initialization tests
  });
  
  describe('player management', () => {
    // Core functionality tests
  });
  
  describe('error handling', () => {
    // Error case tests
  });
});
```

## Coverage Requirements

### Service Coverage Targets
- Core Services: 90% line coverage
- Game Services: 85% line coverage
- Utility Services: 80% line coverage

### Critical Areas Requiring 100% Coverage
- Service initialization
- Resource cleanup
- Error handling
- State transitions
- Event emissions

### Coverage Verification
```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    'src/services/core/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/services/game/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    'src/services/utils/**/*.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

## Documentation Standards

### Test Documentation
Each test file should include:

1. **File Header**
```typescript
/**
 * Tests for GameService
 * 
 * @group unit
 * @group services
 * @coverage-target 90%
 * @author Your Name
 * @lastModified 2024-04-01
 */
```

2. **Test Group Documentation**
```typescript
describe('GameService', () => {
  /**
   * Tests for combat-related functionality
   * 
   * Critical paths:
   * 1. Combat initialization
   * 2. Damage calculation
   * 3. Combat resolution
   * 4. State cleanup
   */
  describe('combat system', () => {
    // Tests
  });
});
```

3. **Individual Test Documentation**
```typescript
/**
 * Verifies that combat initialization:
 * 1. Creates valid combat instance
 * 2. Sets correct initial state
 * 3. Emits appropriate events
 * 4. Validates participant eligibility
 * 
 * @event combat.initialized
 * @error CombatError
 */
test('should initialize combat with valid participants', () => {
  // Test implementation
});
```

### Mock Documentation
Document mock factories with TypeScript interfaces:

```typescript
/**
 * Creates a typed mock of the EventBus service
 * 
 * @template T - Event map type
 * @returns A jest-mocked EventBus instance
 */
export function createMockEventBus<T extends EventMap>(): jest.Mocked<IEventBus<T>> {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn()
  };
}
```

## Service Testing Patterns

### 1. Initialization Testing
Test service initialization and dependency setup:

```typescript
describe('initialization', () => {
  test('should initialize with required dependencies', async () => {
    const service = new GameService(mockEventBus, mockStorage);
    await service.init();
    
    expect(service.isInitialized()).toBe(true);
    expect(mockEventBus.on).toHaveBeenCalled();
  });
  
  test('should throw if initialized twice', async () => {
    const service = new GameService(mockEventBus, mockStorage);
    await service.init();
    
    await expect(service.init()).rejects.toThrow(ServiceStateError);
  });
});
```

### 2. State Management Testing
Test service state handling:

```typescript
describe('state management', () => {
  test('should maintain internal state correctly', () => {
    service.updateState({ value: 10 });
    
    expect(service.getState().value).toBe(10);
  });
  
  test('should handle concurrent state updates', async () => {
    const updates = [1, 2, 3, 4, 5].map(value => 
      service.updateState({ value })
    );
    
    await Promise.all(updates);
    
    expect(service.getState().value).toBe(5);
  });
});
```

### 3. Event Handling Testing
Test service event handling:

```typescript
describe('event handling', () => {
  test('should register event handlers during initialization', async () => {
    await service.init();
    
    expect(mockEventBus.on).toHaveBeenCalledWith(
      'game.stateChanged',
      expect.any(Function)
    );
  });
  
  test('should emit events on state changes', () => {
    service.updatePlayerHealth('player1', 90);
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'player.healthChanged',
      expect.objectContaining({
        playerId: 'player1',
        currentHealth: 90
      })
    );
  });
});
```

## Mocking Dependencies

### 1. Creating Mock Factories

```typescript
// helpers/mock-factories.ts
export function createMockEventBus(): jest.Mocked<IEventBus> {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    throttle: jest.fn(),
    createScope: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn()
  };
}

export function createMockStorage(): jest.Mocked<IStorageService> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn()
  };
}
```

### 2. Using Mocks in Tests

```typescript
describe('InventoryService', () => {
  let service: InventoryService;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockStorage: jest.Mocked<IStorageService>;
  
  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockStorage = createMockStorage();
    
    mockStorage.get.mockResolvedValue({
      items: [],
      capacity: 20
    });
    
    service = new InventoryService(mockEventBus, mockStorage);
  });
  
  test('should load inventory from storage', async () => {
    await service.loadInventory('player1');
    
    expect(mockStorage.get).toHaveBeenCalledWith(
      'inventory:player1'
    );
  });
});
```

## State Management Testing

### 1. State Transitions

```typescript
describe('state transitions', () => {
  test('should transition through valid states', () => {
    expect(service.getState()).toBe('idle');
    
    service.startProcessing();
    expect(service.getState()).toBe('processing');
    
    service.completeProcessing();
    expect(service.getState()).toBe('completed');
  });
  
  test('should prevent invalid state transitions', () => {
    expect(() => service.completeProcessing())
      .toThrow('Invalid state transition');
  });
});
```

### 2. State Persistence

```typescript
describe('state persistence', () => {
  test('should persist state changes to storage', async () => {
    await service.updateState({ value: 42 });
    
    expect(mockStorage.set).toHaveBeenCalledWith(
      'service:state',
      expect.objectContaining({ value: 42 })
    );
  });
  
  test('should restore state from storage during initialization', async () => {
    mockStorage.get.mockResolvedValue({ value: 42 });
    
    await service.init();
    
    expect(service.getState().value).toBe(42);
  });
});
```

## Error Handling Testing

### 1. Input Validation

```typescript
describe('input validation', () => {
  test('should validate method parameters', () => {
    expect(() => service.updatePlayer('', {}))
      .toThrow('Player ID is required');
      
    expect(() => service.updatePlayer('player1', null))
      .toThrow('Player data is required');
  });
  
  test('should validate complex data structures', () => {
    expect(() => service.updateInventory('player1', {
      items: [{ id: 'item1', quantity: -1 }]
    })).toThrow('Item quantity must be positive');
  });
});
```

### 2. Error Recovery

```typescript
describe('error recovery', () => {
  test('should handle storage failures gracefully', async () => {
    mockStorage.get.mockRejectedValue(new Error('Storage error'));
    
    await service.init();
    
    expect(service.getState()).toEqual(service.getDefaultState());
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'error',
      expect.any(ServiceError)
    );
  });
  
  test('should retry failed operations', async () => {
    mockStorage.set.mockRejectedValueOnce(new Error('Temporary error'));
    
    await service.updateState({ value: 42 });
    
    expect(mockStorage.set).toHaveBeenCalledTimes(2);
    expect(service.getState().value).toBe(42);
  });
});
```

## Lifecycle Testing

### Service Initialization Order
Test service initialization respecting dependency order:

```typescript
describe('service initialization', () => {
  test('should initialize in correct dependency order', async () => {
    const registry = ServiceRegistry.getInstance();
    const mockEventBus = createMockEventBus();
    const mockAssetService = createMockAssetService();
    const mockSceneService = createMockSceneService(['eventBus', 'asset']);
    
    // Register services
    registry.register('eventBus', mockEventBus);
    registry.register('asset', mockAssetService);
    registry.register('scene', mockSceneService);
    
    // Initialize all services
    await registry.initializeAll();
    
    // Verify initialization order
    expect(mockEventBus.init).toHaveBeenCalledBefore(mockAssetService.init);
    expect(mockAssetService.init).toHaveBeenCalledBefore(mockSceneService.init);
  });
  
  test('should throw on circular dependencies', () => {
    const registry = ServiceRegistry.getInstance();
    const serviceA = createMockService(['serviceB']);
    const serviceB = createMockService(['serviceA']);
    
    registry.register('serviceA', serviceA);
    registry.register('serviceB', serviceB);
    
    expect(() => registry.getInitializationOrder())
      .toThrow(ServiceDependencyError);
  });
});
```

### Service Cleanup
Test proper service destruction in reverse dependency order:

```typescript
describe('service cleanup', () => {
  test('should destroy services in reverse dependency order', async () => {
    const registry = ServiceRegistry.getInstance();
    const mockEventBus = createMockEventBus();
    const mockAssetService = createMockAssetService();
    const mockSceneService = createMockSceneService(['eventBus', 'asset']);
    
    // Register and initialize
    registry.register('eventBus', mockEventBus);
    registry.register('asset', mockAssetService);
    registry.register('scene', mockSceneService);
    await registry.initializeAll();
    
    // Destroy all services
    registry.destroyAll();
    
    // Verify destruction order
    expect(mockSceneService.destroy).toHaveBeenCalledBefore(mockAssetService.destroy);
    expect(mockAssetService.destroy).toHaveBeenCalledBefore(mockEventBus.destroy);
  });
  
  test('should handle errors during service destruction', () => {
    const registry = ServiceRegistry.getInstance();
    const mockService = createMockService();
    mockService.destroy.mockImplementation(() => {
      throw new Error('Destruction failed');
    });
    
    registry.register('errorService', mockService);
    
    // Should not throw, but log error
    expect(() => registry.destroyAll()).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});
```

### Service State Management
Test service state transitions during lifecycle:

```typescript
describe('service state management', () => {
  test('should maintain correct state through lifecycle', async () => {
    const service = new GameService(mockEventBus, mockStorage);
    
    // Initial state
    expect(service.isInitialized()).toBe(false);
    
    // After initialization
    await service.init();
    expect(service.isInitialized()).toBe(true);
    
    // After destruction
    service.destroy();
    expect(service.isInitialized()).toBe(false);
  });
  
  test('should prevent multiple initializations', async () => {
    const service = new GameService(mockEventBus, mockStorage);
    
    await service.init();
    await expect(service.init())
      .rejects
      .toThrow(ServiceStateError);
  });
  
  test('should handle dependency state changes', async () => {
    const service = new GameService(mockEventBus, mockStorage);
    await service.init();
    
    // Simulate dependency state change
    mockEventBus.emit('storage.stateChanged', { newState: 'updated' });
    
    expect(service.getState().storageState).toBe('updated');
  });
});
```

### Thread Safety Testing
Test service registry thread safety:

```typescript
describe('thread safety', () => {
  test('should handle concurrent service registration', async () => {
    const registry = ServiceRegistry.getInstance();
    const registrations = [
      () => registry.register('service1', createMockService()),
      () => registry.register('service2', createMockService()),
      () => registry.register('service3', createMockService())
    ];
    
    // Simulate concurrent registration
    await Promise.all(registrations.map(reg => reg()));
    
    expect(registry.has('service1')).toBe(true);
    expect(registry.has('service2')).toBe(true);
    expect(registry.has('service3')).toBe(true);
  });
  
  test('should prevent multiple registry instances', () => {
    const instance1 = ServiceRegistry.getInstance();
    const instance2 = ServiceRegistry.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});
```

### Mock Factories for Lifecycle Testing

```typescript
/**
 * Creates a mock service with specified dependencies
 * 
 * @param dependencies - Optional list of service dependencies
 * @returns A jest-mocked service instance
 */
export function createMockService(dependencies: string[] = []): jest.Mocked<IDependentService> {
  return {
    dependencies,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(false)
  };
}

/**
 * Creates a mock scene service with dependencies
 * 
 * @param dependencies - List of service dependencies
 * @returns A jest-mocked scene service instance
 */
export function createMockSceneService(dependencies: string[]): jest.Mocked<ISceneService> {
  return {
    dependencies,
    init: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(false),
    loadScene: jest.fn(),
    unloadScene: jest.fn()
  };
}
```

## Examples

### Complete Service Test Example

```typescript
describe('CombatService', () => {
  let service: CombatService;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockPlayerService: jest.Mocked<IPlayerService>;
  
  beforeEach(async () => {
    mockEventBus = createMockEventBus();
    mockPlayerService = createMockPlayerService();
    
    service = new CombatService(mockEventBus, mockPlayerService);
    await service.init();
  });
  
  afterEach(() => {
    service.destroy();
    jest.clearAllMocks();
  });
  
  describe('combat initialization', () => {
    test('should initialize combat with valid participants', () => {
      const combat = service.initializeCombat('player1', 'enemy1');
      
      expect(combat).toBeDefined();
      expect(combat.state).toBe('initialized');
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'combat.initialized',
        expect.objectContaining({
          combatId: expect.any(String),
          participants: ['player1', 'enemy1']
        })
      );
    });
    
    test('should throw if combat already exists for player', () => {
      service.initializeCombat('player1', 'enemy1');
      
      expect(() => service.initializeCombat('player1', 'enemy2'))
        .toThrow('Player already in combat');
    });
  });
  
  describe('combat resolution', () => {
    test('should resolve combat and update player state', async () => {
      const combat = service.initializeCombat('player1', 'enemy1');
      
      await service.resolveCombat(combat.id, {
        winner: 'player1',
        experienceGained: 100
      });
      
      expect(mockPlayerService.updateExperience)
        .toHaveBeenCalledWith('player1', 100);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'combat.completed',
        expect.objectContaining({
          combatId: combat.id,
          winner: 'player1'
        })
      );
    });
    
    test('should handle combat resolution errors', async () => {
      mockPlayerService.updateExperience
        .mockRejectedValue(new Error('Update failed'));
      
      const combat = service.initializeCombat('player1', 'enemy1');
      
      await expect(service.resolveCombat(combat.id, {
        winner: 'player1',
        experienceGained: 100
      })).rejects.toThrow('Combat resolution failed');
      
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'error',
        expect.any(ServiceError)
      );
    });
  });
  
  describe('state management', () => {
    test('should track active combats', () => {
      const combat1 = service.initializeCombat('player1', 'enemy1');
      const combat2 = service.initializeCombat('player2', 'enemy2');
      
      expect(service.getActiveCombats()).toHaveLength(2);
      expect(service.getCombat(combat1.id)).toBeDefined();
      expect(service.getCombat(combat2.id)).toBeDefined();
    });
    
    test('should remove completed combats', async () => {
      const combat = service.initializeCombat('player1', 'enemy1');
      
      await service.resolveCombat(combat.id, {
        winner: 'player1',
        experienceGained: 100
      });
      
      expect(service.getActiveCombats()).toHaveLength(0);
      expect(service.getCombat(combat.id)).toBeUndefined();
    });
  });
});
```

## Version History
- v1.0.0 (2024-03-31)
  - Initial documentation
  - Aligned with Service Registry API v2.0.0
  - Added comprehensive test patterns and examples

## Performance Testing

### 1. Load Testing
```typescript
describe('service load testing', () => {
  /**
   * Tests service performance under load
   * 
   * @performance
   */
  test('should handle multiple concurrent requests', async () => {
    // Arrange
    const requests = Array.from({ length: 100 }, (_, i) => ({
      id: `player${i}`,
      data: { score: i }
    }));
    
    // Act
    const startTime = performance.now();
    await Promise.all(requests.map(req => 
      service.processRequest(req.id, req.data)
    ));
    const endTime = performance.now();
    
    // Assert
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(service.getProcessedCount()).toBe(100);
  });
  
  /**
   * Tests memory usage under load
   * 
   * @performance
   */
  test('should maintain stable memory usage', async () => {
    // Arrange
    const initialMemory = process.memoryUsage().heapUsed;
    const iterations = 1000;
    
    // Act
    for (let i = 0; i < iterations; i++) {
      await service.processLargeData({ size: 1000 });
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Assert
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
  });
});
```

### 2. Resource Management
```typescript
describe('resource management', () => {
  /**
   * Tests connection pool efficiency
   * 
   * @performance
   */
  test('should efficiently manage connection pool', async () => {
    // Arrange
    const poolSize = 5;
    const service = new DatabaseService({ poolSize });
    
    // Act - Simulate concurrent database operations
    const operations = Array.from({ length: 20 }, () =>
      service.query('SELECT * FROM test')
    );
    
    const startTime = performance.now();
    await Promise.all(operations);
    const endTime = performance.now();
    
    // Assert
    expect(service.getActiveConnections()).toBeLessThanOrEqual(poolSize);
    expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
  });
  
  /**
   * Tests resource cleanup efficiency
   * 
   * @performance
   */
  test('should quickly cleanup resources', async () => {
    // Arrange
    const resources = Array.from({ length: 1000 }, () => ({
      dispose: jest.fn()
    }));
    resources.forEach(r => service.addResource(r));
    
    // Act
    const startTime = performance.now();
    await service.destroy();
    const endTime = performance.now();
    
    // Assert
    expect(endTime - startTime).toBeLessThan(100); // Cleanup should be fast
    resources.forEach(r => expect(r.dispose).toHaveBeenCalled());
  });
});
```

### 3. Caching and Optimization
```typescript
describe('caching behavior', () => {
  /**
   * Tests cache hit performance
   * 
   * @performance
   */
  test('should serve cached results quickly', async () => {
    // Arrange
    const key = 'test-key';
    await service.processExpensiveOperation(key, { data: 'test' });
    
    // Act
    const startTime = performance.now();
    await service.processExpensiveOperation(key, { data: 'test' });
    const endTime = performance.now();
    
    // Assert
    expect(endTime - startTime).toBeLessThan(10); // Cache hits should be very fast
    expect(service.getCacheHitRate()).toBeGreaterThan(0.5); // >50% hit rate
  });
});
```

## Service Lifecycle Testing Patterns

### 1. IPausableService Testing
```typescript
describe('IPausableService implementation', () => {
  let service: GameService;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(async () => {
    mockEventBus = createMockEventBus();
    service = new GameService(mockEventBus);
    await service.init();
  });

  test('should handle pause lifecycle correctly', async () => {
    // Arrange - Set up initial state
    service.startProcessing();
    
    // Act - Pause the service
    await service.pause();
    
    // Assert
    expect(service.isPaused()).toBe(true);
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'service.paused',
      expect.objectContaining({ serviceId: service.id })
    );
    expect(service.getState()).toBe('paused');
  });

  test('should handle resume lifecycle correctly', async () => {
    // Arrange
    await service.pause();
    
    // Act
    await service.resume();
    
    // Assert
    expect(service.isPaused()).toBe(false);
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'service.resumed',
      expect.objectContaining({ serviceId: service.id })
    );
    expect(service.getState()).toBe('processing');
  });

  test('should preserve state across pause/resume cycle', async () => {
    // Arrange
    const initialState = { value: 42, processing: true };
    service.setState(initialState);
    
    // Act
    await service.pause();
    await service.resume();
    
    // Assert
    expect(service.getState()).toEqual(initialState);
  });

  test('should handle nested pause calls correctly', async () => {
    // Arrange
    await service.pause();
    
    // Act
    await service.pause();
    await service.resume();
    
    // Assert
    expect(service.isPaused()).toBe(true); // Should still be paused
    await service.resume();
    expect(service.isPaused()).toBe(false); // Now should be resumed
  });
});

### 2. Service Registry Dependency Resolution
```typescript
describe('Service Registry dependency resolution', () => {
  let registry: ServiceRegistry;
  let serviceA: IGameService;
  let serviceB: IGameService;

  beforeEach(() => {
    registry = ServiceRegistry.getInstance();
    serviceA = new ServiceA();
    serviceB = new ServiceB([serviceA.id]); // Depends on ServiceA
  });

  test('should resolve dependencies in correct order', async () => {
    // Register services
    registry.register('serviceB', serviceB);
    registry.register('serviceA', serviceA);

    // Initialize all services
    await registry.initializeAll();

    // Verify initialization order
    expect(serviceA.isInitialized()).toBe(true);
    expect(serviceB.isInitialized()).toBe(true);
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'service.initialized',
      expect.objectContaining({ serviceId: serviceA.id })
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'service.initialized',
      expect.objectContaining({ serviceId: serviceB.id })
    );
  });

  test('should handle circular dependencies', async () => {
    const serviceC = new ServiceC(['serviceD']);
    const serviceD = new ServiceD(['serviceC']);

    registry.register('serviceC', serviceC);
    registry.register('serviceD', serviceD);

    await expect(registry.initializeAll())
      .rejects.toThrow('Circular dependency detected');
  });

  test('should handle missing dependencies', async () => {
    registry.register('serviceB', serviceB);
    // ServiceA not registered

    await expect(registry.initializeAll())
      .rejects.toThrow('Missing dependency: serviceA');
  });
});

### 3. Memory Leak Detection
```typescript
describe('memory leak detection', () => {
  let service: GameService;
  let mockEventBus: jest.Mocked<IEventBus>;
  let memorySnapshots: number[];

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    service = new GameService(mockEventBus);
    memorySnapshots = [];
  });

  /**
   * Takes a memory snapshot and stores it
   */
  function takeMemorySnapshot(): void {
    if (global.gc) {
      global.gc(); // Force garbage collection
    }
    memorySnapshots.push(process.memoryUsage().heapUsed);
  }

  test('should not leak memory during lifecycle operations', async () => {
    // Initial memory snapshot
    takeMemorySnapshot();

    // Perform multiple init/destroy cycles
    for (let i = 0; i < 100; i++) {
      await service.init();
      await service.destroy();
    }

    // Final memory snapshot
    takeMemorySnapshot();

    // Check memory growth
    const memoryGrowth = memorySnapshots[1] - memorySnapshots[0];
    expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
  });

  test('should cleanup event listeners properly', async () => {
    const registeredHandlers = new Set<Function>();
    mockEventBus.on.mockImplementation((event, handler) => {
      registeredHandlers.add(handler);
      return () => registeredHandlers.delete(handler);
    });

    await service.init();
    expect(registeredHandlers.size).toBeGreaterThan(0);

    await service.destroy();
    expect(registeredHandlers.size).toBe(0);
  });

  test('should not leak resources during state transitions', async () => {
    await service.init();
    takeMemorySnapshot();

    // Perform multiple state transitions
    for (let i = 0; i < 1000; i++) {
      service.setState({ value: i });
    }

    takeMemorySnapshot();
    
    const memoryGrowth = memorySnapshots[1] - memorySnapshots[0];
    expect(memoryGrowth).toBeLessThan(1024 * 1024); // Less than 1MB growth
  });
});

### 4. Scene Transition State Preservation
```typescript
describe('scene transition state preservation', () => {
  let service: GameService;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockSceneManager: jest.Mocked<ISceneManager>;

  beforeEach(async () => {
    mockEventBus = createMockEventBus();
    mockSceneManager = createMockSceneManager();
    service = new GameService(mockEventBus, mockSceneManager);
    await service.init();
  });

  test('should preserve state during scene transitions', async () => {
    // Arrange - Set up initial state
    const initialState = { value: 42, status: 'active' };
    service.setState(initialState);

    // Act - Trigger scene transition
    await mockSceneManager.emit('scene.transitioning', {
      from: 'GameScene',
      to: 'LoadingScene'
    });

    // Assert - State should be preserved
    expect(service.getState()).toEqual(initialState);
  });

  test('should handle state restoration after scene reload', async () => {
    // Arrange
    const savedState = { value: 42, status: 'active' };
    service.setState(savedState);

    // Act - Simulate scene destruction and recreation
    await service.onSceneDestroy();
    await service.onSceneCreate();

    // Assert
    expect(service.getState()).toEqual(savedState);
  });

  test('should cleanup scene-specific resources during transition', async () => {
    // Arrange
    const sceneResource = { dispose: jest.fn() };
    service.addSceneResource(sceneResource);

    // Act
    await mockSceneManager.emit('scene.transitioning', {
      from: 'GameScene',
      to: 'LoadingScene'
    });

    // Assert
    expect(sceneResource.dispose).toHaveBeenCalled();
    expect(service.getSceneResources()).toHaveLength(0);
  });
});
```
