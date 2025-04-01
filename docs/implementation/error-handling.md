# Error Handling Implementation Guide

## Overview
This document outlines the implementation details for error handling in our game, covering service-level error management, game loop error recovery, debugging utilities, and state recovery procedures. This implementation aligns with the error handling requirements defined in [Sprint 1 Implementation Plan](../architecture/decisions/sprint1-implementation-plan.md) and follows the troubleshooting procedures in [Troubleshooting Guide](../maintenance/troubleshooting.md).

## Error Handling Patterns

### Service-Level Error Handling
```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly errorCode: string,
    public readonly severity: 'warning' | 'error' | 'critical'
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

class ServiceErrorHandler {
  private static instance: ServiceErrorHandler;
  private errorListeners: Set<(error: ServiceError) => void>;
  
  private constructor() {
    this.errorListeners = new Set();
  }
  
  public static getInstance(): ServiceErrorHandler {
    if (!ServiceErrorHandler.instance) {
      ServiceErrorHandler.instance = new ServiceErrorHandler();
    }
    return ServiceErrorHandler.instance;
  }
  
  public handleError(error: ServiceError): void {
    this.notifyListeners(error);
    this.logError(error);
    
    if (error.severity === 'critical') {
      this.handleCriticalError(error);
    }
  }
  
  private handleCriticalError(error: ServiceError): void {
    // Attempt service recovery
    this.attemptServiceRecovery(error.serviceName);
    
    // If recovery fails, gracefully degrade
    this.implementGracefulDegradation(error.serviceName);
  }
}
```

### Game Loop Error Recovery
```typescript
class GameLoopErrorHandler {
  private readonly maxRetries: number = 3;
  private retryCount: number = 0;
  
  handleUpdateError(error: Error): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.attemptRecovery();
    } else {
      this.pauseGameLoop();
      this.notifyUser('Game update error. Please reload the game.');
    }
  }
  
  private attemptRecovery(): void {
    try {
      // Reset game state to last known good state
      this.resetToLastGoodState();
      // Resume game loop
      this.resumeGameLoop();
      this.retryCount = 0;
    } catch (error) {
      this.handleUpdateError(error);
    }
  }
}
```

### Asset Loading Error Management
```typescript
class AssetLoadingErrorHandler {
  private readonly retryDelays: number[] = [1000, 2000, 5000]; // Increasing delays in ms
  
  async handleLoadError(asset: Asset, error: Error): Promise<void> {
    for (let i = 0; i < this.retryDelays.length; i++) {
      try {
        await this.retryLoad(asset, this.retryDelays[i]);
        return; // Success
      } catch (retryError) {
        if (i === this.retryDelays.length - 1) {
          this.handleFinalFailure(asset, retryError);
        }
      }
    }
  }
  
  private async retryLoad(asset: Asset, delay: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return asset.load();
  }
  
  private handleFinalFailure(asset: Asset, error: Error): void {
    // Load fallback asset if available
    if (asset.hasFallback) {
      this.loadFallbackAsset(asset);
    } else {
      this.notifyAssetLoadFailure(asset, error);
    }
  }
}
```

### Network Error Handling
```typescript
class NetworkErrorHandler {
  private static readonly OFFLINE_MODE = 'offline';
  private currentMode: string = 'online';
  
  handleNetworkError(error: Error): void {
    if (this.isOfflineError(error)) {
      this.switchToOfflineMode();
    } else {
      this.handleGenericNetworkError(error);
    }
  }
  
  private switchToOfflineMode(): void {
    this.currentMode = NetworkErrorHandler.OFFLINE_MODE;
    this.enableOfflineFeatures();
    this.startReconnectionAttempts();
  }
  
  private async startReconnectionAttempts(): Promise<void> {
    while (this.currentMode === NetworkErrorHandler.OFFLINE_MODE) {
      if (await this.checkConnection()) {
        this.switchToOnlineMode();
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

### State Corruption Recovery
```typescript
class StateRecoveryManager {
  private readonly stateHistory: GameState[] = [];
  private readonly maxHistoryLength: number = 10;
  
  addStateCheckpoint(state: GameState): void {
    this.stateHistory.push(state);
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }
  }
  
  recoverFromCorruption(): GameState | null {
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      if (this.validateState(this.stateHistory[i])) {
        return this.stateHistory[i];
      }
    }
    return null; // No valid state found
  }
}
```

## Service Error Management

### Error Propagation Patterns
```typescript
class ErrorPropagator {
  private errorChain: Error[] = [];
  
  addError(error: Error): void {
    this.errorChain.push(error);
    this.processErrorChain();
  }
  
  private processErrorChain(): void {
    // Analyze error chain for patterns
    const pattern = this.detectErrorPattern(this.errorChain);
    if (pattern) {
      this.handleErrorPattern(pattern);
    }
  }
}
```

### Error Logging Strategies
```typescript
class ErrorLogger {
  private static instance: ErrorLogger;
  private logBuffer: ErrorLog[] = [];
  
  log(error: Error, context: ErrorContext): void {
    const errorLog = this.formatError(error, context);
    this.logBuffer.push(errorLog);
    
    if (this.shouldFlushBuffer()) {
      this.flushBuffer();
    }
  }
  
  private formatError(error: Error, context: ErrorContext): ErrorLog {
    return {
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      context,
      severity: this.determineSeverity(error)
    };
  }
}
```

### Error Reporting Mechanisms
```typescript
class ErrorReporter {
  private readonly reportEndpoint: string;
  
