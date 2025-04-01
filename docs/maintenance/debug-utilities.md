# Debug Utilities Documentation

## Overview
This document details the debug utilities available in the game engine, including built-in tools, custom debugging features, and best practices for development and troubleshooting.

## Core Debug Tools

### 1. Performance Monitor
```typescript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map<string, number[]>();
    this.warnings = new Map<string, number>();
  }

  // Track performance metrics
  trackMetric(name: string, value: number): void;
  
  // Get current metrics
  getMetrics(): Record<string, number>;
  
  // Set warning thresholds
  setWarningThreshold(name: string, threshold: number): void;
}
```

### 2. Scene Inspector
```typescript
class SceneInspector {
  // Display list of all game objects
  showGameObjects(): void;
  
  // Show physics bodies
  showPhysicsBodies(): void;
  
  // Display camera bounds
  showCameraBounds(): void;
  
  // Show input hit areas
  showInputDebug(): void;
}
```

### 3. State Inspector
```typescript
class StateInspector {
  // Track state changes
  watchState(path: string): void;
  
  // Log state transitions
  enableStateLogging(): void;
  
  // Show current state tree
  displayStateTree(): void;
}
```

## Visual Debug Tools

### 1. Debug Graphics
- Physics body outlines
- Collision zones
- Input hit areas
- Camera bounds
- Path finding grids

### 2. Debug HUD
- FPS counter
- Memory usage
- Object count
- Draw calls
- Physics body count

### 3. Visual State
- Entity states
- Animation states
- Physics states
- Input states

## Console Commands

### 1. Performance Commands
```typescript
// Enable FPS display
debug.showFPS();

// Show memory usage
debug.showMemory();

// Track specific metric
debug.trackMetric('playerPosition');

// Profile section
debug.startProfile('combat');
debug.endProfile('combat');
```

### 2. State Commands
```typescript
// Inspect game state
debug.showState();

// Watch state changes
debug.watchState('player.health');

// Modify state (development only)
debug.setState('player.position', {x: 100, y: 100});
```

### 3. Scene Commands
```typescript
// List all objects
debug.listObjects();

// Show object details
debug.inspectObject('player');

// Toggle physics debug
debug.togglePhysics();
```

## Development Tools

### 1. Logger
```typescript
class DebugLogger {
  static log(category: string, message: string, data?: any): void;
  static warn(category: string, message: string, data?: any): void;
  static error(category: string, message: string, error?: Error): void;
}

// Usage
DebugLogger.log('Physics', 'Collision detected', { objects: [obj1, obj2] });
```

### 2. Asset Tracker
```typescript
class AssetTracker {
  // Track asset loading
  trackAssetLoad(key: string): void;
  
  // Show loading statistics
  showLoadingStats(): void;
  
  // Check for unused assets
  findUnusedAssets(): string[];
}
```

### 3. Event Monitor
```typescript
class EventMonitor {
  // Track event emissions
  trackEvent(eventName: string): void;
  
  // Show event statistics
  showEventStats(): void;
  
  // Record event sequence
  startEventRecording(): void;
  stopEventRecording(): EventLog[];
}
```

## Integration Examples

### 1. Scene Integration
```typescript
class DebugScene extends Phaser.Scene {
  create() {
    // Add debug graphics layer
    this.debugGraphics = this.add.graphics();
    
    // Initialize debug tools
    this.sceneInspector = new SceneInspector(this);
    this.performanceMonitor = new PerformanceMonitor();
    
    // Add debug HUD
    this.debugHUD = new DebugHUD(this);
    
    if (process.env.NODE_ENV === 'development') {
      this.enableDebugMode();
    }
  }
  
  private enableDebugMode(): void {
    // Enable physics debug
    this.physics.world.createDebugGraphic();
    
    // Show debug HUD
    this.debugHUD.show();
    
    // Enable state tracking
    this.stateInspector.enableTracking();
    
    // Setup debug keyboard shortcuts
    this.setupDebugShortcuts();
  }
}
```

