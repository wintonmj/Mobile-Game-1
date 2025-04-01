# Service Implementation Patterns

## Overview
This document provides detailed guidance on implementing services within our browser-based RPG game architecture. It defines standard patterns, interfaces, and best practices for creating and managing services through the ServiceRegistry, following the MVP implementation plan defined in `docs/Implementation/MVPImplementationPlanOverview.md` and the architectural decisions in `docs/architecture/patterns/MVPHighLevelArchitecture.md`.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Service Interface](#service-interface)
- [ServiceRegistry Usage](#serviceregistry-usage)
- [Service Lifecycle Management](#service-lifecycle-management)
- [Dependency Injection for Services](#dependency-injection-for-services)
- [Concrete Implementation Examples](#concrete-implementation-examples)
- [Phaser.js Integration](#phaserjs-integration)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Testing Services](#testing-services)
- [Testing Strategies](#testing-strategies)
- [Performance Optimization Patterns](#performance-optimization-patterns)

## Core Concepts

Services in our architecture follow these core principles:
- **Single Responsibility**: Each service manages one distinct aspect of the game (e.g., audio, player state, inventory)
- **Loose Coupling**: Services interact through the ServiceRegistry and EventBus rather than direct dependencies
- **Lifecycle Management**: Services follow a consistent lifecycle for initialization and cleanup
- **Testability**: All services are designed to be easily testable with mock dependencies
- **Browser Optimization**: Services are optimized for browser environments with considerations for memory usage and performance
- **Mobile Compatibility**: Services account for mobile device constraints and touch interfaces
- **Asset Management**: Services handle efficient loading, caching, and unloading of game assets
- **Standardized Error Handling**: Services implement consistent error handling patterns to ensure stability and proper error reporting
- **Type Safety**: Services leverage TypeScript's strong typing to prevent runtime errors

## Dependency Injection for Services

Dependency injection (DI) is a design pattern that improves modularity, testability, and maintainability of our game services by providing their dependencies externally rather than creating them internally.

### Core Principles

1. **Inversion of Control**: Services should receive their dependencies rather than create them
2. **Explicit Dependencies**: Dependencies should be clearly defined in service constructors
3. **Loose Coupling**: Services should depend on interfaces rather than concrete implementations
4. **Testability**: Dependencies should be easily replaceable with mocks during testing

### Implementation Approaches

#### 1. Constructor Injection

This is the preferred method for injecting dependencies. Services declare their dependencies as constructor parameters:

```typescript
/**
 * @description Service for managing player inventory
 * @class InventoryService
 * @implements IGameService
 */
class InventoryService implements IGameService {
  private databaseService: IDatabaseService;
  private eventBus: IEventBus;
  
  /**
   * @description Creates an instance of InventoryService with explicit dependencies
   * @param databaseService Service for persistent storage
   * @param eventBus System-wide event bus for publishing changes
   */
  constructor(databaseService: IDatabaseService, eventBus: IEventBus) {
    this.databaseService = databaseService;
    this.eventBus = eventBus;
  }
  
  async init(): Promise<void> {
    // Use injected dependencies during initialization
    const savedInventory = await this.databaseService.load('player-inventory');
    // Initialize with saved data
  }
  
  destroy(): void {
    // Clean up using dependencies
    this.eventBus.unsubscribeAll(this);
  }
  
  // Service-specific methods
}
```

This approach makes dependencies explicit and allows easy substitution during testing.

#### 2. ServiceRegistry-Based Injection

For larger services or dynamic dependencies, services can retrieve dependencies from the ServiceRegistry:

```typescript
/**
 * @description Service for managing world entities
 * @class EntityService
 * @implements IDependentService
 */
class EntityService implements IDependentService {
  // Explicitly declare dependencies
  public readonly dependencies = ['database', 'physics', 'rendering'];
  
  private serviceRegistry: ServiceRegistry;
  
  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }
  
  async init(): Promise<void> {
    // Get dependencies from registry when needed
    const database = this.serviceRegistry.get<IDatabaseService>('database');
    const physics = this.serviceRegistry.get<IPhysicsService>('physics');
    
    // Use dependencies
    const entities = await database.loadEntities();
    physics.registerEntities(entities);
  }
  
  destroy(): void {
    // Cleanup
  }
}
```

This approach is useful when:
- Services have many dependencies
- Dependencies change dynamically
- Circular dependencies exist (though these should be minimized)

#### 3. Factory-Based Injection

For complex service creation with multiple dependencies:

```typescript
/**
 * @description Factory for creating services with dependencies
 * @class ServiceFactory
 */
class ServiceFactory {
  private serviceRegistry: ServiceRegistry;
  
  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }
  
  /**
   * @description Create a combat service with all required dependencies
   * @returns Fully configured CombatService
   */
  createCombatService(): CombatService {
    const playerService = this.serviceRegistry.get<IPlayerService>('player');
    const enemyService = this.serviceRegistry.get<IEnemyService>('enemy');
    const audioService = this.serviceRegistry.get<IAudioService>('audio');
    const uiService = this.serviceRegistry.get<IUIService>('ui');
    
    return new CombatService(
      playerService,
      enemyService,
      audioService,
      uiService
    );
  }
}
```

### Advanced Dependency Injection Patterns

#### Lazy Dependency Resolution

For better performance and to avoid circular dependencies:

```typescript
/**
 * @description Service with lazy-loaded dependencies
 * @class LazyLoadingService
 */
class LazyLoadingService implements IGameService {
  private serviceRegistry: ServiceRegistry;
  private lazyDependencies: Map<string, IGameService> = new Map();
  
  constructor(serviceRegistry: ServiceRegistry) {
    this.serviceRegistry = serviceRegistry;
  }
  
  /**
   * @description Get a dependency, loading it only when first needed
   * @param name Name of the dependency service
   * @returns The requested service
   */
  private getDependency<T extends IGameService>(name: string): T {
    if (!this.lazyDependencies.has(name)) {
      this.lazyDependencies.set(name, this.serviceRegistry.get<T>(name));
    }
    return this.lazyDependencies.get(name) as T;
  }
  
  async init(): Promise<void> {
    // No dependencies loaded yet
  }
  
  performAction(): void {
    // Load dependency only when needed
    const audioService = this.getDependency<IAudioService>('audio');
    audioService.playSound('action-performed');
  }
  
  destroy(): void {
    this.lazyDependencies.clear();
  }
}
```

#### Optional Dependencies

For handling optional dependencies gracefully:

```typescript
/**
 * @description Service with some optional dependencies
 * @class AnalyticsService
 */
class AnalyticsService implements IGameService {
  private logger?: ILoggerService;
  
  /**
   * @description Creates analytics service with optional logging
   * @param logger Optional logger service for detailed logging
   */
  constructor(logger?: ILoggerService) {
    this.logger = logger;
  }
  
  trackEvent(event: string, data: any): void {
    // Use logger if available
    if (this.logger) {
      this.logger.debug('Analytics event', { event, data });
    }
    
    // Proceed with tracking regardless
    // ...
  }
  
  async init(): Promise<void> {
    // Initialize with or without logger
  }
  
  destroy(): void {
    // Clean up
  }
}
```

### Best Practices for Dependency Injection

1. **Constructor Injection First**: Prefer constructor injection for most cases
2. **Interface-Based Dependencies**: Depend on interfaces rather than concrete classes
3. **Minimal Dependencies**: Keep the number of dependencies per service manageable (≤5)
4. **Explicit Dependencies**: Make dependencies clear in service definitions
5. **Document Dependencies**: Add JSDoc comments explaining each dependency's purpose
6. **Test with Mock Dependencies**: Create mock implementations for testing
7. **Avoid Service Locator Anti-Pattern**: Don't use ServiceRegistry as a global variable throughout the codebase
8. **Avoid Circular Dependencies**: Redesign services that have circular dependencies

### Anti-Patterns to Avoid

1. **Hidden Dependencies**: Don't create dependencies inside methods without making them explicit
2. **Global State**: Avoid global variables for service instances
3. **Concrete Class Dependencies**: Don't depend directly on concrete implementations
4. **Too Many Dependencies**: A service with many dependencies likely has too many responsibilities
5. **Static Service Access**: Don't use static methods to access services

### Example: Full Dependency Injection Implementation

```typescript
// Define interfaces
interface IAudioService extends IGameService {
  playSound(id: string): void;
  stopSound(id: string): void;
}

interface IPlayerService extends IGameService {
  getPlayerState(): PlayerState;
  updatePosition(x: number, y: number): void;
}

// Implement a service with injected dependencies
class PlayerController implements IGameService {
  private playerService: IPlayerService;
  private audioService: IAudioService;
  private inputManager: InputManager;
  
  constructor(
    playerService: IPlayerService,
    audioService: IAudioService,
    inputManager: InputManager
  ) {
    this.playerService = playerService;
    this.audioService = audioService;
    this.inputManager = inputManager;
  }
  
  async init(): Promise<void> {
    // Register for input events
    this.inputManager.onMove((x, y) => {
      this.playerService.updatePosition(x, y);
      this.audioService.playSound('footstep');
    });
    
    // Other initialization
  }
  
  destroy(): void {
    // Unregister from input events
    this.inputManager.offAll();
  }
}

// Registration with the ServiceRegistry
const serviceRegistry = ServiceRegistry.getInstance();

// Create and register individual services
const audioService = new AudioService();
const databaseService = new DatabaseService();
const playerService = new PlayerService(databaseService);
const inputManager = new InputManager();

serviceRegistry.register('audio', audioService);
serviceRegistry.register('database', databaseService);
serviceRegistry.register('player', playerService);

// Create and register a service with dependencies
const playerController = new PlayerController(
  playerService, 
  audioService, 
  inputManager
);
serviceRegistry.register('playerController', playerController);

// Initialize all services
await serviceRegistry.initServices();
```

### Testing with Dependency Injection

Dependency injection makes testing significantly easier by allowing dependencies to be replaced with mocks:

```typescript
describe('PlayerController', () => {
  let controller: PlayerController;
  let mockPlayerService: jest.Mocked<IPlayerService>;
  let mockAudioService: jest.Mocked<IAudioService>;
  let mockInputManager: jest.Mocked<InputManager>;
  
  beforeEach(() => {
    // Create mocks for all dependencies
    mockPlayerService = {
      getPlayerState: jest.fn(),
      updatePosition: jest.fn(),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    };
    
    mockAudioService = {
      playSound: jest.fn(),
      stopSound: jest.fn(),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    };
    
    mockInputManager = {
      onMove: jest.fn(),
      offAll: jest.fn()
    };
    
    // Create controller with mock dependencies
    controller = new PlayerController(
      mockPlayerService,
      mockAudioService,
      mockInputManager
    );
  });
  
  test('should update player position and play sound when movement occurs', async () => {
    // Initialize controller
    await controller.init();
    
    // Get the movement callback registered with input manager
    const moveCallback = mockInputManager.onMove.mock.calls[0][0];
    
    // Simulate movement
    moveCallback(10, 20);
    
    // Verify dependencies were called correctly
    expect(mockPlayerService.updatePosition).toHaveBeenCalledWith(10, 20);
    expect(mockAudioService.playSound).toHaveBeenCalledWith('footstep');
  });
});
```

## Service Interface

All services must implement the `IGameService` interface as defined in the Sprint1ImplementationPlan.md:

```typescript
/**
 * @description Interface for all game services managed by the ServiceRegistry
 * @interface IGameService
 */
interface IGameService {
  /**
   * @description Initialize the service
   * @returns Promise<void> that resolves when initialization is complete
   */
  init(): Promise<void>;
  
  /**
   * @description Clean up resources when service is no longer needed
   */
  destroy(): void;
}
```

Optional interface extensions for more specialized services:

```typescript
/**
 * @description Interface for services that need to be updated each game loop
 * @interface IUpdatableService
 * @extends IGameService
 */
interface IUpdatableService extends IGameService {
  /**
   * @description Update method called each game loop
   * @param deltaTime Time elapsed since the last update in seconds
   */
  update(deltaTime: number): void;
}

/**
 * @description Interface for services with explicit dependencies
 * @interface IDependentService
 * @extends IGameService
 */
interface IDependentService extends IGameService {
  /**
   * @description List of service names this service depends on
   */
  readonly dependencies: string[];
}

/**
 * @description Interface for services that need to be paused/resumed
 * @interface IPausableService
 * @extends IGameService
 */
interface IPausableService extends IGameService {
  /**
   * @description Pause the service
   */
  pause(): void;
  
  /**
   * @description Resume the service
   */
  resume(): void;
  
  /**
   * @description Whether the service is currently paused
   */
  readonly isPaused: boolean;
}
```

## ServiceRegistry Usage

The ServiceRegistry follows the Singleton pattern and provides centralized management of all game services:

```typescript
/**
 * @description Centralized registry for managing game services
 * @class ServiceRegistry
 */
class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, IGameService>;
  
  private constructor() {
    this.services = new Map();
  }
  
  /**
   * @description Get the singleton instance of ServiceRegistry
   * @returns ServiceRegistry instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  /**
   * @description Register a service with the registry
   * @param name Unique identifier for the service
   * @param service Service instance implementing IGameService
   */
  public register(name: string, service: IGameService): void {
    if (this.services.has(name)) {
      console.warn(`Service ${name} already registered. Overriding existing service.`);
    }
    this.services.set(name, service);
  }
  
  /**
   * @description Get a service from the registry
   * @param name Name of the service to retrieve
   * @returns Service instance cast to the specified type
   * @throws Error if service is not found
   */
  public get<T extends IGameService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }
    return service as T;
  }
  
  /**
   * @description Initialize all registered services
   * @returns Promise that resolves when all services are initialized
   */
  public async initServices(): Promise<void> {
    // Services with explicit dependencies
    const dependentServices: IDependentService[] = [];
    const regularServices: IGameService[] = [];
    
    // Separate services with dependencies
    this.services.forEach(service => {
      if ('dependencies' in service && (service as IDependentService).dependencies.length > 0) {
        dependentServices.push(service as IDependentService);
      } else {
        regularServices.push(service);
      }
    });
    
    // Initialize regular services first
    await Promise.all(regularServices.map(service => service.init()));
    
    // Initialize dependent services in order of dependencies
    for (const service of this.sortByDependencies(dependentServices)) {
      await service.init();
    }
  }
  
  /**
   * @description Sort services by dependency order
   * @param services Array of services with dependencies
   * @returns Sorted array with dependencies coming before dependents
   */
  private sortByDependencies(services: IDependentService[]): IDependentService[] {
    // Implementation of topological sort to order services by dependencies
    // For simplicity in this example, we'll assume no circular dependencies
    const result: IDependentService[] = [];
    const visited = new Set<IDependentService>();
    
    const visit = (service: IDependentService) => {
      if (visited.has(service)) return;
      
      // Process dependencies first
      for (const depName of service.dependencies) {
        const dep = this.services.get(depName);
        if (!dep) {
          throw new Error(`Dependency not found: ${depName} for service`);
        }
        
        if ('dependencies' in dep) {
          visit(dep as IDependentService);
        }
      }
      
      visited.add(service);
      result.push(service);
    };
    
    for (const service of services) {
      visit(service);
    }
    
    return result;
  }
  
  /**
   * @description Destroy all services in reverse order of initialization
   */
  public destroyServices(): void {
    // Convert to array and reverse to destroy in opposite order of initialization
    const servicesArray = Array.from(this.services.values());
    servicesArray.reverse().forEach(service => service.destroy());
  }
}
```

## Service Lifecycle Management

Services follow a predictable lifecycle:

1. **Instantiation**: Service is created with necessary dependencies
2. **Registration**: Service is registered with ServiceRegistry
3. **Initialization**: `init()` method is called during game startup
4. **Runtime**: Service is accessed through the ServiceRegistry
5. **Destruction**: `destroy()` method is called during shutdown

Lifecycle hooks:
- `init()`: Async method called during initialization
- `update()`: Optional method called each frame (for updatable services)
- `destroy()`: Cleanup method called during shutdown

### Dependency Initialization Order

The order in which services are initialized is critical for proper operation. The ServiceRegistry handles this order automatically through:

1. First initializing services with no declared dependencies
2. Then initializing services with dependencies in topological order

![Service Dependency Initialization](https://via.placeholder.com/800x400?text=Service+Dependency+Initialization+Flow)

To ensure proper initialization:
- Always declare dependencies explicitly using the `IDependentService` interface
- Avoid circular dependencies between services
- Use the EventBus for communication between services that might create circular references
- Await the completion of `ServiceRegistry.initServices()` before accessing services

## Concrete Implementation Examples

The following examples demonstrate service implementations in dependency order, starting with foundational services required by other services, followed by more complex game-specific services.

### EventBus Service Example

The EventBus is a core service that enables communication between other services:

```typescript
/**
 * @description Service for handling application-wide events
 * @class EventBus
 * @implements IGameService
 */
export class EventBus implements IGameService {
  private static instance: EventBus;
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();
  
  private constructor() {}
  
  /**
   * @description Get singleton instance
   * @returns EventBus instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * @description Initialize the event system
   */
  public async init(): Promise<void> {
    this.eventListeners.clear();
    console.log('EventBus initialized');
  }
  
  /**
   * @description Subscribe to an event
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   * @returns Function to call to unsubscribe
   */
  public on(eventName: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    
    this.eventListeners.get(eventName)!.push(callback);
    
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }
  
  /**
   * @description Unsubscribe from an event
   * @param eventName Name of the event to unsubscribe from
   * @param callback Function to remove from listeners
   */
  public off(eventName: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(eventName)) return;
    
    const listeners = this.eventListeners.get(eventName)!;
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    // Remove the event entirely if no listeners remain
    if (listeners.length === 0) {
      this.eventListeners.delete(eventName);
    }
  }
  
  /**
   * @description Emit an event to all subscribers
   * @param eventName Name of the event to emit
   * @param data Data to pass to event handlers
   */
  public emit(eventName: string, data: any): void {
    // Handle direct event matches
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
    
    // Handle wildcard events (e.g., 'parent.*')
    const wildcardEvents = Array.from(this.eventListeners.keys()).filter(key => {
      // Check if this is a wildcard event that matches the current event
      if (!key.includes('*')) return false;
      
      const pattern = key.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(eventName);
    });
    
    wildcardEvents.forEach(wildcardEvent => {
      this.eventListeners.get(wildcardEvent)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in wildcard event handler for ${wildcardEvent}:`, error);
        }
      });
    });
  }
  
  /**
   * @description Clean up resources
   */
  public destroy(): void {
    this.eventListeners.clear();
  }
}
```

### Configuration Service Example

The Configuration service provides centralized configuration management:

```typescript
/**
 * @description Service for managing application configuration
 * @class ConfigurationService
 * @implements IGameService
 */
export class ConfigurationService implements IGameService {
  private static instance: ConfigurationService;
  private config: Record<string, any> = {};
  private environment: 'development' | 'production' = 'development';
  
  // Default configuration
  private readonly defaultConfig = {
    display: {
      width: 800,
      height: 600,
      backgroundColor: "#000000"
    },
    physics: {
      enabled: true,
      gravity: { x: 0, y: 300 }
    },
    debug: {
      enabled: false,
      showFPS: false,
      showHitboxes: false
    }
  };
  
  // Environment-specific configurations
  private readonly envConfigs = {
    development: {
      debug: {
        enabled: true,
        showFPS: true,
        showHitboxes: true
      }
    },
    production: {
      debug: {
        enabled: false,
        showFPS: false,
        showHitboxes: false
      }
    }
  };
  
  private constructor() {
    // Initialize with default config
    this.config = this.deepClone(this.defaultConfig);
  }
  
  /**
   * @description Get singleton instance
   * @returns ConfigurationService instance
   */
  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }
  
  /**
   * @description Initialize the configuration service
   */
  public async init(): Promise<void> {
    // Apply environment-specific config
    this.applyEnvironmentConfig();
    console.log(`ConfigurationService initialized in ${this.environment} environment`);
  }
  
  /**
   * @description Set the current environment
   * @param env Environment to use
   */
  public setEnvironment(env: 'development' | 'production'): void {
    this.environment = env;
    this.applyEnvironmentConfig();
  }
  
  /**
   * @description Get the current configuration
   * @returns Current configuration object
   */
  public getConfig(): Record<string, any> {
    return this.deepClone(this.config);
  }
  
  /**
   * @description Set a specific configuration value
   * @param path Path to configuration value (dot notation)
   * @param value Value to set
   */
  public setValue(path: string, value: any): void {
    const parts = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * @description Get a specific configuration value
   * @param path Path to configuration value (dot notation)
   * @param defaultValue Default value if path not found
   * @returns Configuration value or default
   */
  public getValue<T>(path: string, defaultValue: T): T {
    const parts = path.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current as T;
  }
  
  /**
   * @description Apply a custom configuration object
   * @param customConfig Configuration to apply
   */
  public setConfig(customConfig: Record<string, any>): void {
    // Validate configuration
    this.validateConfig(customConfig);
    
    // Deep merge with current config
    this.config = this.deepMerge(this.config, customConfig);
  }
  
  /**
   * @description Apply environment-specific configuration
   * @private
   */
  private applyEnvironmentConfig(): void {
    if (this.environment in this.envConfigs) {
      this.config = this.deepMerge(
        this.deepClone(this.defaultConfig),
        this.envConfigs[this.environment as keyof typeof this.envConfigs]
      );
    }
  }
  
  /**
   * @description Validate configuration values
   * @private
   * @param config Configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: Record<string, any>): void {
    // Example validation
    if (config.display?.width !== undefined && config.display.width <= 0) {
      throw new Error('Invalid configuration: display width must be positive');
    }
    
    if (config.display?.height !== undefined && config.display.height <= 0) {
      throw new Error('Invalid configuration: display height must be positive');
    }
  }
  
  /**
   * @description Deep clone an object
   * @private
   * @param obj Object to clone
   * @returns Cloned object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * @description Deep merge two objects
   * @private
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
  }
  
  /**
   * @description Clean up resources
   */
  public destroy(): void {
    // No specific cleanup needed
  }
}
```

### Persistence Service Example

The Persistence service handles data storage and retrieval:

```typescript
/**
 * @description Service for managing data persistence
 * @class PersistenceService
 * @implements IGameService
 */
export class PersistenceService implements IGameService {
  private static instance: PersistenceService;
  private readonly STORAGE_PREFIX = 'rpg_game_';
  private readonly MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private useIndexedDB: boolean = false;
  
  private constructor() {}
  
  /**
   * @description Get singleton instance
   * @returns PersistenceService instance
   */
  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }
  
  /**
   * @description Initialize the persistence service
   */
  public async init(): Promise<void> {
    // Check if IndexedDB is available as fallback
    this.useIndexedDB = this.isIndexedDBAvailable();
    
    try {
      // Get event bus from service registry to emit events
      const serviceRegistry = ServiceRegistry.getInstance();
      const eventBus = serviceRegistry.get<EventBus>('events');
      
      // Test storage capabilities
      await this.checkStorageSize();
      
      eventBus.emit('persistence.initialized', { useIndexedDB: this.useIndexedDB });
    } catch (error) {
      console.warn('Storage initialization error:', error);
    }
  }
  
  /**
   * @description Save data to persistent storage
   * @param key Storage key
   * @param data Data to save
   * @returns Promise resolving when save is complete
   */
  public async saveData(key: string, data: any): Promise<void> {
    const fullKey = `${this.STORAGE_PREFIX}${key}`;
    const jsonData = JSON.stringify(data);
    
    try {
      // Check if data is too large for localStorage
      if (jsonData.length > this.MAX_LOCAL_STORAGE_SIZE / 2) {
        console.warn(`Data for ${key} is approaching localStorage limits`);
        
        if (this.useIndexedDB) {
          return this.saveToIndexedDB(fullKey, data);
        }
      }
      
      // Try localStorage first
      localStorage.setItem(fullKey, jsonData);
    } catch (error) {
      console.error(`Failed to save data for ${key}`, error);
      
      // Try IndexedDB as fallback
      if (this.useIndexedDB) {
        return this.saveToIndexedDB(fullKey, data);
      }
      
      throw error;
    }
  }
  
  /**
   * @description Load data from persistent storage
   * @param key Storage key
   * @returns Promise resolving with loaded data or null if not found
   */
  public async loadData<T>(key: string): Promise<T | null> {
    const fullKey = `${this.STORAGE_PREFIX}${key}`;
    
    try {
      // Try localStorage first
      const data = localStorage.getItem(fullKey);
      
      if (data !== null) {
        return JSON.parse(data) as T;
      }
      
      // Try IndexedDB if available and data not in localStorage
      if (this.useIndexedDB) {
        return this.loadFromIndexedDB<T>(fullKey);
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load data for ${key}`, error);
      
      // Try IndexedDB as fallback for parsing errors
      if (this.useIndexedDB) {
        return this.loadFromIndexedDB<T>(fullKey);
      }
      
      throw error;
    }
  }
  
  /**
   * @description Delete data from persistent storage
   * @param key Storage key
   * @returns Promise resolving when delete is complete
   */
  public async deleteData(key: string): Promise<void> {
    const fullKey = `${this.STORAGE_PREFIX}${key}`;
    
    try {
      // Remove from localStorage
      localStorage.removeItem(fullKey);
      
      // Remove from IndexedDB if available
      if (this.useIndexedDB) {
        await this.deleteFromIndexedDB(fullKey);
      }
    } catch (error) {
      console.error(`Failed to delete data for ${key}`, error);
      throw error;
    }
  }
  
  /**
   * @description Save player data
   * @param playerData Player data to save
   * @returns Promise resolving when save is complete
   */
  public async savePlayerData(playerData: any): Promise<void> {
    return this.saveData('player', playerData);
  }
  
  /**
   * @description Load player data
   * @returns Promise resolving with player data or null if not found
   */
  public async getPlayerData(): Promise<any | null> {
    return this.loadData('player');
  }
  
  /**
   * @description Save game settings
   * @param settings Settings to save
   * @returns Promise resolving when save is complete
   */
  public async saveSettings(settings: any): Promise<void> {
    return this.saveData('settings', settings);
  }
  
  /**
   * @description Get game settings
   * @returns Promise resolving with settings or default settings if not found
   */
  public async getSettings(): Promise<any> {
    const settings = await this.loadData<Record<string, any>>('settings');
    
    // Return default settings if none found
    if (!settings) {
      return {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        difficulty: 'normal'
      };
    }
    
    return settings;
  }
  
  /**
   * @description Save character data
   * @param charactersData Character data to save
   * @returns Promise resolving when save is complete
   */
  public async saveCharacterData(charactersData: any[]): Promise<void> {
    return this.saveData('characters', charactersData);
  }
  
  /**
   * @description Get character data
   * @returns Promise resolving with character data or null if not found
   */
  public async getCharacterData(): Promise<any[] | null> {
    return this.loadData('characters');
  }
  
  /**
   * @description Save quest data for a character
   * @param characterId Character ID
   * @param questData Quest data to save
   * @returns Promise resolving when save is complete
   */
  public async saveQuestData(characterId: string, questData: any): Promise<void> {
    return this.saveData(`quests_${characterId}`, questData);
  }
  
  /**
   * @description Get quest data for a character
   * @param characterId Character ID
   * @returns Promise resolving with quest data or null if not found
   */
  public async getQuestData(characterId?: string): Promise<any | null> {
    if (characterId) {
      return this.loadData(`quests_${characterId}`);
    }
    
    // Get quests for active character if no ID specified
    const playerData = await this.getPlayerData();
    if (playerData && playerData.activeCharacterId) {
      return this.loadData(`quests_${playerData.activeCharacterId}`);
    }
    
    return null;
  }
  
  /**
   * @description Get completed quests
   * @returns Array of completed quest IDs
   */
  public getCompletedQuests(): string[] {
    try {
      const data = localStorage.getItem(`${this.STORAGE_PREFIX}completed_quests`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get completed quests', error);
      return [];
    }
  }
  
  /**
   * @description Add completed quest
   * @param questId ID of completed quest
   */
  public async addCompletedQuest(questId: string): Promise<void> {
    try {
      const completedQuests = this.getCompletedQuests();
      
      if (!completedQuests.includes(questId)) {
        completedQuests.push(questId);
        await this.saveData('completed_quests', completedQuests);
      }
    } catch (error) {
      console.error(`Failed to add completed quest: ${questId}`, error);
      throw error;
    }
  }
  
  /**
   * @description Check if IndexedDB is available
   * @private
   * @returns Whether IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    return 'indexedDB' in window;
  }
  
  /**
   * @description Check available storage size
   * @private
   */
  private async checkStorageSize(): Promise<void> {
    try {
      const testKey = `${this.STORAGE_PREFIX}_size_test`;
      const testSize = 1024 * 1024; // 1MB
      const testData = 'a'.repeat(testSize);
      
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
    } catch (error) {
      // We're likely out of space
      console.warn('Storage space check failed, will use IndexedDB if available');
      throw error;
    }
  }
  
  /**
   * @description Save data to IndexedDB
   * @private
   * @param key Storage key
   * @param data Data to save
   * @returns Promise resolving when save is complete
   */
  private saveToIndexedDB(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('gameData', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        
        store.put(data, key);
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = (error) => {
          db.close();
          reject(error);
        };
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  
  /**
   * @description Load data from IndexedDB
   * @private
   * @param key Storage key
   * @returns Promise resolving with loaded data or null if not found
   */
  private loadFromIndexedDB<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('gameData', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result as T || null);
        };
        
        getRequest.onerror = (error) => {
          db.close();
          reject(error);
        };
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  
  /**
   * @description Delete data from IndexedDB
   * @private
   * @param key Storage key
   * @returns Promise resolving when delete is complete
   */
  private deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('gameData', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => {
          db.close();
          resolve();
        };
        
        deleteRequest.onerror = (error) => {
          db.close();
          reject(error);
        };
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  
  /**
   * @description Clean up resources
   */
  public destroy(): void {
    // No specific cleanup needed
  }
}
```

### Character System Service Example

This service implements the core character system functionality required for the MVP:

```typescript
/**
 * @description Service for managing character creation and progression
 * @class CharacterService
 * @implements IGameService
 */
export class CharacterService implements IGameService {
  private static instance: CharacterService;
  private eventBus: EventBus; // Renamed from eventSystem for consistency
  private persistenceService: PersistenceService;
  private characters: Map<string, Character> = new Map();
  private activeCharacterId: string | null = null;
  
  /**
   * Character class types supported in the game
   */
  export type CharacterClass = 'warrior' | 'rogue' | 'mage';
  
  /**
   * Character appearance options
   */
  export interface CharacterAppearance {
    hair: string;
    face: string;
    clothes: string;
  }
  
  /**
   * Character stats structure
   */
  export interface CharacterStats {
    strength: number;
    intelligence: number;
    dexterity: number;
  }
  
  // Character class definitions for the MVP
  private readonly characterClasses: Record<CharacterClass, {
    baseStats: CharacterStats;
    abilities: string[];
    startingEquipment: string[];
  }> = {
    warrior: {
      baseStats: { strength: 10, intelligence: 5, dexterity: 7 },
      abilities: ['slash', 'block', 'charge'],
      startingEquipment: ['sword', 'shield', 'leather_armor']
    },
    rogue: {
      baseStats: { strength: 6, intelligence: 7, dexterity: 12 },
      abilities: ['backstab', 'dodge', 'stealth'],
      startingEquipment: ['dagger', 'bow', 'light_armor']
    },
    mage: {
      baseStats: { strength: 4, intelligence: 12, dexterity: 6 },
      abilities: ['fireball', 'frostbolt', 'teleport'],
      startingEquipment: ['staff', 'spellbook', 'cloth_robe']
    }
  };
  
  private constructor() {}
  
  /**
   * @description Get singleton instance
   * @returns CharacterService instance
   */
  public static getInstance(): CharacterService {
    if (!CharacterService.instance) {
      CharacterService.instance = new CharacterService();
    }
    return CharacterService.instance;
  }
  
  /**
   * @description Initialize the character service
   */
  public async init(): Promise<void> {
    const serviceRegistry = ServiceRegistry.getInstance();
    
    this.eventBus = serviceRegistry.get<EventBus>('events');
    this.persistenceService = serviceRegistry.get<PersistenceService>('persistence');
    
    // Load saved characters
    try {
      const savedCharacters = await this.persistenceService.getCharacterData();
      if (savedCharacters) {
        savedCharacters.forEach(charData => {
          const character = new Character(charData);
          this.characters.set(character.id, character);
        });
        
        this.eventBus.emit('characters.loaded', Array.from(this.characters.values()));
      }
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to load character data'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
    
    // Set up event listeners
    this.eventBus.on('character.levelup.request', this.handleLevelUpRequest.bind(this));
    this.eventBus.on('character.save.request', this.saveCharacters.bind(this));
  }
  
  /**
   * @description Create a new character
   * @param name Character name
   * @param characterClass Character class
   * @param appearance Appearance options
   * @returns The newly created character
   * @throws Error if validation fails
   */
  public createCharacter(
    name: string, 
    characterClass: CharacterClass,
    appearance: CharacterAppearance
  ): Character {
    // Validate inputs
    if (!name || name.length < 2) {
      throw new Error('Character name must be at least 2 characters');
    }
    
    if (!this.characterClasses[characterClass]) {
      throw new Error(`Invalid character class: ${characterClass}`);
    }
    
    // Generate unique ID
    const id = `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create character with class-specific stats and abilities
    const classTemplate = this.characterClasses[characterClass];
    
    const character = new Character({
      id,
      name,
      class: characterClass,
      level: 1,
      experience: 0,
      stats: { ...classTemplate.baseStats },
      abilities: [...classTemplate.abilities],
      equipment: {},
      inventory: [...classTemplate.startingEquipment],
      appearance
    });
    
    // Add to collection
    this.characters.set(id, character);
    
    // Set as active if first character
    if (this.characters.size === 1) {
      this.activeCharacterId = id;
    }
    
    // Emit event
    this.eventBus.emit('character.created', character);
    
    return character;
  }
  
  /**
   * @description Get all characters
   * @returns Array of all characters
   */
  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
  
  /**
   * @description Get active character
   * @returns Active character or null if none selected
   */
  public getActiveCharacter(): Character | null {
    if (!this.activeCharacterId) return null;
    return this.characters.get(this.activeCharacterId) || null;
  }
  
  /**
   * @description Set active character
   * @param characterId ID of character to set as active
   */
  public setActiveCharacter(characterId: string): void {
    if (!this.characters.has(characterId)) {
      throw new Error(`Character not found: ${characterId}`);
    }
    
    this.activeCharacterId = characterId;
    this.eventBus.emit('character.active.changed', this.getActiveCharacter());
  }
  
  /**
   * @description Add experience to active character
   * @param amount Amount of experience to add
   * @returns Whether the character leveled up
   */
  public addExperience(amount: number): boolean {
    const character = this.getActiveCharacter();
    if (!character) {
      throw new Error('No active character');
    }
    
    const oldLevel = character.level;
    character.experience += amount;
    
    // Check for level up (simple formula: 100 * current level)
    while (character.experience >= 100 * character.level) {
      character.level += 1;
      
      // Increase stats based on class
      const classTemplate = this.characterClasses[character.class as keyof typeof this.characterClasses];
      character.stats.strength += classTemplate.baseStats.strength * 0.1;
      character.stats.intelligence += classTemplate.baseStats.intelligence * 0.1;
      character.stats.dexterity += classTemplate.baseStats.dexterity * 0.1;
      
      // New abilities at specific levels
      if (character.level === 5) {
        switch (character.class) {
          case 'warrior':
            character.abilities.push('whirlwind');
            break;
          case 'rogue':
            character.abilities.push('shadowstep');
            break;
          case 'mage':
            character.abilities.push('arcane_explosion');
            break;
        }
      }
      
      // Level 10 (max for MVP) abilities
      if (character.level === 10) {
        switch (character.class) {
          case 'warrior':
            character.abilities.push('berserker_rage');
            break;
          case 'rogue':
            character.abilities.push('death_mark');
            break;
          case 'mage':
            character.abilities.push('time_warp');
            break;
        }
      }
    }
    
    // If leveled up, emit event
    if (character.level > oldLevel) {
      this.eventBus.emit('character.levelup', {
        character,
        oldLevel,
        newLevel: character.level
      });
      return true;
    }
    
    return false;
  }
  
  /**
   * @description Handle level up request event
   * @private
   */
  private handleLevelUpRequest(data: { statChoices: { [stat: string]: number } }): void {
    const character = this.getActiveCharacter();
    if (!character) return;
    
    // Apply stat choices from level up
    Object.entries(data.statChoices).forEach(([stat, value]) => {
      if (stat in character.stats) {
        character.stats[stat as keyof typeof character.stats] += value;
      }
    });
    
    this.eventBus.emit('character.stats.updated', character);
  }
  
  /**
   * @description Save all characters
   * @private
   */
  private async saveCharacters(): Promise<void> {
    try {
      await this.persistenceService.saveCharacterData(
        Array.from(this.characters.values()).map(c => c.serialize())
      );
      this.eventBus.emit('characters.saved');
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to save character data'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
  }
  
  /**
   * @description Clean up resources
   */
  public destroy(): void {
    this.eventBus.off('character.levelup.request', this.handleLevelUpRequest.bind(this));
    this.eventBus.off('character.save.request', this.saveCharacters.bind(this));
    this.characters.clear();
    this.activeCharacterId = null;
  }
}

/**
 * @description Character class with improved typing
 * @class Character
 */
export class Character {
  public id: string;
  public name: string;
  public class: CharacterClass;
  public level: number;
  public experience: number;
  public stats: CharacterStats;
  public abilities: string[];
  public equipment: Record<string, string>;
  public inventory: string[];
  public appearance: CharacterAppearance;
  
  constructor(data: CharacterData) {
    this.id = data.id;
    this.name = data.name;
    this.class = data.class as CharacterClass;
    this.level = data.level;
    this.experience = data.experience;
    this.stats = data.stats;
    this.abilities = data.abilities;
    this.equipment = data.equipment;
    this.inventory = data.inventory;
    this.appearance = data.appearance;
  }
  
  serialize(): CharacterData {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      level: this.level,
      experience: this.experience,
      stats: { ...this.stats },
      abilities: [...this.abilities],
      equipment: { ...this.equipment },
      inventory: [...this.inventory],
      appearance: { ...this.appearance }
    };
  }
}

/**
 * @description Character data structure for serialization/deserialization
 */
export interface CharacterData {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  stats: CharacterStats;
  abilities: string[];
  equipment: Record<string, string>;
  inventory: string[];
  appearance: CharacterAppearance;
}
```

### Quest System Service Example

This service implements the basic quest functionality required for the MVP:

```typescript
/**
 * @description Service for managing quests
 * @class QuestService
 * @implements IGameService
 */
export class QuestService implements IGameService {
  private static instance: QuestService;
  private eventBus: EventBus;
  private persistenceService: PersistenceService;
  private characterService: CharacterService;
  
  private quests: Map<string, Quest> = new Map();
  private activeQuests: Map<string, QuestInstance> = new Map();
  
  private constructor() {}
  
  /**
   * @description Get singleton instance
   * @returns QuestService instance
   */
  public static getInstance(): QuestService {
    if (!QuestService.instance) {
      QuestService.instance = new QuestService();
    }
    return QuestService.instance;
  }
  
  /**
   * @description Initialize the quest service
   */
  public async init(): Promise<void> {
    const serviceRegistry = ServiceRegistry.getInstance();
    
    this.eventBus = serviceRegistry.get<EventBus>('events');
    this.persistenceService = serviceRegistry.get<PersistenceService>('persistence');
    this.characterService = serviceRegistry.get<CharacterService>('character');
    
    // Load quest definitions (for MVP, these could be hardcoded)
    this.setupQuestDefinitions();
    
    // Load active quests
    try {
      const savedQuestData = await this.persistenceService.getQuestData();
      if (savedQuestData) {
        savedQuestData.forEach(questData => {
          const quest = this.quests.get(questData.questId);
          if (quest) {
            const questInstance = new QuestInstance(quest, questData.progress);
            this.activeQuests.set(questData.id, questInstance);
          }
        });
      }
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to load quest data'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
    
    // Set up event listeners
    this.eventBus.on('quest.progress.update', this.handleQuestProgressUpdate.bind(this));
    this.eventBus.on('quest.abandon', this.abandonQuest.bind(this));
    this.eventBus.on('character.active.changed', this.handleCharacterChanged.bind(this));
    
    // Set up event listeners for quest objectives
    this.eventBus.on('enemy.defeated', this.handleEnemyDefeated.bind(this));
    this.eventBus.on('item.collected', this.handleItemCollected.bind(this));
    this.eventBus.on('npc.interacted', this.handleNpcInteracted.bind(this));
    this.eventBus.on('location.discovered', this.handleLocationDiscovered.bind(this));
  }
  
  /**
   * @description Set up quest definitions for MVP
   * @private
   */
  private setupQuestDefinitions(): void {
    // Main story quest
    const mainQuest = new Quest({
      id: 'main_story_1',
      title: 'The Awakening',
      description: 'Investigate the strange occurrences in the forest',
      type: 'main',
      minLevel: 1,
      rewards: {
        experience: 100,
        gold: 50,
        items: ['magic_amulet']
      },
      objectives: [
        {
          id: 'talk_to_elder',
          type: 'npc_interact',
          target: 'village_elder',
          count: 1,
          description: 'Speak with the Village Elder'
        },
        {
          id: 'explore_forest',
          type: 'location_discover',
          target: 'ancient_grove',
          count: 1,
          description: 'Find the Ancient Grove'
        },
        {
          id: 'defeat_shadow',
          type: 'enemy_defeat',
          target: 'shadow_beast',
          count: 1,
          description: 'Defeat the Shadow Beast'
        },
        {
          id: 'return_elder',
          type: 'npc_interact',
          target: 'village_elder',
          count: 1,
          description: 'Return to the Village Elder'
        }
      ]
    });
    
    // Side quests
    const gatherHerbsQuest = new Quest({
      id: 'gather_herbs',
      title: 'Medicinal Needs',
      description: 'Gather herbs for the village healer',
      type: 'side',
      repeatable: true,
      minLevel: 1,
      rewards: {
        experience: 50,
        gold: 25,
        items: ['healing_potion']
      },
      objectives: [
        {
          id: 'gather_red_herbs',
          type: 'item_collect',
          target: 'red_herb',
          count: 5,
          description: 'Gather 5 Red Herbs'
        },
        {
          id: 'gather_blue_herbs',
          type: 'item_collect',
          target: 'blue_herb',
          count: 3,
          description: 'Gather 3 Blue Herbs'
        },
        {
          id: 'return_healer',
          type: 'npc_interact',
          target: 'village_healer',
          count: 1,
          description: 'Return to the Healer'
        }
      ]
    });
    
    // Combat challenge
    const huntingQuest = new Quest({
      id: 'hunting_wolves',
      title: 'Wolf Hunt',
      description: 'Clear the wolf pack that threatens the village',
      type: 'side',
      repeatable: true,
      minLevel: 2,
      rewards: {
        experience: 75,
        gold: 40,
        items: ['wolf_pelt']
      },
      objectives: [
        {
          id: 'defeat_wolves',
          type: 'enemy_defeat',
          target: 'wolf',
          count: 10,
          description: 'Defeat 10 Wolves'
        },
        {
          id: 'defeat_alpha',
          type: 'enemy_defeat',
          target: 'alpha_wolf',
          count: 1,
          description: 'Defeat the Alpha Wolf'
        }
      ]
    });
    
    // Add quests to collection
    this.quests.set(mainQuest.id, mainQuest);
    this.quests.set(gatherHerbsQuest.id, gatherHerbsQuest);
    this.quests.set(huntingQuest.id, huntingQuest);
    
    // Add more quests here...
  }
  
  /**
   * @description Get all available quests
   * @returns Array of available quests
   */
  public getAvailableQuests(): Quest[] {
    const character = this.characterService.getActiveCharacter();
    if (!character) return [];
    
    return Array.from(this.quests.values()).filter(quest => {
      // Check if quest is already active
      const isActive = Array.from(this.activeQuests.values())
        .some(instance => instance.quest.id === quest.id);
      
      // Check if quest is repeatable or not already completed
      const isCompleted = this.isQuestCompleted(quest.id);
      
      // Check level requirements
      const meetsLevelReq = character.level >= quest.minLevel;
      
      return meetsLevelReq && (!isActive) && (!isCompleted || quest.repeatable);
    });
  }
  
  /**
   * @description Get active quests
   * @returns Array of active quest instances
   */
  public getActiveQuests(): QuestInstance[] {
    return Array.from(this.activeQuests.values());
  }
  
  /**
   * @description Check if a quest has been completed
   * @param questId Quest ID to check
   * @returns Whether the quest has been completed
   * @private
   */
  private isQuestCompleted(questId: string): boolean {
    // For MVP, we'll use a simple check against localStorage
    try {
      const completedQuests = this.persistenceService.getCompletedQuests();
      return completedQuests ? completedQuests.includes(questId) : false;
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to check completed quests'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return false;
    }
  }
  
  /**
   * @description Accept a quest
   * @param questId ID of quest to accept
   * @returns The quest instance or null if failed
   */
  public acceptQuest(questId: string): QuestInstance | null {
    const quest = this.quests.get(questId);
    if (!quest) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Quest not found: ${questId}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return null;
    }
    
    const character = this.characterService.getActiveCharacter();
    if (!character) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        'No active character'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return null;
    }
    
    // Check level requirement
    if (character.level < quest.minLevel) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Character level too low for quest: ${questId}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return null;
    }
    
    // Check if already active
    if (Array.from(this.activeQuests.values()).some(q => q.quest.id === questId)) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Quest already active: ${questId}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return null;
    }
    
    // Create quest instance
    const instanceId = `quest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const questInstance = new QuestInstance(quest, {});
    
    // Add to active quests
    this.activeQuests.set(instanceId, questInstance);
    
    // Emit event
    this.eventBus.emit('quest.accepted', {
      quest: questInstance.quest,
      character
    });
    
    return questInstance;
  }
  
  /**
   * @description Complete a quest
   * @param instanceId ID of quest instance to complete
   * @returns Whether completion was successful
   */
  public completeQuest(instanceId: string): boolean {
    const questInstance = this.activeQuests.get(instanceId);
    if (!questInstance) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Quest instance not found: ${instanceId}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return false;
    }
    
    // Check if all objectives complete
    if (!questInstance.isComplete()) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Quest not complete: ${questInstance.quest.id}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return false;
    }
    
    const character = this.characterService.getActiveCharacter();
    if (!character) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        'No active character'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return false;
    }
    
    // Award rewards
    const rewards = questInstance.quest.rewards;
    
    // XP
    if (rewards.experience) {
      this.characterService.addExperience(rewards.experience);
    }
    
    // Gold and items handled by other services via events
    this.eventBus.emit('quest.completed', {
      quest: questInstance.quest,
      character,
      rewards
    });
    
    // Mark as completed
    try {
      this.persistenceService.addCompletedQuest(questInstance.quest.id);
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to mark quest as completed'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
    
    // Remove from active quests
    this.activeQuests.delete(instanceId);
    
    return true;
  }
  
  /**
   * @description Abandon a quest
   * @param instanceId ID of quest instance to abandon
   * @returns Whether abandonment was successful
   */
  public abandonQuest(instanceId: string): boolean {
    const questInstance = this.activeQuests.get(instanceId);
    if (!questInstance) {
      const serviceError = ErrorHandler.createError(
        null,
        ErrorType.VALIDATION,
        `Quest instance not found: ${instanceId}`
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
      return false;
    }
    
    // Remove from active quests
    this.activeQuests.delete(instanceId);
    
    // Emit event
    this.eventBus.emit('quest.abandoned', {
      quest: questInstance.quest,
      character: this.characterService.getActiveCharacter()
    });
    
    return true;
  }
  
  /**
   * @description Handle quest progress update
   * @param data Progress update data
   * @private
   */
  private handleQuestProgressUpdate(data: {
    instanceId: string;
    objectiveId: string;
    progress: number;
  }): void {
    const { instanceId, objectiveId, progress } = data;
    
    const questInstance = this.activeQuests.get(instanceId);
    if (!questInstance) return;
    
    // Update objective progress
    const updated = questInstance.updateObjectiveProgress(objectiveId, progress);
    
    if (updated) {
      // Check if quest is now complete
      if (questInstance.isComplete()) {
        this.eventBus.emit('quest.ready_for_completion', {
          instanceId,
          quest: questInstance.quest
        });
      }
      
      // Save quest progress
      this.saveQuestProgress();
    }
  }
  
  /**
   * @description Handle character changed event
   * @private
   */
  private handleCharacterChanged(): void {
    // Reset active quests when character changes
    this.activeQuests.clear();
    
    // Load quests for new character
    this.loadQuestsForCurrentCharacter();
  }
  
  /**
   * @description Load quests for current character
   * @private
   */
  private async loadQuestsForCurrentCharacter(): Promise<void> {
    const character = this.characterService.getActiveCharacter();
    if (!character) return;
    
    try {
      const savedQuestData = await this.persistenceService.getQuestData(character.id);
      if (savedQuestData) {
        savedQuestData.forEach(questData => {
          const quest = this.quests.get(questData.questId);
          if (quest) {
            const questInstance = new QuestInstance(quest, questData.progress);
            this.activeQuests.set(questData.id, questInstance);
          }
        });
      }
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to load quest data for character'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
  }
  
  /**
   * @description Save quest progress
   * @private
   */
  private async saveQuestProgress(): Promise<void> {
    const character = this.characterService.getActiveCharacter();
    if (!character) return;
    
    try {
      const questData = Array.from(this.activeQuests.entries()).map(([id, instance]) => ({
        id,
        questId: instance.quest.id,
        progress: instance.getProgress()
      }));
      
      await this.persistenceService.saveQuestData(character.id, questData);
    } catch (error) {
      const serviceError = ErrorHandler.createError(
        error,
        ErrorType.DATA_PERSISTENCE,
        'Failed to save quest progress'
      );
      ErrorHandler.reportError(serviceError, this.eventBus);
    }
  }
  
  /**
   * @description Handle enemy defeated event (for quest objectives)
   * @private
   */
  private handleEnemyDefeated(data: { enemyType: string }): void {
    this.updateObjectiveProgress('enemy_defeat', data.enemyType);
  }
  
  /**
   * @description Handle item collected event (for quest objectives)
   * @private
   */
  private handleItemCollected(data: { itemId: string }): void {
    this.updateObjectiveProgress('item_collect', data.itemId);
  }
  
  /**
   * @description Handle NPC interaction event (for quest objectives)
   * @private
   */
  private handleNpcInteracted(data: { npcId: string }): void {
    this.updateObjectiveProgress('npc_interact', data.npcId);
  }
  
  /**
   * @description Handle location discovered event (for quest objectives)
   * @private
   */
  private handleLocationDiscovered(data: { locationId: string }): void {
    this.updateObjectiveProgress('location_discover', data.locationId);
  }
  
  /**
   * @description Update objective progress based on event
   * @param objectiveType Type of objective
   * @param targetId Target ID
   * @private
   */
  private updateObjectiveProgress(objectiveType: string, targetId: string): void {
    // Check all active quests for matching objectives
    this.activeQuests.forEach((instance, instanceId) => {
      instance.quest.objectives.forEach(objective => {
        if (objective.type === objectiveType && objective.target === targetId) {
          const currentProgress = instance.getObjectiveProgress(objective.id) || 0;
          if (currentProgress < objective.count) {
            this.handleQuestProgressUpdate({
              instanceId,
              objectiveId: objective.id,
              progress: currentProgress + 1
            });
          }
        }
      });
    });
  }
  
  /**
   * @description Clean up resources
   */
  public destroy(): void {
    // Remove event listeners
    this.eventBus.off('quest.progress.update', this.handleQuestProgressUpdate.bind(this));
    this.eventBus.off('quest.abandon', this.abandonQuest.bind(this));
    this.eventBus.off('character.active.changed', this.handleCharacterChanged.bind(this));
    
    this.eventBus.off('enemy.defeated', this.handleEnemyDefeated.bind(this));
    this.eventBus.off('item.collected', this.handleItemCollected.bind(this));
    this.eventBus.off('npc.interacted', this.handleNpcInteracted.bind(this));
    this.eventBus.off('location.discovered', this.handleLocationDiscovered.bind(this));
    
    // Save quest progress before destroying
    this.saveQuestProgress();
    
    this.quests.clear();
    this.activeQuests.clear();
  }
}

/**
 * @description Quest class
 * @class Quest
 */
class Quest {
  public id: string;
  public title: string;
  public description: string;
  public type: 'main' | 'side';
  public repeatable: boolean;
  public minLevel: number;
  public rewards: {
    experience: number;
    gold: number;
    items: string[];
  };
  public objectives: Array<{
    id: string;
    type: string;
    target: string;
    count: number;
    description: string;
  }>;
  
  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type;
    this.repeatable = data.repeatable || false;
    this.minLevel = data.minLevel || 1;
    this.rewards = data.rewards;
    this.objectives = data.objectives;
  }
}

/**
 * @description Quest instance class
 * @class QuestInstance
 */
class QuestInstance {
  public quest: Quest;
  private progress: Record<string, number>;
  
  constructor(quest: Quest, progress: Record<string, number>) {
    this.quest = quest;
    this.progress = progress || {};
    
    // Initialize progress for objectives that don't have it
    this.quest.objectives.forEach(objective => {
      if (!(objective.id in this.progress)) {
        this.progress[objective.id] = 0;
      }
    });
  }
  
  /**
   * @description Update objective progress
   * @param objectiveId Objective ID
   * @param progress New progress value
   * @returns Whether the update was successful
   */
  public updateObjectiveProgress(objectiveId: string, progress: number): boolean {
    const objective = this.quest.objectives.find(o => o.id === objectiveId);
    if (!objective) return false;
    
    // Ensure progress doesn't exceed required count
    this.progress[objectiveId] = Math.min(progress, objective.count);
    return true;
  }
  
  /**
   * @description Get objective progress
   * @param objectiveId Objective ID
   * @returns Current progress value
   */
  public getObjectiveProgress(objectiveId: string): number {
    return this.progress[objectiveId] || 0;
  }
  
  /**
   * @description Get overall progress object
   * @returns Progress object
   */
  public getProgress(): Record<string, number> {
    return { ...this.progress };
  }
  
  /**
   * @description Check if quest is complete
   * @returns Whether all objectives are complete
   */
  public isComplete(): boolean {
    return this.quest.objectives.every(objective => 
      (this.progress[objective.id] || 0) >= objective.count
    );
  }
  
  /**
   * @description Get completion percentage
   * @returns Percentage of quest completed (0-100)
   */
  public getCompletionPercentage(): number {
    if (this.quest.objectives.length === 0) return 100;
    
    const totalRequired = this.quest.objectives.reduce((sum, obj) => sum + obj.count, 0);
    const currentProgress = this.quest.objectives.reduce((sum, obj) => 
      sum + Math.min(this.progress[obj.id] || 0, obj.count), 0);
    
    return Math.floor((currentProgress / totalRequired) * 100);
  }
}

/**
 * @description Utility for handling errors in services
 */
export class ErrorHandler {
  /**
   * @description Report an error to the event bus and console
   * @param error Error details
   * @param eventBus EventBus instance
   */
  public static reportError(error: ServiceError, eventBus?: EventBus): void {
    // Log to console with appropriate level
    console.error(`[${error.type}] ${error.message}`, error.details || '');
    
    // Emit event if eventBus available
    if (eventBus) {
      eventBus.emit('error', error);
      
      // Also emit a more specific event for this error type
      eventBus.emit(`error.${error.type}`, error);
    }
  }
  
  /**
   * @description Create a standardized error from an exception
   * @param e Caught exception
   * @param type Error type
   * @param message Custom message
   * @returns Formatted error object
   */
  public static createError(e: any, type: ErrorType, message: string): ServiceError {
    return {
      type,
      message,
      details: e?.message || (e ? e.toString() : undefined),
      originalError: e instanceof Error ? e : e ? new Error(e.toString()) : undefined
    };
  }
  
  /**
   * @description Try to execute a function and handle errors
   * @param fn Function to execute
   * @param errorType Type of error if function fails
   * @param errorMessage Message if function fails
   * @param eventBus Optional EventBus to report errors
   * @returns Result of the function or null if failed
   */
  public static async tryCatch<T>(
    fn: () => Promise<T>,
    errorType: ErrorType,
    errorMessage: string,
    eventBus?: EventBus
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (e) {
      const error = this.createError(e, errorType, errorMessage);
      this.reportError(error, eventBus);
      return null;
    }
  }
}

### Testing Services with Dependencies

```typescript
// PlayerService.test.ts
import { PlayerService } from '../services/implementations/PlayerService';
import { ServiceRegistry } from '../core/ServiceRegistry';
import { EventBus } from '../core/EventBus';
import { PersistenceService } from '../services/implementations/PersistenceService';

describe('PlayerService', () => {
  let playerService: PlayerService;
  let mockEventBus: EventBus;
  let mockPersistenceService: PersistenceService;
  
  beforeEach(() => {
    // Reset the singleton
    (ServiceRegistry as any).instance = null;
    const serviceRegistry = ServiceRegistry.getInstance();
    
    // Create mock services
    mockEventBus = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    } as unknown as EventBus;
    
    mockPersistenceService = {
      getPlayerData: jest.fn().mockResolvedValue(null),
      savePlayerData: jest.fn().mockResolvedValue(undefined),
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    } as unknown as PersistenceService;
    
    // Register mock services
    serviceRegistry.register('events', mockEventBus);
    serviceRegistry.register('persistence', mockPersistenceService);
    
    // Create service under test
    playerService = PlayerService.getInstance();
    
    // Re-register to ensure we're testing the same instance
    serviceRegistry.register('player', playerService);
  });
  
  test('should initialize and set up event listeners', async () => {
    // Act
    await playerService.init();
    
    // Assert
    expect(mockEventBus.on).toHaveBeenCalledWith(
      'player.save.request', 
      expect.any(Function)
    );
  });
  
  test('should load player data on initialization if available', async () => {
    // Arrange
    const mockPlayerData = { name: 'TestPlayer', health: 100, level: 5 };
    (mockPersistenceService.getPlayerData as jest.Mock).mockResolvedValueOnce(mockPlayerData);
    
    // Act
    await playerService.init();
    
    // Assert
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'player.loaded',
      expect.objectContaining({ name: 'TestPlayer' })
    );
  });
  
  test('should create a new player', async () => {
    // Arrange
    await playerService.init();
    
    // Act
    const player = playerService.createPlayer('NewPlayer');
    
    // Assert
    expect(player.name).toBe('NewPlayer');
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'player.created',
      expect.objectContaining({ name: 'NewPlayer' })
    );
  });
});
```

### Testing Service Integration

```typescript
// ServiceIntegration.test.ts
import { ServiceRegistry } from '../core/ServiceRegistry';
import { EventBus } from '../core/EventBus';
import { PlayerService } from '../services/implementations/PlayerService';
import { PersistenceService } from '../services/implementations/PersistenceService';

