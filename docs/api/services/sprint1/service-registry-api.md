# Service Registry API Documentation

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team

## Overview
The `ServiceRegistry` is the central hub for managing all game services. It follows the Singleton pattern and provides methods for registering, accessing, and initializing services. For a comprehensive understanding of service integration patterns and architecture, see the [Service Integration Architecture](../../../architecture/patterns/service-integration.md) document.

## Related Documentation
- [Service Integration Architecture](../../../architecture/patterns/service-integration.md) - Service integration patterns
  - [Type Safety Boundaries](../../../architecture/patterns/service-integration.md#type-safety-boundaries) - Type safety implementation guidelines
  - [Service Categories](../../../architecture/patterns/service-integration.md#service-categories-from-mvp-design) - Service organization and hierarchy
  - [Integration Points](../../../architecture/patterns/service-integration.md#integration-points) - Key integration areas
  - [Future Expansion](../../../architecture/patterns/service-integration.md#future-expansion-points) - Future service integration plans
- [Core Services API](./core-services-api.md) - Core service interfaces and implementations
- [Event Bus API](./event-bus-api.md) - Event system integration
- [Service Testing Guide](../../../docs/testing/unit/services.md) - Unit testing guidelines for services
- [TypeScript Standards](../standards/typescript.mdc) - TypeScript coding standards
- [Sprint 1 Implementation Plan](../../../architecture/decisions/sprint1-implementation-plan.md) - Implementation details

## Core Interface
For detailed type safety guidelines and service interface standards, see [Type Safety Boundaries](../../../architecture/patterns/service-integration.md#type-safety-boundaries) in the Service Integration Architecture document.

```typescript
import { 
  IServiceRegistry, 
  IGameService,
  ServiceRegistrationError,
  ServiceNotFoundError,
  ServiceInitializationError,
  ServiceThreadError,
  ServiceStateError,
  IDependentService
} from './types';

/**
 * Implementation of the Service Registry
 */
export class ServiceRegistry implements IServiceRegistry {
  private static instance: ServiceRegistry | null = null;
  private static instanceLock = false;
  private services: Map<string, IGameService> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      if (ServiceRegistry.instanceLock) {
        throw new ServiceThreadError('ServiceRegistry', 'getInstance');
      }
      ServiceRegistry.instanceLock = true;
      try {
        ServiceRegistry.instance = new ServiceRegistry();
      } finally {
        ServiceRegistry.instanceLock = false;
      }
    }
    return ServiceRegistry.instance;
  }

  public register(name: string, service: IGameService): void {
    if (this.services.has(name)) {
      throw new ServiceRegistrationError(name, 'Service already registered');
    }
    this.services.set(name, service);
  }

  public get<T extends IGameService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(name);
    }
    return service as T;
  }

  public has(name: string): boolean {
    return this.services.has(name);
  }

  public getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [name, service] of this.services.entries()) {
      if ('dependencies' in service) {
        graph.set(name, [...(service as IDependentService).dependencies]);
      } else {
        graph.set(name, []);
      }
    }
    
    return graph;
  }

  public getInitializationOrder(): string[] {
    const graph = this.getDependencyGraph();
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string, path: Set<string>) => {
      if (path.has(name)) {
        throw new ServiceDependencyError(name, Array.from(path).join(' -> '));
      }
      if (visited.has(name)) return;

      path.add(name);
      const dependencies = graph.get(name) || [];
      
      for (const dep of dependencies) {
        visit(dep, path);
      }
      
      path.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const name of this.services.keys()) {
      if (!visited.has(name)) {
        visit(name, new Set());
      }
    }

    return order;
  }

  public async initializeAll(): Promise<void> {
    if (this.initialized) {
      throw new ServiceStateError(
        'ServiceRegistry', 
        'not initialized', 
        'initialized'
      );
    }

    const order = this.getInitializationOrder();
    
    for (const serviceName of order) {
      try {
        await this.get(serviceName).init();
      } catch (error) {
        throw new ServiceInitializationError(
          serviceName,
          error instanceof Error ? error : new Error('Unknown error')
        );
      }
    }

    this.initialized = true;
  }

  public destroyAll(): void {
    const order = this.getInitializationOrder().reverse();
    
    for (const serviceName of order) {
      try {
        this.get(serviceName).destroy();
      } catch (error) {
        console.error(`Error destroying service ${serviceName}:`, error);
      }
    }

    this.services.clear();
    this.initialized = false;
  }
}
```

## Usage Examples
The following examples demonstrate how to implement the service patterns defined in the [Service Integration Architecture](../../../architecture/patterns/service-integration.md). For a complete list of service categories and their relationships, see [Service Categories](../../../architecture/patterns/service-integration.md#service-categories-from-mvp-design).

### Basic Service Registration and Initialization
```typescript
// Get service registry instance
const registry = ServiceRegistry.getInstance();

// Register core services
registry.register('eventBus', EventBus.getInstance());
registry.register('storage', StorageService.getInstance());
registry.register('asset', AssetService.getInstance());

// Initialize all services in dependency order
await registry.initializeAll();
```

### Working with Dependencies
```typescript
// Service with dependencies
class SceneService implements IDependentService {
  public readonly dependencies = ['eventBus', 'asset', 'input'];
  
  public async init(): Promise<void> {
    const eventBus = registry.get<IEventBus>('eventBus');
    const assetService = registry.get<IAssetService>('asset');
    const inputService = registry.get<IInputService>('input');
    
    // Initialize with dependencies
  }
}

// Register dependent service
registry.register('scene', SceneService.getInstance());

// Get initialization order
const order = registry.getInitializationOrder();
console.log('Service initialization order:', order);
// Output: ['eventBus', 'asset', 'input', 'scene']
```

### Error Handling
```typescript
try {
  await registry.initializeAll();
} catch (error) {
  if (error instanceof ServiceInitializationError) {
    console.error(`Failed to initialize service: ${error.serviceName}`);
  } else if (error instanceof ServiceDependencyError) {
    console.error(`Dependency error: ${error.message}`);
  } else if (error instanceof ServiceNotFoundError) {
    console.error(`Service not found: ${error.serviceName}`);
  }
}
```

## Advanced Usage Examples

### Complex Service Registration
```typescript
// Example of a service with complex dependencies and initialization
class GameWorldService implements IDependentService {
  private static instance: GameWorldService;
  private services: RequiredServices;
  private initialized: boolean = false;

  constructor(services: RequiredServices) {
    this.services = services;
  }

  static getInstance(): GameWorldService {
    if (!GameWorldService.instance) {
      GameWorldService.instance = new GameWorldService({});
    }
    return GameWorldService.instance;
  }

  getDependencies(): string[] {
    return [
      'config',
      'storage',
      'character',
      'physics',
      'ai'
    ];
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Initialize required services in specific order
    const registry = ServiceRegistry.getInstance();
    
    this.services = {
      config: registry.get<IConfigService>('config'),
      storage: registry.get<IStorageService>('storage'),
      character: registry.get<ICharacterService>('character'),
      physics: registry.get<IPhysicsService>('physics'),
      ai: registry.get<IAIService>('ai')
    };

    // Complex initialization with dependency validation
    await this.validateDependencies();
    await this.initializeSubsystems();
    
    this.initialized = true;
  }

  private async validateDependencies(): Promise<void> {
    // Validate each service's state and compatibility
    for (const [name, service] of Object.entries(this.services)) {
      if (!service.isCompatible()) {
        throw new ServiceCompatibilityError(name);
      }
    }
  }

  private async initializeSubsystems(): Promise<void> {
    // Initialize subsystems in parallel where possible
    await Promise.all([
      this.initPhysicsWorld(),
      this.initCharacterSystems(),
      this.initAISystems()
    ]);
  }
}
```

### Dynamic Service Registration and Hot-Reloading
```typescript
class DynamicServiceManager {
  private registry: ServiceRegistry;
  private serviceFactories: Map<string, () => IGameService>;

  constructor() {
    this.registry = ServiceRegistry.getInstance();
    this.serviceFactories = new Map();
  }

  // Register a factory for creating service instances
  registerServiceFactory(name: string, factory: () => IGameService): void {
    this.serviceFactories.set(name, factory);
  }

  // Dynamically load and register a service
  async loadService(name: string): Promise<void> {
    const factory = this.serviceFactories.get(name);
    if (!factory) {
      throw new ServiceFactoryNotFoundError(name);
    }

    // Create new service instance
    const service = factory();
    
    // Handle existing service gracefully
    if (this.registry.has(name)) {
      await this.unloadService(name);
    }

    // Register and initialize new service
    this.registry.register(name, service);
    await service.init();
  }

  // Gracefully unload a service
  async unloadService(name: string): Promise<void> {
    if (!this.registry.has(name)) return;

    const service = this.registry.get(name);
    
    // Notify dependents
    await this.notifyDependents(name);
    
    // Cleanup and destroy
    await service.destroy();
    this.registry.unregister(name);
  }

  // Notify services that depend on the service being unloaded
  private async notifyDependents(serviceName: string): Promise<void> {
    const graph = this.registry.getDependencyGraph();
    const dependents = this.findDependents(serviceName, graph);
    
    for (const dependent of dependents) {
      const service = this.registry.get(dependent);
      if ('onDependencyUnloading' in service) {
        await service.onDependencyUnloading(serviceName);
      }
    }
  }

  private findDependents(serviceName: string, graph: Map<string, string[]>): string[] {
    return Array.from(graph.entries())
      .filter(([_, deps]) => deps.includes(serviceName))
      .map(([name]) => name);
  }
}
```

### Advanced Error Handling and Recovery
```typescript
class ServiceErrorHandler {
  private registry: ServiceRegistry;
  private retryConfig: RetryConfig;
  private errorListeners: Set<ErrorListener>;

  constructor(retryConfig: RetryConfig) {
    this.registry = ServiceRegistry.getInstance();
    this.retryConfig = retryConfig;
    this.errorListeners = new Set();
  }

  // Handle service initialization errors with retry logic
  async handleInitializationError(error: ServiceInitializationError): Promise<void> {
    const { serviceName, error: originalError } = error;
    
    // Notify error listeners
    this.notifyErrorListeners(serviceName, originalError);

    // Check if retry is allowed
    if (!this.retryConfig.shouldRetry(serviceName, originalError)) {
      throw error;
    }

    // Attempt recovery
    try {
      await this.attemptServiceRecovery(serviceName);
    } catch (recoveryError) {
      // If recovery fails, attempt fallback
      await this.attemptFallback(serviceName);
    }
  }

  private async attemptServiceRecovery(serviceName: string): Promise<void> {
    const service = this.registry.get(serviceName);
    
    // Reset service state
    await service.destroy();
    
    // Retry initialization with exponential backoff
    let attempt = 0;
    while (attempt < this.retryConfig.maxAttempts) {
      try {
        await this.waitBackoff(attempt);
        await service.init();
        return;
      } catch (error) {
        attempt++;
        if (attempt === this.retryConfig.maxAttempts) {
          throw error;
        }
      }
    }
  }

  private async attemptFallback(serviceName: string): Promise<void> {
    const fallbackService = this.retryConfig.getFallbackService(serviceName);
    if (!fallbackService) {
      throw new NoFallbackAvailableError(serviceName);
    }

    // Register fallback service
    this.registry.register(serviceName, fallbackService);
    await fallbackService.init();
  }

  private async waitBackoff(attempt: number): Promise<void> {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  addErrorListener(listener: ErrorListener): void {
    this.errorListeners.add(listener);
  }

  private notifyErrorListeners(serviceName: string, error: Error): void {
    for (const listener of this.errorListeners) {
      listener.onServiceError(serviceName, error);
    }
  }
}

// Example usage of advanced error handling
const errorHandler = new ServiceErrorHandler({
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  shouldRetry: (serviceName, error) => {
    // Custom retry logic based on service and error type
    return !(error instanceof FatalServiceError);
  },
  getFallbackService: (serviceName) => {
    // Return appropriate fallback service implementation
    return FallbackServiceFactory.create(serviceName);
  }
});

try {
  await registry.initializeAll();
} catch (error) {
  if (error instanceof ServiceInitializationError) {
    await errorHandler.handleInitializationError(error);
  }
}
```

### Service State Management and Monitoring
```typescript
class ServiceMonitor {
  private registry: ServiceRegistry;
  private healthChecks: Map<string, HealthCheck>;
  private stateListeners: Set<StateListener>;

  constructor() {
    this.registry = ServiceRegistry.getInstance();
    this.healthChecks = new Map();
    this.stateListeners = new Set();
  }

  // Register health check for a service
  registerHealthCheck(serviceName: string, check: HealthCheck): void {
    this.healthChecks.set(serviceName, check);
  }

  // Monitor service health
  async monitorHealth(): Promise<void> {
    while (true) {
      for (const [serviceName, check] of this.healthChecks) {
        try {
          const status = await check.execute();
          this.updateServiceStatus(serviceName, status);
        } catch (error) {
          this.handleHealthCheckError(serviceName, error);
        }
      }
      await this.wait(this.checkInterval);
    }
  }

  // Get detailed service status
  async getServiceStatus(serviceName: string): Promise<ServiceStatus> {
    const service = this.registry.get(serviceName);
    const health = await this.healthChecks.get(serviceName)?.execute();
    
    return {
      name: serviceName,
      status: service.getStatus(),
      health,
      uptime: service.getUptime(),
      lastError: service.getLastError(),
      metrics: await service.getMetrics()
    };
  }

  private updateServiceStatus(serviceName: string, status: HealthStatus): void {
    for (const listener of this.stateListeners) {
      listener.onStateChange(serviceName, status);
    }
  }

  private handleHealthCheckError(serviceName: string, error: Error): void {
    this.updateServiceStatus(serviceName, {
      healthy: false,
      error: error.message
    });
  }
}

// Example usage of service monitoring
const monitor = new ServiceMonitor();

// Register health checks for critical services
monitor.registerHealthCheck('database', new DatabaseHealthCheck());
monitor.registerHealthCheck('cache', new CacheHealthCheck());
monitor.registerHealthCheck('auth', new AuthHealthCheck());

// Add state change listener
monitor.addStateListener({
  onStateChange: (serviceName, status) => {
    if (!status.healthy) {
      console.error(`Service ${serviceName} is unhealthy:`, status.error);
      // Trigger alerts or recovery procedures
    }
  }
});

// Start monitoring
monitor.monitorHealth().catch(error => {
  console.error('Service monitoring failed:', error);
});
```

## Edge Cases and Special Considerations

### Circular Dependencies
```typescript
// Example of detecting and handling circular dependencies
class ServiceA implements IDependentService {
  public readonly dependencies = ['serviceB'];
}

class ServiceB implements IDependentService {
  public readonly dependencies = ['serviceA'];
}

// This will throw a ServiceDependencyError during initialization
registry.register('serviceA', ServiceA.getInstance());
registry.register('serviceB', ServiceB.getInstance());
try {
  const order = registry.getInitializationOrder();
} catch (error) {
  if (error instanceof ServiceDependencyError) {
    console.error('Circular dependency detected:', error.message);
    // Handle or report the circular dependency
  }
}
```

### Race Conditions in Multi-threaded Environments
```typescript
// Example of handling race conditions in getInstance()
class ThreadSafeService implements IGameService {
  private static instance: ThreadSafeService | null = null;
  private static instanceLock = false;

  public static getInstance(): ThreadSafeService {
    if (!ThreadSafeService.instance) {
      if (ThreadSafeService.instanceLock) {
        throw new ServiceThreadError(
          'ThreadSafeService',
          'Multiple threads attempting to create instance'
        );
      }
      ThreadSafeService.instanceLock = true;
      try {
        ThreadSafeService.instance = new ThreadSafeService();
      } finally {
        ThreadSafeService.instanceLock = false;
      }
    }
    return ThreadSafeService.instance;
  }
}
```

### Service Hot-Reloading
```typescript
// Example of safely replacing a service at runtime
class HotReloadableService implements IGameService {
  public async hotReload(): Promise<void> {
    const registry = ServiceRegistry.getInstance();
    
    // 1. Store dependent services that need to be reinitialized
    const dependents = this.findDependentServices();
    
    // 2. Temporarily remove the service
    registry.unregister('hotReloadable');
    
    // 3. Register new version
    const newInstance = await this.createNewInstance();
    registry.register('hotReloadable', newInstance);
    
    // 4. Reinitialize dependent services
    for (const dependent of dependents) {
      await dependent.reinitialize();
    }
  }
}
```

### Partial Initialization Recovery
```typescript
// Example of handling partial initialization failures
class RecoverableService implements IGameService {
  private initializationState: Map<string, boolean> = new Map();

  public async init(): Promise<void> {
    try {
      await this.initializeSubsystemA();
      this.initializationState.set('subsystemA', true);
      
      await this.initializeSubsystemB();
      this.initializationState.set('subsystemB', true);
    } catch (error) {
      // Log the failure point
      console.error('Initialization failed:', error);
      
      // Attempt recovery of partially initialized subsystems
      if (this.initializationState.get('subsystemA')) {
        await this.recoverSubsystemA();
      }
      
      throw new ServiceInitializationError(
        'RecoverableService',
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
}
```

### Memory Management
```typescript
// Example of proper resource cleanup during service destruction
class ResourceIntensiveService implements IGameService {
  private resources: WeakMap<string, Resource> = new WeakMap();
  private observers: Set<Observer> = new Set();

  public destroy(): void {
    // 1. Unsubscribe from all events
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // 2. Release heavy resources
    for (const [key, resource] of this.resources) {
      resource.dispose();
    }
    this.resources = new WeakMap();

    // 3. Clear any timers or intervals
    this.clearAllTimers();

    // 4. Signal garbage collection (if necessary)
    if (global.gc) {
      global.gc();
    }
  }
}
```

### State Recovery After Crashes
```typescript
// Example of implementing state recovery mechanisms
class StateRecoverableService implements IGameService {
  private static readonly STATE_KEY = 'service_state_backup';
  
  public async init(): Promise<void> {
    try {
      // Attempt to restore from last known good state
      const savedState = await this.loadLastKnownGoodState();
      if (savedState) {
        await this.restoreFromState(savedState);
      } else {
        await this.initializeFromScratch();
      }
    } catch (error) {
      // If restoration fails, initialize from scratch
      console.warn('State restoration failed, initializing from scratch:', error);
      await this.initializeFromScratch();
    }
  }

  private async saveState(): Promise<void> {
    const state = this.serializeState();
    await localStorage.setItem(StateRecoverableService.STATE_KEY, state);
  }
}
```

### Version Mismatch Handling
```typescript
// Example of handling service version mismatches
class VersionedService implements IGameService {
  private static readonly REQUIRED_VERSION = '2.0.0';
  
  public async init(): Promise<void> {
    // Check version compatibility with other services
    const dependencies = this.getDependencies();
    for (const [serviceName, requiredVersion] of dependencies) {
      const service = registry.get(serviceName);
      if (!this.isVersionCompatible(service.version, requiredVersion)) {
        throw new ServiceVersionError(
          serviceName,
          service.version,
          requiredVersion
        );
      }
    }
  }

  private isVersionCompatible(current: string, required: string): boolean {
    // Implement semver comparison logic
    return semver.satisfies(current, required);
  }
}

## Change History
- v2.0.0 (2024-03-31)
  - Added dependency resolution
  - Improved thread safety
  - Enhanced error handling
  - Added type-safe service access
- v1.0.0 (2024-03-01)
  - Initial implementation