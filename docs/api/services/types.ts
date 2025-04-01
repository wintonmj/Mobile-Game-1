import * as Phaser from 'phaser';

/**
 * Core service interface for all game services
 */
export interface IGameService {
  init(): Promise<void>;
  destroy(): void;
}

/**
 * Service interface for components that need regular updates
 */
export interface IUpdatableService extends IGameService {
  update(deltaTime: number): void;
}

/**
 * Service interface for components with dependencies
 */
export interface IDependentService extends IGameService {
  readonly dependencies: string[];
}

/**
 * Service interface for components that can be paused
 */
export interface IPausableService extends IGameService {
  pause(): void;
  resume(): void;
  readonly isPaused: boolean;
}

/**
 * Event bus system for game-wide communication
 */
export interface IEventBus extends IGameService {
  /**
   * Subscribe to an event
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   * @returns Function to call to unsubscribe
   */
  on<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): () => void;
  
  /**
   * Unsubscribe from an event
   * @param eventName Name of the event to unsubscribe from
   * @param callback Function to remove from listeners
   */
  off<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): void;
  
  /**
   * Emit an event to all subscribers
   * @param eventName Name of the event to emit
   * @param data Data to pass to event handlers
   */
  emit<K extends keyof GameEventMap>(
    eventName: K, 
    data: GameEventMap[K]
  ): void;
  
  /**
   * Subscribe to an event and automatically unsubscribe after it fires once
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   * @returns Function to call to unsubscribe before the event fires
   */
  once<K extends keyof GameEventMap>(
    eventName: K, 
    callback: (data: GameEventMap[K]) => void
  ): () => void;
  
  /**
   * Throttle event emissions to prevent performance issues
   * @param eventName Name of the event to throttle
   * @param milliseconds Maximum frequency of event emission in milliseconds
   */
  throttle(eventName: keyof GameEventMap, milliseconds: number): void;
  
  /**
   * Create a scoped event bus that prefixes all events with a namespace
   * @param scope Namespace to prefix events with
   * @returns Scoped event bus instance
   */
  createScope(scope: string): IScopedEventBus;
}

/**
 * Scoped event bus for namespace-specific events
 */
export interface IScopedEventBus extends Omit<IEventBus, 'createScope'> {
  /**
   * The scope/namespace of this event bus
   */
  readonly scope: string;
}

export interface IAssetService extends IGameService {
  loadAsset(key: string, type: AssetType, url: string): Promise<void>;
  getAsset<T>(key: string): T;
  unloadAsset(key: string): void;
  isLoaded(key: string): boolean;
  getLoadProgress(): number;
}

export type AssetType = 'image' | 'audio' | 'json' | 'spritesheet' | 'atlas';

// Error Hierarchy
export class ServiceError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ServiceError';
    this.cause = cause;
  }
  cause?: Error;
}

export class ServiceInitializationError extends ServiceError {
  constructor(serviceName: string, cause?: Error) {
    super(`Failed to initialize service: ${serviceName}`, cause);
    this.name = 'ServiceInitializationError';
    this.serviceName = serviceName;
  }
  serviceName: string;
}

export class ServiceRegistrationError extends ServiceError {
  constructor(serviceName: string, reason: string) {
    super(`Failed to register service ${serviceName}: ${reason}`);
    this.name = 'ServiceRegistrationError';
    this.serviceName = serviceName;
    this.reason = reason;
  }
  serviceName: string;
  reason: string;
}

export class ServiceNotFoundError extends ServiceError {
  constructor(serviceName: string) {
    super(`Service not found: ${serviceName}`);
    this.name = 'ServiceNotFoundError';
    this.serviceName = serviceName;
  }
  serviceName: string;
}

export class ServiceDependencyError extends ServiceError {
  constructor(serviceName: string, dependencyName: string, cause?: Error) {
    super(`Dependency error in service ${serviceName}: ${dependencyName}`, cause);
    this.name = 'ServiceDependencyError';
    this.serviceName = serviceName;
    this.dependencyName = dependencyName;
  }
  serviceName: string;
  dependencyName: string;
}