describe('Service Integration', () => {
  let serviceRegistry: ServiceRegistry;
  let eventBus: EventBus;
  let playerService: PlayerService;
  let persistenceService: PersistenceService;
  
  beforeEach(async () => {
    // Reset all singletons
    (ServiceRegistry as any).instance = null;
    (EventBus as any).instance = null;
    (PlayerService as any).instance = null;
    (PersistenceService as any).instance = null;
    
    // Create and set up services
    serviceRegistry = ServiceRegistry.getInstance();
    eventBus = EventBus.getInstance();
    playerService = PlayerService.getInstance();
    persistenceService = PersistenceService.getInstance();
    
    // Mock implementation of persistence service
    persistenceService.getPlayerData = jest.fn().mockResolvedValue(null);
    persistenceService.savePlayerData = jest.fn().mockResolvedValue(undefined);
    
    // Register services
    serviceRegistry.register('events', eventBus);
    serviceRegistry.register('persistence', persistenceService);
    serviceRegistry.register('player', playerService);
    
    // Initialize services
    await serviceRegistry.initServices();
  });
  
  test('should save player data when save event is triggered', async () => {
    // Arrange
    const player = playerService.createPlayer('TestPlayer');
    
    // Act
    eventBus.emit('player.save.request', null);
    
    // Use a small delay to allow for promise resolution
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Assert
    expect(persistenceService.savePlayerData).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'TestPlayer'
      })
    );
  });
  
  test('player service should emit events that can be caught by other services', async () => {
    // Arrange
    const eventHandler = jest.fn();
    eventBus.on('player.created', eventHandler);
    
    // Act
    playerService.createPlayer('EventTestPlayer');
    
    // Assert
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'EventTestPlayer'
      })
    );
  });
});
```

### Mocking Phaser Objects

When testing services that interact with Phaser.js objects, create appropriate mocks:

```typescript
// Creating mock Phaser objects for testing
const createMockScene = () => {
  return {
    add: {
      sprite: jest.fn().mockReturnValue({
        setTexture: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      })
    },
    load: {
      image: jest.fn(),
      spritesheet: jest.fn(),
      audio: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'complete') {
          callback();
        }
      })
    },
    cameras: {
      main: {
        shake: jest.fn()
      }
    }
  };
};

