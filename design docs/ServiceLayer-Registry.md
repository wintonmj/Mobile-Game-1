# Service Registry

## Problem Statement

Our current mobile game architecture faces several challenges that the Registry component will address:

1. **Manual dependency management** - Components create their dependencies directly, leading to tight coupling and difficulty in testing
2. **No centralized service location** - Services are scattered across the codebase with no consistent way to access them
3. **Duplicated component instantiation logic** - Common initialization patterns are repeated throughout the code
4. **Difficult service substitution** - Swapping implementations (e.g., for testing or different environments) is challenging
5. **Manual lifecycle management** - No centralized way to initialize and shut down services in the proper order

## Role in Service Layer Architecture

The Registry is the **foundation** of our service layer, providing:

1. **Service management** - Central point for registering and retrieving services
2. **Component factory** - Standard way to create game components with proper dependencies
3. **Dependency resolution** - Automatic resolution of service dependencies
4. **Lifecycle coordination** - Coordinated initialization and shutdown of services
5. **Testing support** - Easy substitution of mock services for testing

The Registry will be implemented first (Phase 1) as it's a prerequisite for all other service components. Other services will rely on the Registry for their instantiation and dependency injection.

## Interface Definition

```typescript
export interface IRegistry {
  // Service registration and retrieval
  registerService<T>(serviceId: string, serviceInstance: T): void;
  getService<T>(serviceId: string): T;
  hasService(serviceId: string): boolean;
  
  // Component factory registration and creation
  registerFactory<T>(componentType: string, factory: (...args: any[]) => T): void;
  createComponent<T>(componentType: string, ...args: any[]): T;
  hasFactory(componentType: string): boolean;
  
  // Dependency resolution
  registerDependencies(serviceId: string, dependencies: string[]): void;
  resolveDependencies(): void;
  
  // Lifecycle management
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
```

## Test-Driven Development Approach

### 1. Test Plan

We'll implement the Registry using TDD with these test categories:

1. **Service Registration and Retrieval**
   - Test registering a service
   - Test retrieving a registered service
   - Test error handling for missing services
   - Test type safety of service retrieval

2. **Component Factory**
   - Test registering component factories
   - Test creating components via factories
   - Test passing arguments to component factories
   - Test error handling for missing factories

3. **Dependency Resolution**
   - Test registering dependencies between services
   - Test automatic resolution of dependencies
   - Test handling circular dependencies
   - Test optional vs. required dependencies

4. **Lifecycle Management**
   - Test initialization order based on dependencies
   - Test shutdown in reverse order of initialization
   - Test error handling during initialization/shutdown
   - Test async initialization support

### 2. Sample Test Cases

