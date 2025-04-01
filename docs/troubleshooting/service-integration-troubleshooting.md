# Service Integration Troubleshooting Guide

## Overview
This guide provides solutions for common issues encountered during service integration in our browser-based RPG. It covers initialization problems, communication issues, state management challenges, and performance concerns.

## Common Issues and Solutions

### Service Initialization Problems

#### 1. Service Dependencies Not Loading
**Symptoms:**
- Services fail to initialize
- Console errors about missing dependencies
- Circular dependency warnings

**Solutions:**
1. Check service registration order:
```typescript
// Correct order - dependencies first
ServiceRegistry.getInstance().register('config', ConfigService);
ServiceRegistry.getInstance().register('storage', StorageService);
ServiceRegistry.getInstance().register('character', CharacterService);
```

2. Verify service configuration:
```typescript
// Ensure proper configuration
const config: ServiceConfig = {
  dependencies: ['config', 'storage'],
  initializationTimeout: 5000,
  retryAttempts: 3
};
```

3. Check for circular dependencies:
- Use dependency injection
- Consider using events for cross-service communication
- Implement proper service layering

#### 2. Initialization Timeouts
**Symptoms:**
- Services take too long to initialize
- Timeout errors in console
- Game freezes during loading

**Solutions:**
1. Implement proper async initialization:
```typescript
class GameService implements IGameService {
  async init(): Promise<void> {
    try {
      await this.loadRequiredResources();
      await this.initializeSubsystems();
    } catch (error) {
      throw new ServiceInitializationError(error.message);
    }
  }
}
```

2. Add initialization progress tracking:
```typescript
interface InitProgress {
  stage: string;
  progress: number;
  details?: string;
}

// In your service
private reportProgress(progress: InitProgress): void {
  this.eventBus.emit('service.init.progress', progress);
}
```

### Communication Issues

#### 1. Event Communication Failures
**Symptoms:**
- Events not being received
- Handlers not executing
- Missing event payloads

**Solutions:**
1. Verify event subscription:
```typescript
// Proper event subscription
class ListenerService implements IGameService {
  private eventHandlers: Map<string, Function>;

  constructor() {
    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventHandlers.set('game.state.changed', this.handleStateChange.bind(this));
    // Register handlers with EventBus
    this.eventHandlers.forEach((handler, event) => {
      EventBus.getInstance().on(event, handler);
    });
  }

  destroy(): void {
    // Clean up handlers
    this.eventHandlers.forEach((handler, event) => {
      EventBus.getInstance().off(event, handler);
    });
  }
}
```

2. Debug event flow:
```typescript
// Add event logging in development
if (process.env.NODE_ENV === 'development') {
  EventBus.getInstance().on('*', (event, payload) => {
    console.log(`Event: ${event}`, payload);
  });
}
```

### State Management Problems

#### 1. State Synchronization Issues
**Symptoms:**
- Inconsistent state between services
- Race conditions
- Stale data

**Solutions:**
1. Implement proper state locking:
```typescript
class StateManager {
  private stateLock: boolean = false;

  async updateState(update: Partial<GameState>): Promise<void> {
    if (this.stateLock) {
      throw new StateUpdateError('State update in progress');
    }
    
    try {
      this.stateLock = true;
      await this.validateUpdate(update);
      await this.applyUpdate(update);
      this.notifyStateChanged();
    } finally {
      this.stateLock = false;
    }
  }
}
```

2. Use versioned state updates:
```typescript
interface VersionedState<T> {
  version: number;
  data: T;
  timestamp: number;
}

class VersionedStateManager<T> {
  private currentVersion: number = 0;

  updateState(newData: T): VersionedState<T> {
    return {
      version: ++this.currentVersion,
      data: newData,
      timestamp: Date.now()
    };
  }
}
```

### Performance Issues

#### 1. Memory Leaks
**Symptoms:**
- Increasing memory usage
- Degraded performance over time
- Browser tab crashes

**Solutions:**
1. Implement proper cleanup:
```typescript
class GameService implements IGameService {
  private resources: DisposableResource[] = [];

  registerResource(resource: DisposableResource): void {
    this.resources.push(resource);
  }

  async destroy(): Promise<void> {
    // Clean up in reverse order
    for (const resource of this.resources.reverse()) {
      await resource.dispose();
    }
    this.resources = [];
  }
}
```

2. Monitor service memory usage:
```typescript
class ServiceMonitor {
  private memorySnapshots: Map<string, number> = new Map();

  takeSnapshot(serviceName: string): void {
    if (process.env.NODE_ENV === 'development') {
      const usage = performance.memory?.usedJSHeapSize;
      this.memorySnapshots.set(serviceName, usage);
      console.log(`Memory usage for ${serviceName}: ${usage / 1024 / 1024} MB`);
    }
  }
}
```

## Best Practices for Prevention

### 1. Service Implementation Checklist
- [ ] Implement proper initialization error handling
- [ ] Add timeout handling for async operations
- [ ] Implement proper cleanup in destroy method
- [ ] Add event handler cleanup
- [ ] Implement state validation
- [ ] Add proper error boundaries
- [ ] Include logging for debugging
- [ ] Implement retry mechanisms for critical operations

### 2. Testing Recommendations
- Create unit tests for service initialization
- Test service communication patterns
- Implement integration tests for service interactions
- Add performance benchmarks
- Test error handling and recovery
- Verify cleanup procedures

### 3. Monitoring and Debugging
- Implement service health checks
- Add performance monitoring
- Include detailed error logging
- Create service state snapshots
- Monitor event flow
- Track resource usage

## Related Documentation
- [Service Integration Architecture](../architecture/patterns/service-integration.md)
- [Service Registry API](../api/services/sprint1/service-registry-api.md)
- [Testing Guide](../testing/unit/services.md) 