// Example test for a service that uses Phaser objects
test('should create an entity in the scene', () => {
  // Arrange
  const mockScene = createMockScene();
  entityService.setActiveScene(mockScene as unknown as Phaser.Scene);
  
  // Act
  const entity = entityService.createEntity('player', 100, 200, 'player_texture');
  
  // Assert
  expect(mockScene.add.sprite).toHaveBeenCalledWith(100, 200, 'player_texture');
  expect(entityService.getEntity('player')).toBe(entity);
});
```

## Testing Strategies

### Service Testing Framework

Services should be tested using Jest with TypeScript support. Here's a comprehensive example of testing a service:

```typescript
// player.service.test.ts
import { PlayerService } from './player.service';
import { ServiceRegistry } from '../core/ServiceRegistry';
import { EventBus } from '../core/EventBus';
import { createMockScene } from '../test/helpers/phaser-mock';

describe('PlayerService', () => {
  let playerService: PlayerService;
  let eventBus: EventBus;
  let mockScene: Phaser.Scene;
  
  beforeEach(() => {
    // Reset services for each test
    eventBus = EventBus.getInstance();
    playerService = new PlayerService(eventBus);
    mockScene = createMockScene();
    
    // Register services
    const registry = ServiceRegistry.getInstance();
    registry.register('events', eventBus);
    registry.register('player', playerService);
  });
  
  afterEach(() => {
    // Clean up after each test
    playerService.destroy();
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize with default state', async () => {
      // Act
      await playerService.init();
      
      // Assert
      expect(playerService.getPlayerState()).toEqual({
        health: 100,
        position: { x: 0, y: 0 },
        inventory: []
      });
    });
    
    it('should load saved state if available', async () => {
      // Arrange
      const savedState = {
        health: 75,
        position: { x: 100, y: 200 },
        inventory: ['potion']
      };
      localStorage.setItem('player_state', JSON.stringify(savedState));
      
      // Act
      await playerService.init();
      
      // Assert
      expect(playerService.getPlayerState()).toEqual(savedState);
    });
  });
  
  describe('event handling', () => {
    it('should emit events when player takes damage', async () => {
      // Arrange
      await playerService.init();
      const damageSpy = jest.fn();
      eventBus.on('player.damaged', damageSpy);
      
      // Act
      playerService.takeDamage(25);
      
      // Assert
      expect(damageSpy).toHaveBeenCalledWith({
        amount: 25,
        currentHealth: 75
      });
    });
  });
  
  describe('scene integration', () => {
    it('should create player sprite in scene', () => {
      // Arrange
      playerService.setActiveScene(mockScene);
      
      // Act
      const sprite = playerService.createPlayerSprite();
      
      // Assert
      expect(mockScene.add.sprite).toHaveBeenCalledWith(0, 0, 'player');
      expect(sprite).toBeDefined();
    });
  });
});
```

### Performance Testing

Services should include performance tests for critical operations:

```typescript
// performance.test.ts
import { PerformanceService } from './performance.service';
import { ServiceRegistry } from '../core/ServiceRegistry';