export class ServiceOperationError extends ServiceError {
  constructor(serviceName: string, operation: string, cause?: Error) {
    super(`Operation failed in service ${serviceName}: ${operation}`, cause);
    this.name = 'ServiceOperationError';
    this.serviceName = serviceName;
    this.operation = operation;
  }
  serviceName: string;
  operation: string;
}

export class ServiceStateError extends ServiceError {
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

export class ServiceThreadError extends ServiceError {
  constructor(serviceName: string, operation: string, cause?: Error) {
    super(`Thread safety violation in service ${serviceName} during ${operation}`, cause);
    this.name = 'ServiceThreadError';
    this.serviceName = serviceName;
    this.operation = operation;
  }
  serviceName: string;
  operation: string;
}

export class ConfigValidationError extends ServiceError {
  constructor(key: string, value: unknown, reason: string) {
    super(`Configuration validation failed for key "${key}": ${reason}`);
    this.name = 'ConfigValidationError';
    this.key = key;
    this.value = value;
    this.reason = reason;
  }
  key: string;
  value: unknown;
  reason: string;
}

// Update GameEventMap with all documented events
export interface GameEventMap {
  // System events
  'system.initialized': { timestamp: number };
  'system.error': { error: Error; context: string };
  
  // Game state events
  'game.stateChanged': { 
    previousState: GameState; 
    currentState: GameState 
  };
  'game.paused': { reason: string };
  'game.resumed': { timestamp: number };
  
  // Player events
  'player.healthChanged': { 
    previousHealth: number; 
    currentHealth: number; 
    cause: string 
  };
  'player.died': { 
    cause: string; 
    position: Vector2 
  };
  
  // Scene events
  'scene.loading': { 
    sceneKey: string; 
    params?: Record<string, unknown> 
  };
  'scene.loaded': { 
    sceneKey: string; 
    loadTime: number 
  };
  'scene.transition.started': { from: string; to: string; timestamp: number };
  'scene.transition.completed': { scene: string; timestamp: number };
  'scene.started': { scene: string; timestamp: number };
  
  // Storage events
  'storage.quota': { type: string; message: string; details: { dataSize: number; available: number } };
  'storage.saved': { key: string; timestamp: number };
  'storage.loaded': { key: string; timestamp: number };
  'storage.error': { operation: string; error: Error };
  
  // Config events
  'config.loaded': { source: string };
  'config.changed': { key: string; newValue: unknown; oldValue: unknown };
  'config.validation': { key: string; value: unknown; reason: string };
  
  // Asset events
  'asset.loading': { key: string; type: string; progress: number };
  'asset.loaded': { key: string; type: string; duration: number };
  'asset.error': { type: string; asset: string; error: Error };
  'asset.progress': { type: string; loaded: number; total: number };
  'asset.complete': { type: string; duration: number };
  
  // Input events
  'input.enabled': { timestamp: number };
  'input.disabled': { timestamp: number };
  'input.keyDown': { key: string; timestamp: number };
  'input.keyUp': { key: string; timestamp: number };
  
  // Service lifecycle events
  'service.initialized': { name: string; timestamp: number };
  'service.destroyed': { name: string; timestamp: number };
}

// Service Registry Types
export interface IServiceRegistry {
  register(name: string, service: IGameService): void;
  get<T extends IGameService>(name: string): T;
  initializeAll(): Promise<void>;
  destroyAll(): void;
  has(name: string): boolean;
  getDependencyGraph(): Map<string, string[]>;
  getInitializationOrder(): string[];
}

/**
 * 2D Vector interface with common operations
 */
export interface Vector2 {
  x: number;
  y: number;
  
  /**
   * Add another vector to this one
   */
  add(other: Vector2): Vector2;
  
  /**
   * Subtract another vector from this one
   */
  subtract(other: Vector2): Vector2;
  
  /**
   * Scale the vector by a factor
   */
  scale(factor: number): Vector2;
  
  /**
   * Get a normalized version of this vector
   */
  normalize(): Vector2;
  