  async reportError(error: Error, context: ErrorContext): Promise<void> {
    try {
      const report = this.prepareErrorReport(error, context);
      await this.sendReport(report);
    } catch (reportingError) {
      // Store report for later retry
      this.queueForRetry(error, context);
    }
  }
}
```

### Recovery Procedures
```typescript
class RecoveryManager {
  private recoveryStrategies: Map<string, RecoveryStrategy>;
  
  async attemptRecovery(error: Error): Promise<boolean> {
    const strategy = this.selectRecoveryStrategy(error);
    if (strategy) {
      return await strategy.execute();
    }
    return false;
  }
}
```

### Error Event Dispatching
```typescript
class ErrorEventDispatcher {
  private eventBus: EventBus;
  
  dispatchError(error: Error): void {
    const errorEvent = this.createErrorEvent(error);
    this.eventBus.emit('error', errorEvent);
  }
}
```

## Debug Utility Implementation

### Error Tracking Tools
```typescript
class ErrorTracker {
  private errors: Map<string, ErrorStats> = new Map();
  
  trackError(error: Error): void {
    const key = this.getErrorKey(error);
    const stats = this.errors.get(key) || { count: 0, firstSeen: new Date() };
    stats.count++;
    this.errors.set(key, stats);
  }
}
```

### Debug Logging System
```typescript
class DebugLogger {
  private static readonly LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
  private currentLevel: typeof DebugLogger.LOG_LEVELS[number] = 'info';
  
  setLogLevel(level: typeof DebugLogger.LOG_LEVELS[number]): void {
    this.currentLevel = level;
  }
  
  log(level: typeof DebugLogger.LOG_LEVELS[number], message: string, data?: any): void {
    if (this.shouldLog(level)) {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    }
  }
}
```

### Performance Monitoring
```typescript
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  startMeasurement(key: string): void {
    this.metrics.set(key, {
      startTime: performance.now(),
      measurements: []
    });
  }
  
  endMeasurement(key: string): void {
    const metric = this.metrics.get(key);
    if (metric) {
      const duration = performance.now() - metric.startTime;
      metric.measurements.push(duration);
    }
  }
}
```

### State Inspection Tools
```typescript
class StateInspector {
  private gameState: GameState;
  
  inspectState(): StateSnapshot {
    return {
      timestamp: new Date(),
      state: this.serializeState(this.gameState),
      memoryUsage: this.getMemoryUsage(),
      activeServices: this.getActiveServices()
    };
  }
}
```

### Error Reproduction Aids
```typescript
class ErrorReproducer {
  private readonly actionLog: GameAction[] = [];
  
  logAction(action: GameAction): void {
    this.actionLog.push(action);
  }
  
  generateReproductionSteps(): string {
    return this.actionLog
      .map(action => this.formatActionStep(action))
      .join('\n');
  }
}
```

## Error Recovery Procedures

### State Rollback Mechanisms
```typescript
class StateRollback {
  private stateSnapshots: StateSnapshot[] = [];
  
  createSnapshot(): void {
    const snapshot = this.captureCurrentState();
    this.stateSnapshots.push(snapshot);
  }
  
  rollbackToLastSnapshot(): boolean {
    const lastSnapshot = this.stateSnapshots.pop();
    if (lastSnapshot) {
      return this.restoreState(lastSnapshot);
    }
    return false;
  }
}
```

### Data Corruption Handling
```typescript
class DataCorruptionHandler {
  private integrityChecks: Map<string, IntegrityCheck>;
  
  checkDataIntegrity(data: GameData): boolean {
    for (const [key, check] of this.integrityChecks) {
      if (!check(data)) {
        this.handleCorruption(key, data);
        return false;
      }
    }
    return true;
  }
}
```

### Service Reinitialization
```typescript
class ServiceReinitializer {
  private serviceRegistry: ServiceRegistry;
  
  async reinitializeService(serviceName: string): Promise<boolean> {
    try {
      await this.serviceRegistry.destroyService(serviceName);
      await this.serviceRegistry.initializeService(serviceName);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Game State Recovery
```typescript
class GameStateRecovery {
  private backupStates: GameState[] = [];
  
  async recoverGameState(): Promise<boolean> {
    for (const state of this.backupStates.reverse()) {
      if (await this.validateAndRestore(state)) {
        return true;
      }
    }
    return false;
  }
}
```

### Error Boundary Implementation
```typescript
class GameErrorBoundary {
  private readonly maxErrors: number = 3;
  private errorCount: number = 0;
  
  handleError(error: Error): void {
    this.errorCount++;
    if (this.errorCount > this.maxErrors) {
      this.fallbackToSafeMode();
    } else {
      this.attemptRecovery(error);
    }
  }
}
```

## Integration Points

### Service Registry Integration
```typescript
class ErrorHandlingService implements IGameService {
  private static instance: ErrorHandlingService;
  
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }
  
  async init(): Promise<void> {
    // Initialize error handling subsystems
    await this.initializeErrorHandlers();
    await this.setupErrorReporting();
    await this.configureDebugTools();
  }
  
  destroy(): void {
    // Cleanup error handling resources
    this.flushErrorLogs();
    this.disposeDebugTools();
  }
}
```

## Related Documentation
- [Sprint 1 Implementation Plan](../architecture/decisions/sprint1-implementation-plan.md) - Defines the implementation timeline and technical decisions
- [Troubleshooting Guide](../maintenance/troubleshooting.md) - Provides troubleshooting procedures and guidelines
- [Technical Stack](../architecture/technical-stack.md) - Details the technologies used in the implementation
- [Service Implementation Patterns](../architecture/patterns/service-implementation-patterns.md) - Service design patterns and error handling
``` 