describe('PerformanceService', () => {
  let perfService: PerformanceService;
  
  beforeEach(() => {
    perfService = new PerformanceService();
    ServiceRegistry.getInstance().register('performance', perfService);
  });
  
  it('should maintain 60 FPS under normal load', () => {
    // Arrange
    const targetFPS = 60;
    const tolerance = 5; // Allow 5 FPS variance
    
    // Act
    for (let i = 0; i < 100; i++) {
      perfService.update(1/60); // Simulate 60 FPS updates
      // Simulate game load
      for (let j = 0; j < 1000; j++) {
        Math.random();
      }
    }
    
    // Assert
    const avgFPS = perfService.getAverageFPS();
    expect(avgFPS).toBeGreaterThanOrEqual(targetFPS - tolerance);
  });
  
  it('should handle asset loading within time budget', async () => {
    // Arrange
    const timeLimit = 100; // milliseconds
    
    // Act
    const startTime = performance.now();
    await perfService.loadTestAssets();
    const loadTime = performance.now() - startTime;
    
    // Assert
    expect(loadTime).toBeLessThan(timeLimit);
  });
});
```

### Testing Services with Dependencies

```typescript
// inventory.service.test.ts
describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockDatabaseService: jest.Mocked<IDatabaseService>;
  let mockEventBus: jest.Mocked<EventBus>;
  
  beforeEach(() => {
    // Create mocks
    mockDatabaseService = {
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    
    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
    
    // Create service with mocked dependencies
    inventoryService = new InventoryService(mockDatabaseService, mockEventBus);
  });
  
  it('should save inventory changes', async () => {
    // Arrange
    const item = { id: 'potion', quantity: 1 };
    
    // Act
    await inventoryService.addItem(item);
    
    // Assert
    expect(mockDatabaseService.save).toHaveBeenCalledWith(
      'inventory',
      expect.arrayContaining([item])
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'inventory.item.added',
      expect.objectContaining(item)
    );
  });
});
```

### Testing Error Handling

```typescript
// error-handling.test.ts
describe('ErrorHandling', () => {
  it('should handle network errors gracefully', async () => {
    // Arrange
    const mockError = new Error('Network failure');
    mockDatabaseService.save.mockRejectedValue(mockError);
    
    // Act & Assert
    await expect(inventoryService.addItem({ id: 'potion', quantity: 1 }))
      .rejects
      .toThrow('Failed to save inventory');
      
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        type: ErrorType.DATA_PERSISTENCE,
        originalError: mockError
      })
    );
  });
});
```

## Performance Optimization Patterns

### Browser Optimization

1. **Memory Management**:
```typescript
export class ResourceManager implements IGameService {
  private resources: Map<string, WeakRef<any>> = new Map();
  private cleanupInterval: number = 5000; // 5 seconds
  
