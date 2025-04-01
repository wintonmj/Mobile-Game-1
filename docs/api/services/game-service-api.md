# Game Service Interfaces API Documentation

## Overview
This document provides a comprehensive reference for the core game service interfaces that form the foundation of the game's service architecture. All game services must implement these interfaces to ensure consistent behavior and integration with the ServiceRegistry.

## Core Service Interfaces

### IGameService

The base interface that all game services must implement.

```typescript
/**
 * Base interface for all game services
 */
interface IGameService {
  /**
   * Initialize the service asynchronously
   * @returns Promise that resolves when initialization is complete
   * @throws ServiceInitializationError if initialization fails
   */
  init(): Promise<void>;
  
  /**
   * Clean up resources when service is no longer needed
   * Must be idempotent (can be called multiple times without side effects)
   */
  destroy(): void;
}
```

### IUpdatableService

Interface for services that need to be updated each game loop.

```typescript
/**
 * Interface for services that need to be updated each game loop
 * @extends IGameService
 */
interface IUpdatableService extends IGameService {
  /**
   * Update method called each game loop
   * @param deltaTime Time elapsed since the last update in seconds
   */
  update(deltaTime: number): void;
}
```

### IDependentService

Interface for services with explicit dependencies on other services.

```typescript
/**
 * Interface for services with explicit dependencies
 * @extends IGameService
 */
interface IDependentService extends IGameService {
  /**
   * List of service names this service depends on
   * Used for dependency resolution during initialization
   */
  readonly dependencies: string[];
}
```

### IPausableService

Interface for services that support being paused and resumed.

```typescript
/**
 * Interface for services that need to be paused/resumed
 * @extends IGameService
 */
interface IPausableService extends IGameService {
  /**
   * Pause the service operations
   * When paused, the service should minimize resource usage
   */
  pause(): void;
  
  /**
   * Resume the service operations
   */
  resume(): void;
  
  /**
   * Whether the service is currently paused
   */
  readonly isPaused: boolean;
}
```

## Interface Hierarchy

The service interfaces follow an inheritance hierarchy that allows for specialized service types while maintaining a consistent base interface:

```
IGameService (base interface)
├── IUpdatableService
├── IDependentService
└── IPausableService
```

## Implementation Requirements

1. **Singleton Pattern**: Services should implement the singleton pattern for global access
2. **Asynchronous Initialization**: Services must support asynchronous initialization
3. **Resource Management**: Services must properly clean up resources during destruction
4. **Type Safety**: All services must properly implement TypeScript interfaces
5. **Error Handling**: Services must provide consistent error management
6. **Registration**: All services must register with the ServiceRegistry

## Error Handling

Services should implement consistent error handling using custom error types to provide clear information about failures. The following error hierarchy is defined for game services:

/**
 * Base error class for all service-related errors
 */
class ServiceError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ServiceError';
    this.cause = cause;
  }
  cause?: Error;
}

/**
 * Error thrown when service initialization fails
 */
class ServiceInitializationError extends ServiceError {
  constructor(serviceName: string, cause?: Error) {
    super(`Failed to initialize service: ${serviceName}`, cause);
    this.name = 'ServiceInitializationError';
    this.serviceName = serviceName;
  }
  serviceName: string;
}

/**
 * Error thrown when service registration fails
 */
class ServiceRegistrationError extends ServiceError {
  constructor(serviceName: string, reason: string) {
    super(`Failed to register service ${serviceName}: ${reason}`);
    this.name = 'ServiceRegistrationError';
    this.serviceName = serviceName;
    this.reason = reason;
  }
  serviceName: string;
  reason: string;
}

/**
 * Error thrown when a requested service is not found in the registry
 */
class ServiceNotFoundError extends ServiceError {
  constructor(serviceName: string) {
    super(`Service not found: ${serviceName}`);
    this.name = 'ServiceNotFoundError';
    this.serviceName = serviceName;
  }
  serviceName: string;
}

/**
 * Error thrown when there is an issue with service dependencies
 */
class ServiceDependencyError extends ServiceError {
  constructor(serviceName: string, dependencyName: string, cause?: Error) {
    super(`Dependency error in service ${serviceName}: ${dependencyName}`, cause);
    this.name = 'ServiceDependencyError';
    this.serviceName = serviceName;
    this.dependencyName = dependencyName;
  }
  serviceName: string;
  dependencyName: string;
}

/**
 * Error thrown when a service operation fails
 */
class ServiceOperationError extends ServiceError {
  constructor(serviceName: string, operation: string, cause?: Error) {
    super(`Operation failed in service ${serviceName}: ${operation}`, cause);
    this.name = 'ServiceOperationError';
    this.serviceName = serviceName;
    this.operation = operation;
  }
  serviceName: string;
  operation: string;
}