  /**
   * Calculate the magnitude (length) of this vector
   */
  magnitude(): number;
  
  /**
   * Calculate the dot product with another vector
   */
  dot(other: Vector2): number;
  
  /**
   * Create a copy of this vector
   */
  clone(): Vector2;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'loading' | 'gameOver'; 

export interface IInputService extends IUpdatableService {
  readonly isEnabled: boolean;
  enable(): void;
  disable(): void;
  // Add input-specific methods
}

export interface IConfigService extends IGameService {
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  load(source: string | Record<string, unknown>): Promise<void>;
  getEnvConfig(env: string): Record<string, unknown>;
  validate(schema: ConfigSchema): void;
}

export interface IStorageService extends IGameService {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string, defaultValue?: T): Promise<T>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface ISceneService extends IDependentService {
  registerScenes(sceneMap: Record<string, typeof Phaser.Scene>): void;
  startScene(key: string, data?: SceneData, options?: SceneStartOptions): void;
  transitionTo(from: string, to: string, data?: SceneData, transition?: TransitionConfig): void;
  getCurrentScene(): string;
  pauseScene(key: string): void;
  resumeScene(key: string): void;
}

export type ServiceState = 
  | 'uninitialized' 
  | 'initializing' 
  | 'ready' 
  | 'error' 
  | 'destroyed'
  | 'paused'  // For pausable services
  | 'resuming' // For services that need async resume
  | 'destroying'; // For cleanup state

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: unknown;
    validate?: (value: unknown) => boolean;
  };
}

export interface SceneStartOptions {
  additive?: boolean;
  hidden?: boolean;
}

export interface TransitionConfig {
  duration: number;
  effect: 'fade' | 'slide' | 'zoom' | 'custom';
  shader?: any;
  direction?: 'left' | 'right' | 'up' | 'down';
  color?: number;
}

export type SceneData = Record<string, unknown>;

export type TransitionEffect = 'fade' | 'slide' | 'zoom' | 'custom';
export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

export class SceneError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'SceneError';
  }
}

export class SceneNotFoundError extends SceneError {
  constructor(sceneKey: string) {
    super(`Scene not found: ${sceneKey}`);
    this.name = 'SceneNotFoundError';
    this.sceneKey = sceneKey;
  }
  sceneKey: string;
}

export class SceneLoadError extends SceneError {
  constructor(sceneKey: string, cause?: Error) {
    super(`Failed to load scene: ${sceneKey}`);
    this.name = 'SceneLoadError';
    this.cause = cause;
    this.sceneKey = sceneKey;
  }
  cause?: Error;
  sceneKey: string;
}

/**
 * Type guard to check if a service is updatable
 */
export function isUpdatableService(service: IGameService): service is IUpdatableService {
  return 'update' in service;
}

/**
 * Type guard to check if a service has dependencies
 */
export function isDependentService(service: IGameService): service is IDependentService {
  return 'dependencies' in service;
}

/**
 * Type guard to check if a service is pausable
 */
export function isPausableService(service: IGameService): service is IPausableService {
  return 'pause' in service && 'resume' in service && 'isPaused' in service;
}

/**
 * Configuration validation schema type
 */
export interface ConfigValidation<T> {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: T;
  validate?: (value: T) => boolean;
  children?: Record<string, ConfigValidation<any>>; // For nested objects
}

/**
 * Asset loading configuration
 */
export interface AssetLoadConfig {
  key: string;
  type: AssetType;
  url: string;
  options?: {
    crossOrigin?: boolean | string;
    frameWidth?: number;
    frameHeight?: number;
    startFrame?: number;
    endFrame?: number;
    spacing?: number;
    margin?: number;
  };
}

export interface EventThrottleConfig {
  lastFired: number;
  interval: number;
}

export interface EventListenerConfig<T> {
  callback: (data: T) => void;
  once: boolean;
  scope?: string;
}

export class EventBusError extends ServiceError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'EventBusError';
    this.cause = cause;
  }
}