  async init(): Promise<void> {
    // Set up periodic cleanup
    setInterval(() => this.cleanupUnusedResources(), this.cleanupInterval);
  }
  
  private cleanupUnusedResources(): void {
    for (const [key, weakRef] of this.resources) {
      if (!weakRef.deref()) {
        // Resource has been garbage collected
        this.resources.delete(key);
      }
    }
  }
  
  addResource(key: string, resource: any): void {
    this.resources.set(key, new WeakRef(resource));
  }
  
  getResource(key: string): any | null {
    const ref = this.resources.get(key);
    return ref ? ref.deref() : null;
  }
}
```

2. **Asset Loading Optimization**:
```typescript
export class AssetLoader implements IGameService {
  private loadQueue: Map<string, Promise<void>> = new Map();
  private loadedAssets: Set<string> = new Set();
  
  async loadAsset(key: string, url: string): Promise<void> {
    if (this.loadedAssets.has(key)) return;
    
    // Prevent duplicate loads
    if (!this.loadQueue.has(key)) {
      this.loadQueue.set(key, this.doLoad(key, url));
    }
    
    return this.loadQueue.get(key);
  }
  
  private async doLoad(key: string, url: string): Promise<void> {
    try {
      // Implement progressive loading
      if (url.endsWith('.png') || url.endsWith('.jpg')) {
        await this.loadImage(key, url);
      } else if (url.endsWith('.json')) {
        await this.loadJSON(key, url);
      }
      
      this.loadedAssets.add(key);
    } finally {
      this.loadQueue.delete(key);
    }
  }
  