### 2. Service Integration
```typescript
class GameService implements IGameService {
  constructor() {
    if (process.env.NODE_ENV === 'development') {
      this.setupDebugHelpers();
    }
  }
  
  private setupDebugHelpers(): void {
    // Add service to debug registry
    DebugRegistry.registerService(this);
    
    // Enable method tracking
    DebugLogger.trackMethods(this);
    
    // Setup performance monitoring
    this.performanceMonitor.trackService(this);
  }
}
```

## Best Practices

### 1. Debug Configuration
- Use environment variables for debug modes
- Implement different debug levels
- Separate debug builds from production
- Use conditional compilation for debug code

### 2. Performance Impact
- Disable debug features in production
- Use lazy initialization for debug tools
- Implement debug features efficiently
- Clean up debug resources when not needed

### 3. Security
- Never expose sensitive data in debug output
- Disable debug tools in production
- Validate debug commands
- Protect debug interfaces

## Usage Guidelines

1. **Development Environment**
   - Enable all debug tools
   - Use verbose logging
   - Show visual debugging
   - Enable performance monitoring

2. **Testing Environment**
   - Enable core debug tools
   - Use minimal logging
   - Enable performance tracking
   - Disable visual debugging

3. **Production Environment**
   - Disable all debug tools
   - Minimal error logging only
   - No visual debugging
   - No performance overhead

## Mobile-Specific Debug Tools

### 1. Mobile Performance Monitor
```typescript
class MobilePerformanceMonitor extends PerformanceMonitor {
  // Track mobile-specific metrics
  private touchResponseTime: number[] = [];
  private batteryLevel: number = 100;
  private networkLatency: number[] = [];
  
  constructor() {
    super();
    this.initializeMobileMonitoring();
  }
  
  private initializeMobileMonitoring(): void {
    // Monitor touch response time
    document.addEventListener('touchstart', this.trackTouchResponse.bind(this));
    
    // Monitor battery status
    if ('getBattery' in navigator) {
      this.setupBatteryMonitoring();
    }
    
    // Monitor network conditions
    if ('connection' in navigator) {
      this.setupNetworkMonitoring();
    }
  }
  
  private async setupBatteryMonitoring(): Promise<void> {
    const battery = await (navigator as any).getBattery();
    battery.addEventListener('levelchange', () => {
      this.batteryLevel = battery.level * 100;
      this.trackMetric('battery', this.batteryLevel);
    });
  }
}
```

### 2. Device Capability Inspector
```typescript
class DeviceCapabilityInspector {
  inspectCapabilities(): DeviceCapabilities {
    return {
      screen: this.getScreenInfo(),
      hardware: this.getHardwareInfo(),
      browser: this.getBrowserInfo(),
      network: this.getNetworkInfo()
    };
  }
  
  private getScreenInfo(): ScreenInfo {
    return {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation.type,
      refreshRate: this.getScreenRefreshRate()
    };
  }
  
  private getHardwareInfo(): HardwareInfo {
    return {
      memory: this.getDeviceMemory(),
      processors: navigator.hardwareConcurrency,
      gpu: this.getGPUInfo()
    };
  }
}
```

### 3. Touch Debug Overlay
```typescript
class TouchDebugOverlay {
  private canvas: HTMLCanvasElement;
  private touchPoints: Map<number, TouchPoint> = new Map();
  
  constructor() {
    this.setupOverlay();
  }
  
  private setupOverlay(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    document.body.appendChild(this.canvas);
    
    this.setupTouchListeners();
  }
  
  private visualizeTouchPoint(touch: Touch): void {
    const ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(touch.clientX, touch.clientY, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Show touch data
    ctx.fillText(`ID: ${touch.identifier}`, touch.clientX + 25, touch.clientY);
    ctx.fillText(`Force: ${touch.force}`, touch.clientX + 25, touch.clientY + 20);
  }
}
```

## Memory Profiling

