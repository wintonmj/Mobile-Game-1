# Mock Implementations Guide

## Overview
This document provides comprehensive guidance on mock implementation patterns and strategies used throughout the project's test suite. It aligns with the mocking strategies defined in `docs/testing/mocking/` and the dependency injection patterns outlined in our architecture documentation.

## Table of Contents
1. [Mock Factory Implementations](#mock-factory-implementations)
2. [Service Mocking Patterns](#service-mocking-patterns)
3. [Test Double Strategies](#test-double-strategies)
4. [Dependency Injection Patterns](#dependency-injection-patterns)

## Mock Factory Implementations

### Purpose
Mock factories provide consistent, reusable mock objects for testing. They ensure that all tests use consistent mock implementations for the same dependencies.

### Implementation Guidelines
```typescript
// Example mock factory implementation
export const createMockGameService = () => ({
  initialize: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  getState: jest.fn(),
  // ... other methods
});
```

### Best Practices
- Create type-safe mock factories
- Implement all interface methods
- Provide default mock behaviors
- Allow customization of mock behavior
- Document mock factory usage

## Service Mocking Patterns

### Service Registry Mocking
```typescript
export const createMockServiceRegistry = () => ({
  register: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  remove: jest.fn()
});
```

### Event Bus Mocking
```typescript
export const createMockEventBus = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn()
});
```

### State Management Mocking
```typescript
export const createMockStateManager = () => ({
  getState: jest.fn(),
  setState: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
});
```

## Test Double Strategies

### Spies
- Use for verifying method calls
- Track call counts and arguments
- Preserve original implementation

### Stubs
- Provide canned responses
- Simplify complex dependencies
- Control test scenarios

### Mocks
- Verify interaction patterns
- Set expectations on method calls
- Test complex interactions

### Fakes
- Implement simplified versions
- Use for complex dependencies
- Maintain functional behavior

## Dependency Injection Patterns

### Constructor Injection
```typescript
class GameComponent {
  constructor(
    private eventBus: IEventBus,
    private stateManager: IStateManager
  ) {}
}

// In tests
const mockEventBus = createMockEventBus();
const mockStateManager = createMockStateManager();
const component = new GameComponent(mockEventBus, mockStateManager);
```

### Property Injection
```typescript
class GameComponent {
  @inject('EventBus')
  private eventBus!: IEventBus;
  
  @inject('StateManager')
  private stateManager!: IStateManager;
}

// In tests
TestBed.configureTestingModule({
  providers: [
    { provide: 'EventBus', useValue: createMockEventBus() },
    { provide: 'StateManager', useValue: createMockStateManager() }
  ]
});
```

## Integration with Testing Framework

### Jest Configuration
```typescript
// jest.setup.ts
import { mockServiceRegistry } from './test/mocks/serviceRegistry';
import { mockEventBus } from './test/mocks/eventBus';

jest.mock('./services/serviceRegistry', () => mockServiceRegistry);
jest.mock('./services/eventBus', () => mockEventBus);
```

### Test Helper Functions
```typescript
export const setupTestEnvironment = () => {
  const mockServices = {
    eventBus: createMockEventBus(),
    stateManager: createMockStateManager(),
    // ... other services
  };
  
  return {
    services: mockServices,
    cleanup: () => {
      // Reset all mocks
      jest.clearAllMocks();
    }
  };
};
```

## Related Documentation
- [Mocking Strategies](../testing/mocking/mocking-strategies.md)
- [Test Data Strategy](../testing/mocking/test-data-strategy.md)
- [Dependency Injection Patterns](../architecture/patterns/dependency-injection.md)

## Version History
- v1.0.0 - Initial documentation
- v1.0.1 - Added test helper functions
- v1.0.2 - Updated mock factory patterns 