  private async loadImage(key: string, url: string): Promise<void> {
    // Use image loading with progress tracking
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Store in texture cache
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
```

### Mobile Optimization

1. **Device Capability Detection**:
```typescript
export class DeviceCapabilityService implements IGameService {
  private capabilities: {
    webGL: boolean;
    webGL2: boolean;
    touchScreen: boolean;
    memory: number;
    processorCores: number;
    devicePixelRatio: number;
  };
  
  async init(): Promise<void> {
    this.capabilities = {
      webGL: this.checkWebGL(),
      webGL2: this.checkWebGL2(),
      touchScreen: 'ontouchstart' in window,
      memory: this.getDeviceMemory(),
      processorCores: navigator.hardwareConcurrency || 1,
      devicePixelRatio: window.devicePixelRatio || 1
    };
    
    // Emit capabilities for other services
    ServiceRegistry.getInstance()
      .get<EventBus>('events')
      .emit('device.capabilities', this.capabilities);
  }
  
  private checkWebGL(): boolean {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  }
  
  private checkWebGL2(): boolean {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  }
  
  private getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 4; // Default to 4GB if not available
  }
  
  getQualitySettings(): GameQualitySettings {
    // Adjust quality based on device capabilities
    if (this.isLowEndDevice()) {
      return {
        resolution: 0.75,
        particleCount: 50,
        shadowQuality: 'low',
        textureQuality: 'low',
        drawDistance: 500
      };
    }
    return {
      resolution: 1,
      particleCount: 200,
      shadowQuality: 'high',
      textureQuality: 'high',
      drawDistance: 1000
    };
  }
  
  private isLowEndDevice(): boolean {
    return (
      this.capabilities.memory < 4 ||
      this.capabilities.processorCores <= 2 ||
      !this.capabilities.webGL2
    );
  }
}
```

2. **Touch Input Optimization**:
```typescript
export class TouchInputService implements IGameService {
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private readonly LONG_PRESS_THRESHOLD = 500; // ms
  private readonly SWIPE_THRESHOLD = 50; // pixels
  