### 1. Heap Profiler
```typescript
class HeapProfiler {
  private snapshots: HeapSnapshot[] = [];
  private tracking: boolean = false;
  
  startTracking(): void {
    this.tracking = true;
    this.scheduleHeapSnapshot();
  }
  
  private async takeHeapSnapshot(): Promise<void> {
    if ('performance' in window && 'memory' in performance) {
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      };
      
      this.snapshots.push(snapshot);
      this.analyzeHeapGrowth();
    }
  }
  
  private analyzeHeapGrowth(): void {
    if (this.snapshots.length < 2) return;
    
    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];
    
    const growth = latest.usedJSHeapSize - previous.usedJSHeapSize;
    if (growth > 1024 * 1024 * 10) { // 10MB growth
      console.warn('Significant heap growth detected:', {
        growth: `${(growth / (1024 * 1024)).toFixed(2)}MB`,
        timespan: `${(latest.timestamp - previous.timestamp) / 1000}s`
      });
    }
  }
}
```

### 2. Object Pool Monitor
```typescript
class ObjectPoolMonitor {
  private poolStats: Map<string, PoolStats> = new Map();
  
  trackPool(poolName: string, pool: ObjectPool): void {
    this.poolStats.set(poolName, {
      size: pool.size,
      active: pool.activeObjects.size,
      maxUsed: pool.activeObjects.size,
      recycleCount: 0
    });
    
    // Monitor pool operations
    pool.onObjectActivated(() => this.updatePoolStats(poolName, 'activate'));
    pool.onObjectRecycled(() => this.updatePoolStats(poolName, 'recycle'));
  }
  
  private updatePoolStats(poolName: string, operation: 'activate' | 'recycle'): void {
    const stats = this.poolStats.get(poolName);
    if (!stats) return;
    
    if (operation === 'activate') {
      stats.active++;
      stats.maxUsed = Math.max(stats.maxUsed, stats.active);
    } else {
      stats.active--;
      stats.recycleCount++;
    }
    
    this.analyzePoolEfficiency(poolName);
  }
}
```

### 3. Memory Leak Detective
```typescript
class MemoryLeakDetective {
  private objectReferences: WeakMap<object, ReferenceInfo> = new WeakMap();
  private disposalQueue: Set<WeakRef<object>> = new Set();
  
  trackObject(object: object, category: string): void {
    this.objectReferences.set(object, {
      category,
      createdAt: Date.now(),
      stackTrace: new Error().stack
    });
    
    // Create weak reference for disposal tracking
    const ref = new WeakRef(object);
    this.disposalQueue.add(ref);
  }
  
  async detectLeaks(): Promise<LeakReport> {
    const leaks: LeakCandidate[] = [];
    
    // Check objects that should have been garbage collected
    for (const ref of this.disposalQueue) {
      const obj = ref.deref();
      if (obj) {
        const info = this.objectReferences.get(obj);
        if (info && Date.now() - info.createdAt > 30000) { // 30s threshold
          leaks.push({
            category: info.category,
            age: Date.now() - info.createdAt,
            stackTrace: info.stackTrace
          });
        }
      }
    }
    
    return {
      timestamp: Date.now(),
      leaks,
      totalTrackedObjects: this.objectReferences.size
    };
  }
}
```

## Device-Specific Testing Tools

### 1. Device Simulator
```typescript
class DeviceSimulator {
  // Simulate different device conditions
  simulateMemoryPressure(): void;
  simulateLowBattery(): void;
  simulateSlowNetwork(): void;
  simulateDeviceOrientation(orientation: DeviceOrientation): void;
}
```

### 2. Performance Budget Monitor
```typescript
class PerformanceBudgetMonitor {
  private budgets: Map<string, PerformanceBudget> = new Map();
  
  setBudget(category: string, budget: PerformanceBudget): void {
    this.budgets.set(category, budget);
  }
  
  checkBudget(category: string, value: number): void {
    const budget = this.budgets.get(category);
    if (!budget) return;
    
    if (value > budget.critical) {
      this.reportBudgetViolation(category, value, 'critical');
    } else if (value > budget.warning) {
      this.reportBudgetViolation(category, value, 'warning');
    }
  }
}
```

### 3. Cross-Device Test Runner
```typescript
class CrossDeviceTestRunner {
  // Run tests across different device profiles
  async runTestSuite(suite: TestSuite, deviceProfiles: DeviceProfile[]): Promise<TestResults> {
    const results: TestResults = new Map();
    
    for (const profile of deviceProfiles) {
      this.applyDeviceProfile(profile);
      results.set(profile.name, await this.executeTests(suite));
    }
    
    return results;
  }
}
``` 