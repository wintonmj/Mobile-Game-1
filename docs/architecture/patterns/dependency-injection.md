# Dependency Injection Patterns

## Overview
This document outlines the dependency injection patterns used throughout the project. It provides guidelines for implementing and using dependency injection to create loosely coupled, testable components.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Implementation Patterns](#implementation-patterns)
3. [Service Registry Integration](#service-registry-integration)
4. [Testing Considerations](#testing-considerations)

## Core Concepts

### Principles
- Inversion of Control (IoC)
- Single Responsibility
- Interface Segregation
- Dependency Inversion
- Loose Coupling

### Benefits
- Improved testability
- Reduced coupling
- Enhanced modularity
- Easier maintenance
- Better code organization

## Implementation Patterns

### Constructor Injection
```typescript
interface IGameService {
  initialize(): Promise<void>;
  update(delta: number): void;
  destroy(): void;
}

class GameComponent {
  constructor(
    private readonly gameService: IGameService,
    private readonly eventBus: IEventBus
  ) {}
  
  async initialize(): Promise<void> {
    await this.gameService.initialize();
    this.eventBus.emit('component:initialized');
  }
}
```

### Property Injection
```typescript
class GameComponent {
  @inject('GameService')
  private readonly gameService!: IGameService;
  
  @inject('EventBus')
  private readonly eventBus!: IEventBus;
  
  async initialize(): Promise<void> {
    await this.gameService.initialize();
    this.eventBus.emit('component:initialized');
  }
}
```

### Method Injection
```typescript
class GameComponent {
  async processInput(
    @inject('InputService') inputService: IInputService
  ): Promise<void> {
    const input = await inputService.getCurrentInput();
    // Process input...
  }
}
```

## Service Registry Integration

### Registration
```typescript
class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any>;
  
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }
  
  get<T>(key: string): T {
    if (!this.services.has(key)) {
      throw new Error(`Service ${key} not found`);
    }
    return this.services.get(key) as T;
  }
}
```

### Usage with DI
```typescript
class GameComponent {
  private readonly gameService: IGameService;
  
  constructor() {
    this.gameService = ServiceRegistry.getInstance().get<IGameService>('GameService');
  }
}
```

## Testing Considerations

### Mock Injection
```typescript
describe('GameComponent', () => {
  let component: GameComponent;
  let mockGameService: jest.Mocked<IGameService>;
  let mockEventBus: jest.Mocked<IEventBus>;
  
  beforeEach(() => {
    mockGameService = createMockGameService();
    mockEventBus = createMockEventBus();
    component = new GameComponent(mockGameService, mockEventBus);
  });
  
  test('should initialize correctly', async () => {
    await component.initialize();
    expect(mockGameService.initialize).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalledWith('component:initialized');
  });
});
```

### Service Registry Testing
```typescript
describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;
  
  beforeEach(() => {
    registry = ServiceRegistry.getInstance();
  });
  
  test('should register and retrieve services', () => {
    const mockService = createMockGameService();
    registry.register('GameService', mockService);
    expect(registry.get('GameService')).toBe(mockService);
  });
});
```

## Best Practices

### Service Organization
- Group related services into modules
- Use clear, descriptive service names
- Document service dependencies
- Follow consistent registration patterns
- Implement proper cleanup in destroy methods

### Error Handling
- Provide clear error messages for missing services
- Implement proper service initialization checks
- Handle circular dependencies
- Log service registration and retrieval
- Implement service lifecycle management

### Performance Considerations
- Lazy load services when possible
- Implement proper service cleanup
- Monitor memory usage
- Cache service instances appropriately
- Use async initialization when needed

## Related Documentation
- [Mock Implementations](../../api/testing/mock-implementations.md)
- [Service Implementation Patterns](./service-implementation-patterns.md)
- [Testing Strategy](../../testing/jest-testing-strategy.md)

## Version History
- v1.0.0 - Initial documentation
- v1.0.1 - Added testing considerations
- v1.0.2 - Updated service registry patterns 