  async init(): Promise<void> {
    this.addTouchListeners();
  }
  
  private addTouchListeners(): void {
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
  }
  
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return; // Only handle single touches
    
    this.touchStartTime = performance.now();
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    const touchDuration = performance.now() - this.touchStartTime;
    
    if (touchDuration >= this.LONG_PRESS_THRESHOLD) {
      this.emitLongPress(e);
    } else {
      this.emitTap(e);
    }
  }
  
  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartPos.x;
    const deltaY = touch.clientY - this.touchStartPos.y;
    
    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD || 
        Math.abs(deltaY) > this.SWIPE_THRESHOLD) {
      this.emitSwipe(deltaX, deltaY);
      e.preventDefault(); // Prevent scrolling during swipe
    }
  }
  
  private emitTap(e: TouchEvent): void {
    ServiceRegistry.getInstance()
      .get<EventBus>('events')
      .emit('input.tap', {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        timestamp: performance.now()
      });
  }
  
  private emitLongPress(e: TouchEvent): void {
    ServiceRegistry.getInstance()
      .get<EventBus>('events')
      .emit('input.longpress', {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        duration: performance.now() - this.touchStartTime
      });
  }
  
  private emitSwipe(deltaX: number, deltaY: number): void {
    ServiceRegistry.getInstance()
      .get<EventBus>('events')
      .emit('input.swipe', {
        deltaX,
        deltaY,
        direction: this.getSwipeDirection(deltaX, deltaY),
        velocity: this.calculateSwipeVelocity(deltaX, deltaY)
      });
  }
  
  private getSwipeDirection(deltaX: number, deltaY: number): string {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  }
  
  private calculateSwipeVelocity(deltaX: number, deltaY: number): number {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = performance.now() - this.touchStartTime;
    return distance / time; // pixels per millisecond
  }
  
  destroy(): void {
    window.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    window.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    window.removeEventListener('touchmove', this.handleTouchMove.bind(this));
  }
}
```

3. **Battery-Aware Service**:
```typescript
export class BatteryAwareService implements IGameService {
  private lowPowerMode: boolean = false;
  private batteryLevel: number = 1.0;
  