export class EventThrottleError extends EventBusError {
  constructor(eventName: string, interval: number) {
    super(`Event ${eventName} is throttled (${interval}ms)`);
    this.name = 'EventThrottleError';
    this.eventName = eventName;
    this.interval = interval;
  }
  eventName: string;
  interval: number;
}

export interface EventDataValidator<T> {
  validate(data: T): boolean;
  getErrors(): string[];
}

export interface EventValidationConfig {
  enabled: boolean;
  validators: Map<keyof GameEventMap, EventDataValidator<any>>;
}

// State serialization and migration
export interface IStateMigration<T> {
  version: number;
  migrate: (oldState: unknown) => T;
}

// Service priority and health
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'error';
  lastChecked: Date;
  metrics: Record<string, number>;
}

// Asset versioning
export interface AssetVersion {
  version: string;
  compatibility: string[];
  dependencies: string[];
}

// Event batching
export interface EventBatch<T extends keyof GameEventMap> {
  eventName: T;
  events: GameEventMap[T][];
  timestamp: number;
}

// Debug utilities
export interface DebugConfig {
  enabled: boolean;
  verbosity: 'error' | 'warn' | 'info' | 'debug';
  features: Set<string>;
}

// Performance monitoring
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  memoryUsage: {
    total: number;
    used: number;
    services: Record<string, number>;
  };
}

// For debugging and development tools
export interface EventDebugInfo {
  timestamp: number;
  source: string;
  latency?: number;
  stackTrace?: string;
}

// For handling high-frequency events
export interface EventBatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  eventTypes: (keyof GameEventMap)[];
}

// For scene loading progress
export interface SceneLoadProgress {
  sceneKey: string;
  progress: number;
  assetsLoaded: number;
  totalAssets: number;
  errors?: string[];
}

// For scene-specific service scoping
export interface SceneServiceScope {
  sceneKey: string;
  services: Set<string>;
  state: 'active' | 'paused' | 'destroyed';
}

// For fixed/variable timestep handling
export interface GameLoopConfig {
  fixedTimeStep: number;
  maxTimeStep: number;
  maxUpdatesPerFrame: number;
}

// For asset optimization and loading strategies
export interface AssetLoadStrategy {
  priority: 'high' | 'medium' | 'low';
  caching: boolean;
  preload: boolean;
  compression?: {
    type: 'none' | 'lossy' | 'lossless';
    quality?: number;
  };
}

// For asset streaming and progressive loading
export interface AssetStreamConfig {
  chunkSize: number;
  concurrentLoads: number;
  priorityQueue: boolean;
}

// For development tools and debugging
export interface DebugTools {
  enabled: boolean;
  features: {
    fpsCounter: boolean;
    serviceInspector: boolean;
    eventMonitor: boolean;
    memoryProfiler: boolean;
  };
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  breakpoints: Set<string>;
}

// For development environment configuration
export interface DevConfig {
  hotReload: boolean;
  debugTools: DebugTools;
  mockServices?: string[];
  slowMotionFactor?: number;
}

// Missing critical physics integration types
export interface PhysicsConfig {
  system: 'arcade' | 'matter' | 'custom';
  gravity: Vector2;
  debug: boolean;
  fixedTimeStep: number;
  maxSubSteps: number;
}

export interface CollisionGroup {
  id: number;
  name: string;
  mask: number[];
  category: number;
}

export interface CollisionEvent {
  bodyA: any; // Need proper Phaser physics body type
  bodyB: any; // Need proper Phaser physics body type
  gameObjects: [any, any]; // Need proper Phaser game object type
  position: Vector2;
}

export interface ResourceLimits {
  maxConcurrentAssets: number;
  maxTextureSize: number;
  maxAudioInstances: number;
  targetMemoryUsage: number;
}

export interface ResourceUsage {
  textures: {
    count: number;
    memoryUsed: number;
    largest: string;
  };
  audio: {
    active: number;
    cached: number;
    memoryUsed: number;
  };
  scenes: {
    active: number;
    cached: number;
    totalMemory: number;
  };
}

export type InputMethod = 'keyboard' | 'mouse' | 'touch' | 'gamepad';