/**
 * Error thrown when a service is in an invalid state for an operation
 */
class ServiceStateError extends ServiceError {
  constructor(serviceName: string, expectedState: string, actualState: string) {
    super(`Invalid service state in ${serviceName}: expected ${expectedState}, got ${actualState}`);
    this.name = 'ServiceStateError';
    this.serviceName = serviceName;
    this.expectedState = expectedState;
    this.actualState = actualState;
  }
  serviceName: string;
  expectedState: string;
  actualState: string;
}

/**
 * Error thrown when there is a thread safety violation in a service
 */
class ServiceThreadError extends ServiceError {
  constructor(serviceName: string, operation: string, cause?: Error) {
    super(`Thread safety violation in service ${serviceName} during ${operation}`, cause);
    this.name = 'ServiceThreadError';
    this.serviceName = serviceName;
    this.operation = operation;
  }
  serviceName: string;
  operation: string;
}

## Basic Service Implementation Template

```typescript
/**
 * Example implementation of a game service
 * @implements IGameService
 */
export class ExampleService implements IGameService {
  private static instance: ExampleService;
  private initialized: boolean = false;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialization logic goes here
      
      this.initialized = true;
      console.log('ExampleService initialized successfully');
    } catch (error) {
      throw new ServiceInitializationError(
        'example', 
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
  
  /**
   * Example service method
   * @throws ServiceNotInitializedError if service is not initialized
   */
  performAction(): void {
    if (!this.initialized) {
      throw new ServiceNotInitializedError('example', 'performAction');
    }
    
    // Implementation goes here
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }
    
    // Cleanup logic goes here
    
    this.initialized = false;
    console.log('ExampleService destroyed');
  }
}
```

## Implementing an Updatable Service

```typescript
/**
 * Example implementation of an updatable service
 * @implements IUpdatableService
 */
export class AnimationService implements IUpdatableService {
  private static instance: AnimationService;
  private initialized: boolean = false;
  private animations: Map<string, Animation> = new Map();
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialization logic
      
      this.initialized = true;
      console.log('AnimationService initialized successfully');
    } catch (error) {
      throw new ServiceInitializationError(
        'animation', 
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
  
  /**
   * Update animations
   * @param deltaTime Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    if (!this.initialized) {
      return;
    }
    
    // Update all animations
    this.animations.forEach(animation => {
      animation.update(deltaTime);
    });
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }
    
    // Cleanup logic
    this.animations.clear();
    
    this.initialized = false;
    console.log('AnimationService destroyed');
  }
}
```

## Implementing a Dependent Service

```typescript
/**
 * Example implementation of a dependent service
 * @implements IDependentService
 */
export class PlayerService implements IDependentService {
  private static instance: PlayerService;
  private initialized: boolean = false;
  private inputService!: IInputService;
  private audioService!: IAudioService;
  
  /**
   * List of service dependencies
   */
  public readonly dependencies: string[] = ['input', 'audio'];
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Initialize the service with dependencies
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Get required services
      const registry = ServiceRegistry.getInstance();
      this.inputService = registry.get<IInputService>('input');
      this.audioService = registry.get<IAudioService>('audio');
      
      // Initialize with dependencies
      // ...
      
      this.initialized = true;
      console.log('PlayerService initialized successfully');
    } catch (error) {
      throw new ServiceInitializationError(
        'player', 
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }
    
    // Cleanup logic
    
    this.initialized = false;
    console.log('PlayerService destroyed');
  }
}
```

## Implementing a Pausable Service

```typescript
/**
 * Example implementation of a pausable service
 * @implements IPausableService
 */
export class PhysicsService implements IPausableService {
  private static instance: PhysicsService;
  private initialized: boolean = false;
  private _isPaused: boolean = false;
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PhysicsService {
    if (!PhysicsService.instance) {
      PhysicsService.instance = new PhysicsService();
    }
    return PhysicsService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize physics system
      
      this.initialized = true;
      console.log('PhysicsService initialized successfully');
    } catch (error) {
      throw new ServiceInitializationError(
        'physics', 
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
  
  /**
   * Pause physics simulation
   */
  pause(): void {
    if (this._isPaused) {
      return; // Already paused
    }
    
    // Pause physics simulation
    
    this._isPaused = true;
    console.log('PhysicsService paused');
  }
  
  /**
   * Resume physics simulation
   */
  resume(): void {
    if (!this._isPaused) {
      return; // Already running
    }
    
    // Resume physics simulation
    
    this._isPaused = false;
    console.log('PhysicsService resumed');
  }
  
  /**
   * Get paused state
   */
  get isPaused(): boolean {
    return this._isPaused;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }
    
    // Cleanup physics resources
    
    this.initialized = false;
    console.log('PhysicsService destroyed');
  }
}
```