  async init(): Promise<void> {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      this.setupBatteryMonitoring(battery);
    }
  }
  
  private setupBatteryMonitoring(battery: any): void {
    // Monitor battery level
    battery.addEventListener('levelchange', () => {
      this.batteryLevel = battery.level;
      this.adjustPerformance();
    });
    
    // Monitor charging state
    battery.addEventListener('chargingchange', () => {
      this.adjustPerformance();
    });
  }
  
  private adjustPerformance(): void {
    const eventBus = ServiceRegistry.getInstance().get<EventBus>('events');
    
    if (this.batteryLevel < 0.2 && !this.lowPowerMode) {
      this.lowPowerMode = true;
      eventBus.emit('system.lowPowerMode', { enabled: true });
      
      // Adjust game settings for power saving
      this.applyPowerSavingMode();
    } else if (this.batteryLevel > 0.3 && this.lowPowerMode) {
      this.lowPowerMode = false;
      eventBus.emit('system.lowPowerMode', { enabled: false });
      
      // Restore normal settings
      this.restoreNormalMode();
    }
  }
  
  private applyPowerSavingMode(): void {
    const perfService = ServiceRegistry.getInstance()
      .get<PerformanceService>('performance');
      
    perfService.setQualitySettings({
      fps: 30,
      resolution: 0.75,
      particleCount: 25,
      shadowQuality: 'off',
      postProcessing: false
    });
  }
  
  private restoreNormalMode(): void {
    const perfService = ServiceRegistry.getInstance()
      .get<PerformanceService>('performance');
      
    perfService.setQualitySettings({
      fps: 60,
      resolution: 1,
      particleCount: 100,
      shadowQuality: 'medium',
      postProcessing: true
    });
  }
}
```