export interface InputConfig {
  enabled: InputMethod[];
  multitouch: boolean;
  preventDefaultActions: boolean;
  globalCapture: boolean;
}

export interface InputBinding {
  action: string;
  methods: {
    [K in InputMethod]?: string[];
  };
  priority: number;
  context?: string;
}

export interface ErrorRecoveryConfig {
  maxRetries: number;
  backoffMs: number;
  criticalServices: string[];
  recoveryStrategies: {
    [key: string]: 'restart' | 'reload' | 'fallback' | 'ignore';
  };
}

export interface StateCheckpoint {
  timestamp: number;
  sceneKey: string;
  criticalState: Record<string, unknown>;
  services: {
    [key: string]: {
      state: string;
      lastKnownGood: unknown;
    };
  };
}

export interface BrowserCapabilities {
  webgl: 1 | 2 | false;
  audio: {
    webAudio: boolean;
    formats: string[];
    maxChannels: number;
  };
  storage: {
    localStorage: boolean;
    indexedDB: boolean;
    quota: number;
  };
  performance: {
    devicePixelRatio: number;
    maxTextureSize: number;
    hardwareConcurrency: number;
  };
}

export interface CompatibilityConfig {
  minimumRequirements: Partial<BrowserCapabilities>;
  fallbacks: {
    [K in keyof BrowserCapabilities]?: any;
  };
  warnings: string[];
}

export interface ServiceInitConfig {
  timeout: number;
  retries: number;
  dependencies: {
    [serviceName: string]: {
      required: boolean;
      timeout?: number;
      fallback?: () => IGameService;
    };
  };
  order: {
    phase: 'early' | 'normal' | 'late';
    priority: number;
  };
}

export interface InitializationCheckpoint {
  phase: string;
  completedServices: string[];
  failedServices: Array<{
    name: string;
    error: Error;
    attempts: number;
  }>;
  timestamp: number;
}

/**
 * Configuration for progressive asset loading
 */
export interface ProgressiveLoadConfig {
  /**
   * Priority levels for different asset types
   */
  priorities: {
    [K in AssetType]: 'critical' | 'high' | 'medium' | 'low';
  };
  
  /**
   * Chunk size for progressive loading in bytes
   */
  chunkSize: number;
  
  /**
   * Maximum concurrent asset loads
   */
  concurrentLoads: number;
  
  /**
   * Minimum game state required before starting non-critical loads
   */
  minimumGameState: {
    fps: number;
    memoryUsage: number;
    loadProgress: number;
  };
}

/**
 * Asset compression pipeline configuration
 */
export interface CompressionPipelineConfig {
  /**
   * Compression strategies for different asset types
   */
  strategies: {
    [K in AssetType]: {
      algorithm: 'none' | 'gzip' | 'brotli' | 'custom';
      level: number;
      dictionary?: Uint8Array;
    };
  };
  
  /**
   * Custom compression handlers
   */
  customHandlers?: {
    [key: string]: (data: ArrayBuffer) => Promise<ArrayBuffer>;
  };
  
  /**
   * Device-specific compression settings
   */
  deviceProfiles: {
    [key: string]: {
      preferredAlgorithm: string;
      targetSize: number;
      quality: number;
    };
  };
}

/**
 * Enhanced asset service interface with streaming and compression support
 */
export interface IEnhancedAssetService extends IAssetService {
  /**
   * Configure progressive loading strategy
   */
  configureProgressiveLoading(config: ProgressiveLoadConfig): void;
  
  /**
   * Configure compression pipeline
   */
  configureCompressionPipeline(config: CompressionPipelineConfig): void;
  
  /**
   * Start streaming assets based on priority
   */
  startStreaming(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<void>;
  
  /**
   * Pause asset streaming
   */
  pauseStreaming(): void;
  
  /**
   * Resume asset streaming
   */
  resumeStreaming(): void;
  
  /**
   * Get streaming status
   */
  getStreamingStatus(): {
    active: boolean;
    currentPriority: string;
    queuedAssets: number;
    loadedAssets: number;
    failedAssets: number;
    bandwidth: number;
  };
}