## Using Services in Game Code

```typescript
// Example of using services in a game component
export class Player {
  private inputService: IInputService;
  private audioService: IAudioService;
  private position = { x: 0, y: 0 };
  
  constructor() {
    // Get required services from registry
    const registry = ServiceRegistry.getInstance();
    this.inputService = registry.get<IInputService>('input');
    this.audioService = registry.get<IAudioService>('audio');
    
    // Set up input handling
    this.inputService.addActionListener('move', this.handleMove.bind(this));
    this.inputService.addActionListener('jump', this.handleJump.bind(this));
  }
  
  private handleMove(value: number): void {
    this.position.x += value;
    this.audioService.playSound('footstep', { volume: Math.abs(value) });
  }
  
  private handleJump(): void {
    this.audioService.playSound('jump');
    // Jump logic...
  }
  
  public destroy(): void {
    // Clean up event listeners
    this.inputService.removeActionListener('move', this.handleMove.bind(this));
    this.inputService.removeActionListener('jump', this.handleJump.bind(this));
  }
}
```

## Best Practices

1. **Lazy Initialization**: Initialize resources only when needed
2. **Proper Cleanup**: Always clean up resources in the destroy method
3. **Error Handling**: Use appropriate error types for different failure scenarios
4. **Dependency Management**: Use the IDependentService interface for services with dependencies
5. **State Management**: Keep service state isolated and well-encapsulated
6. **Consistent API**: Design service APIs that are consistent and intuitive
7. **Documentation**: Document service methods and parameters clearly
8. **Testing**: Design services with testability in mind
9. **Performance**: Consider performance implications, especially for services that run every frame
10. **Resource Management**: Be mindful of memory usage and resource allocation 

## Enhanced Asset Service

The Enhanced Asset Service extends the base Asset Service with advanced features for progressive loading, streaming, and compression.

### Progressive Loading

The service supports progressive loading of assets based on priority levels:

```typescript
// Configure progressive loading
const progressiveConfig: ProgressiveLoadConfig = {
  priorities: {
    image: 'high',
    audio: 'medium',
    json: 'critical',
    spritesheet: 'high',
    atlas: 'medium'
  },
  chunkSize: 1024 * 1024, // 1MB chunks
  concurrentLoads: 3,
  minimumGameState: {
    fps: 30,
    memoryUsage: 0.8, // 80% available memory
    loadProgress: 0.5 // 50% critical assets loaded
  }
};

assetService.configureProgressiveLoading(progressiveConfig);
```

### Asset Compression Pipeline

The compression pipeline optimizes asset delivery based on device capabilities:

```typescript
// Configure compression pipeline
const compressionConfig: CompressionPipelineConfig = {
  strategies: {
    image: {
      algorithm: 'custom',
      level: 7,
      dictionary: new Uint8Array([/* optimized dictionary */])
    },
    audio: {
      algorithm: 'gzip',
      level: 6
    },
    // ... other asset types
  },
  deviceProfiles: {
    'mobile-low': {
      preferredAlgorithm: 'gzip',
      targetSize: 1024 * 1024, // 1MB target
      quality: 0.7
    },
    'desktop-high': {
      preferredAlgorithm: 'brotli',
      targetSize: 5 * 1024 * 1024, // 5MB target
      quality: 0.9
    }
  }
};

assetService.configureCompressionPipeline(compressionConfig);
```

### Asset Streaming

Control asset streaming based on priority levels:

```typescript
// Start streaming high-priority assets
await assetService.startStreaming('high');

// Monitor streaming status
const status = assetService.getStreamingStatus();
console.log(`Loaded ${status.loadedAssets} of ${status.queuedAssets} assets`);
console.log(`Current bandwidth: ${status.bandwidth} bytes/sec`);

// Pause/resume streaming as needed
assetService.pauseStreaming();
assetService.resumeStreaming();
```

### Best Practices

1. **Priority Management**
   - Assign 'critical' priority only to essential startup assets
   - Use 'high' for immediately visible assets
   - Use 'medium' for assets needed soon
   - Use 'low' for optional or late-game assets

2. **Compression Strategy**
   - Configure device profiles based on target platforms
   - Use custom compression for specialized asset types
   - Monitor compression ratios and loading times
   - Adjust quality settings based on device capabilities

3. **Memory Management**
   - Monitor memory usage during streaming
   - Implement unloading strategies for unused assets
   - Use the minimum game state settings to prevent overload
   - Cache frequently used assets appropriately

4. **Error Handling**
   - Implement fallback strategies for failed loads
   - Provide meaningful error messages
   - Consider retry strategies for different error types
   - Log compression and streaming metrics 