```typescript
// __tests__/services/Registry.test.ts
import { Registry } from '../../services/Registry';
import { ILoggerService } from '../../services/interfaces/ILoggerService';
import { MockLoggerService } from '../mocks/services/MockLoggerService';

describe('Registry', () => {
  let registry: Registry;
  
  beforeEach(() => {
    registry = new Registry();
  });
  
  describe('Service Registration and Retrieval', () => {
    test('should register and retrieve a service', () => {
      // Arrange
      const loggerService = new MockLoggerService();
      
      // Act
      registry.registerService('logger', loggerService);
      const retrievedService = registry.getService<ILoggerService>('logger');
      
      // Assert
      expect(retrievedService).toBe(loggerService);
    });
    
    test('should throw error when getting non-existent service', () => {
      // Act & Assert
      expect(() => {
        registry.getService<ILoggerService>('nonExistentService');
      }).toThrow();
    });
    
    test('should check if service exists', () => {
      // Arrange
      const loggerService = new MockLoggerService();
      
      // Act
      registry.registerService('logger', loggerService);
      
      // Assert
      expect(registry.hasService('logger')).toBe(true);
      expect(registry.hasService('nonExistentService')).toBe(false);
    });
  });
  
  describe('Component Factory', () => {
    test('should register and use component factory', () => {
      // Arrange
      const factory = jest.fn(() => ({ type: 'testComponent' }));
      
      // Act
      registry.registerFactory('testComponent', factory);
      const component = registry.createComponent('testComponent');
      
      // Assert
      expect(factory).toHaveBeenCalled();
      expect(component).toEqual({ type: 'testComponent' });
    });
    
    test('should pass arguments to component factory', () => {
      // Arrange
      const factory = jest.fn((arg1, arg2) => ({ type: 'testComponent', arg1, arg2 }));
      
      // Act
      registry.registerFactory('testComponent', factory);
      const component = registry.createComponent('testComponent', 'value1', 'value2');
      
      // Assert
      expect(factory).toHaveBeenCalledWith('value1', 'value2');
      expect(component).toEqual({ type: 'testComponent', arg1: 'value1', arg2: 'value2' });
    });
  });
  
  describe('Dependency Resolution', () => {
    test('should resolve dependencies between services', () => {
      // Arrange
      const serviceA = { name: 'ServiceA' };
      const serviceB = { name: 'ServiceB', dependency: null };
      
      // Act
      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);
      
      // We'll need to implement something like this in the Registry
      registry.injectDependency('serviceB', 'dependency', 'serviceA');
      registry.resolveDependencies();
      
      // Assert
      expect(serviceB.dependency).toBe(serviceA);
    });
    
    test('should detect circular dependencies', () => {
      // Arrange
      const serviceA = { name: 'ServiceA' };
      const serviceB = { name: 'ServiceB' };
      
      // Act
      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceA', ['serviceB']);
      registry.registerDependencies('serviceB', ['serviceA']);
      
      // Assert
      expect(() => {
        registry.resolveDependencies();
      }).toThrow(/circular dependency/i);
    });
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize services in dependency order', async () => {
      // Arrange
      const initOrder: string[] = [];
      
      const serviceA = { 
        name: 'ServiceA',
        initialize: jest.fn().mockImplementation(() => {
          initOrder.push('serviceA');
          return Promise.resolve();
        })
      };
      
      const serviceB = { 
        name: 'ServiceB',
        initialize: jest.fn().mockImplementation(() => {
          initOrder.push('serviceB');
          return Promise.resolve();
        })
      };
      
      // Act
      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);
      await registry.initialize();
      
      // Assert
      expect(serviceA.initialize).toHaveBeenCalled();
      expect(serviceB.initialize).toHaveBeenCalled();
      expect(initOrder).toEqual(['serviceA', 'serviceB']);
    });
    
    test('should shutdown services in reverse dependency order', async () => {
      // Arrange
      const shutdownOrder: string[] = [];
      
      const serviceA = { 
        name: 'ServiceA',
        initialize: jest.fn().mockResolvedValue(undefined),
        shutdown: jest.fn().mockImplementation(() => {
          shutdownOrder.push('serviceA');
          return Promise.resolve();
        })
      };
      
      const serviceB = { 
        name: 'ServiceB',
        initialize: jest.fn().mockResolvedValue(undefined),
        shutdown: jest.fn().mockImplementation(() => {
          shutdownOrder.push('serviceB');
          return Promise.resolve();
        })
      };
      
      // Act
      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);
      await registry.initialize();
      await registry.shutdown();
      
      // Assert
      expect(serviceA.shutdown).toHaveBeenCalled();
      expect(serviceB.shutdown).toHaveBeenCalled();
      expect(shutdownOrder).toEqual(['serviceB', 'serviceA']);
    });
  });
});
```

### 3. Implementation Strategy

1. **Start with core functionality**
   - Implement basic service registration and retrieval
   - Add error handling for common cases
   - Make tests pass with minimal implementation

2. **Add component factory system**
   - Implement factory registration and component creation
   - Test with simple component types
   - Ensure proper error handling

3. **Implement dependency resolution**
   - Add dependency registration
   - Implement dependency injection
   - Add circular dependency detection
   - Test with complex dependency graphs

4. **Add lifecycle management**
   - Implement initialization in dependency order
   - Implement shutdown in reverse order
   - Add async support for lifecycle methods
   - Test with realistic service scenarios

5. **Optimize and refine**
   - Improve error messages
   - Add debugging capabilities
   - Optimize performance for large service graphs
   - Add convenience methods for common patterns

### 4. Acceptance Criteria

The Registry implementation will be considered complete when:

1. All tests pass consistently
2. The interface is fully implemented
3. It successfully manages dependencies between services
4. It properly coordinates service lifecycle
5. It provides clear error messages for common problems
6. Performance testing shows it can handle the expected number of services
7. It's integrated with the EventBus service for notifications
8. Documentation is complete and includes usage examples

## Integration with Other Services

The Registry will interact with other services in these ways:

1. **EventBusService**: Registry will emit events for service registration, initialization, and shutdown
2. **LoggerService**: Registry will use the logger for debugging and error reporting
3. **ConfigurationService**: Registry may use configuration for service instantiation

All other services will be registered with and retrieved from the Registry, making it a central hub in our architecture.

## Performance Considerations

1. **Lazy initialization**: Services should be initialized only when needed
2. **Caching**: Optimize service and component retrieval for frequent access
3. **Memory usage**: Minimize memory overhead from the registry itself
4. **Startup time**: Optimize initialization sequence for faster startup

## Migration Strategy

1. **Start with new services**: First use Registry for new services only
2. **Create adapters**: Add adapter services for legacy code
3. **Incremental adoption**: Gradually migrate existing code to use Registry
4. **Deprecation**: After migration, deprecate direct instantiation patterns 