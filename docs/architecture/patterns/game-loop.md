# Game Loop Architecture

## Overview
This document details the game loop implementation, which combines Phaser's built-in scene lifecycle with our custom game loop management system.

## Core Components

### 1. Scene Lifecycle Integration
```typescript
class GameScene extends Phaser.Scene {
  init(data: any): void {
    // Scene initialization
  }
  
  preload(): void {
    // Asset loading
  }
  
  create(): void {
    // Scene setup
  }
  
  update(time: number, delta: number): void {
    // Frame updates
  }
}
```

### 2. Custom Game Loop Manager
The `GameLoop` class provides:
- Variable and fixed timestep updates
- Priority-based update scheduling
- Performance monitoring
- State synchronization

```typescript
interface GameLoopConfig {
  fixedTimeStep: number;
  maxTimeStep: number;
  maxUpdatesPerFrame: number;
}

class GameLoop {
  private updateCallbacks: Map<string, UpdateCallback>;
  private fixedUpdateCallbacks: Map<string, FixedUpdateCallback>;
  
  constructor(config: GameLoopConfig) {
    this.config = config;
  }
  
  addUpdateCallback(key: string, callback: UpdateCallback, priority: number = 0): void;
  addFixedUpdateCallback(key: string, callback: FixedUpdateCallback): void;
  removeUpdateCallback(key: string): void;
  removeFixedUpdateCallback(key: string): void;
  
  update(time: number, delta: number): void;
  fixedUpdate(time: number): void;
}
```

## Update Types

### 1. Variable Update
- Runs every frame
- Delta time varies based on frame rate
- Used for:
  - Visual updates
  - Input handling
  - Animation
  - Camera movement

### 2. Fixed Update
- Runs at fixed time intervals
- Consistent delta time
- Used for:
  - Physics calculations
  - AI updates
  - Network synchronization
  - Game logic requiring precise timing

## Performance Monitoring

The game loop includes built-in performance monitoring through a comprehensive hooks system. For detailed implementation of performance hooks, see [performance-hooks.md](../../implementation/performance-hooks.md).

Key features include:
- FPS tracking
- Frame time measurement
- Update cycle timing
- Memory usage monitoring
- Custom performance hooks
- Adaptive performance optimization
- Resource management

```typescript
interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  fixedUpdateTime: number;
  memoryUsage?: number;
}
```

## State Management Integration

The game loop coordinates with the state management system through a comprehensive integration layer. For detailed implementation, see [game-loop-state.md](../../implementation/game-loop-state.md).

Key features include:
1. Scene State Synchronization
   - Automatic state synchronization for active scenes
   - Entity state management
   - Environment state updates
   - UI state coordination

2. Entity State Updates
   - Batched state updates for performance
   - Priority-based update scheduling
   - State change validation
   - Efficient state diffing

3. Input Processing Order
   - Priority-based input handling
   - Input state management
   - Event generation from inputs
   - State updates from input events

4. Event Dispatch Timing
   - Ordered event processing
   - State-driven event handling
   - Event batching and optimization
   - Consistent event ordering

## Best Practices

1. **Update Priority**
   - Input processing: Highest priority
   - Game logic: Medium priority
   - Visual updates: Lower priority
   - Debug/monitoring: Lowest priority

2. **Performance Optimization**
   - Limit fixed updates per frame
   - Use object pooling for frequent updates
   - Implement spatial partitioning for large scenes
   - Profile update callbacks regularly

3. **Debug Considerations**
   - Enable performance monitoring in development
   - Log problematic frame times
   - Track update callback execution times
   - Monitor memory usage trends

## Example Implementation

```typescript
class GameScene extends Phaser.Scene {
  private gameLoop: GameLoop;
  
  create(): void {
    this.gameLoop = new GameLoop({
      fixedTimeStep: 1/60,
      maxTimeStep: 0.1,
      maxUpdatesPerFrame: 5
    });
    
    // Register core updates
    this.gameLoop.addUpdateCallback('input', this.updateInput.bind(this), 100);
    this.gameLoop.addUpdateCallback('camera', this.updateCamera.bind(this), 50);
    this.gameLoop.addUpdateCallback('visual', this.updateVisuals.bind(this), 0);
    
    // Register fixed updates
    this.gameLoop.addFixedUpdateCallback('physics', this.updatePhysics.bind(this));
    this.gameLoop.addFixedUpdateCallback('ai', this.updateAI.bind(this));
  }
  
  update(time: number, delta: number): void {
    this.gameLoop.update(time, delta);
  }
}
```

## Device Adaptation

### 1. Adaptive Time Steps
```typescript
class AdaptiveGameLoop extends GameLoop {
  private deviceCapabilities: DeviceCapabilities;
  private targetFPS: number;
  
  constructor(config: GameLoopConfig) {
    super(config);
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.adjustForDevice();
  }
  
  private adjustForDevice(): void {
    // Adjust time steps based on device capabilities
    if (this.deviceCapabilities.isMobile) {
      this.targetFPS = 30;
      this.config.maxUpdatesPerFrame = 2;
    } else {
      this.targetFPS = 60;
      this.config.maxUpdatesPerFrame = 5;
    }
    
    // Adjust fixed time step
    this.config.fixedTimeStep = 1 / this.targetFPS;
  }
  
  private detectDeviceCapabilities(): DeviceCapabilities {
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent),
      gpuTier: this.detectGPUTier(),
      memoryLimit: this.detectMemoryLimit(),
      screenRefreshRate: this.detectScreenRefreshRate()
    };
  }
}
```

### 2. Frame Skipping
```typescript
interface FrameSkipConfig {
  enabled: boolean;
  maxSkippedFrames: number;
  targetFrameTime: number;
}

class FrameSkipController {
  private config: FrameSkipConfig;
  private skippedFrames: number = 0;
  
  shouldRenderFrame(frameTime: number): boolean {
    if (!this.config.enabled) return true;
    
    if (frameTime > this.config.targetFrameTime) {
      if (this.skippedFrames < this.config.maxSkippedFrames) {
        this.skippedFrames++;
        return false;
      }
    }
    
    this.skippedFrames = 0;
    return true;
  }
}
```

## Runtime Configuration

### 1. Feature Flags
```typescript
interface GameLoopFeatureFlags {
  adaptiveTimeStep: boolean;
  frameSkipping: boolean;
  performanceMonitoring: boolean;
  debugMode: boolean;
}

class ConfigurableGameLoop extends GameLoop {
  private featureFlags: GameLoopFeatureFlags;
  
  enableFeature(feature: keyof GameLoopFeatureFlags): void {
    this.featureFlags[feature] = true;
    this.applyFeatureConfiguration();
  }
  
  disableFeature(feature: keyof GameLoopFeatureFlags): void {
    this.featureFlags[feature] = false;
    this.applyFeatureConfiguration();
  }
  
  private applyFeatureConfiguration(): void {
    // Apply configuration changes based on feature flags
    if (this.featureFlags.adaptiveTimeStep) {
      this.enableAdaptiveTimeStep();
    }
    
    if (this.featureFlags.frameSkipping) {
      this.enableFrameSkipping();
    }
    
    // Update monitoring systems
    this.updateMonitoringSystems();
  }
}
```

### 2. Performance Profiles
```typescript
interface PerformanceProfile {
  name: string;
  targetFPS: number;
  maxUpdatesPerFrame: number;
  fixedTimeStep: number;
  frameSkipConfig: FrameSkipConfig;
}

const PERFORMANCE_PROFILES: Record<string, PerformanceProfile> = {
  high: {
    name: 'High Performance',
    targetFPS: 60,
    maxUpdatesPerFrame: 5,
    fixedTimeStep: 1/60,
    frameSkipConfig: { enabled: false, maxSkippedFrames: 0, targetFrameTime: 16.67 }
  },
  balanced: {
    name: 'Balanced',
    targetFPS: 45,
    maxUpdatesPerFrame: 3,
    fixedTimeStep: 1/45,
    frameSkipConfig: { enabled: true, maxSkippedFrames: 1, targetFrameTime: 22.22 }
  },
  powersaver: {
    name: 'Power Saver',
    targetFPS: 30,
    maxUpdatesPerFrame: 2,
    fixedTimeStep: 1/30,
    frameSkipConfig: { enabled: true, maxSkippedFrames: 2, targetFrameTime: 33.33 }
  }
};
```

## Mobile Optimization

### 1. Touch Input Handling
```typescript
class MobileGameLoop extends GameLoop {
  private touchInputBuffer: TouchEvent[] = [];
  private lastTouchProcessTime: number = 0;
  
  protected processTouchInput(): void {
    const currentTime = performance.now();
    const timeSinceLastProcess = currentTime - this.lastTouchProcessTime;
    
    // Process touch events at a lower frequency on mobile
    if (timeSinceLastProcess >= 32) { // ~30fps for touch processing
      while (this.touchInputBuffer.length > 0) {
        const event = this.touchInputBuffer.shift();
        this.handleTouchEvent(event);
      }
      this.lastTouchProcessTime = currentTime;
    }
  }
}
```

### 2. Battery Awareness
```typescript
class BatteryAwareGameLoop extends GameLoop {
  private batteryManager: BatteryManager;
  
  async initBatteryAwareness(): Promise<void> {
    if ('getBattery' in navigator) {
      this.batteryManager = await (navigator as any).getBattery();
      this.batteryManager.addEventListener('levelchange', 
        () => this.adjustForBatteryLevel());
    }
  }
  
  private adjustForBatteryLevel(): void {
    if (this.batteryManager.level < 0.2) {
      this.applyProfile(PERFORMANCE_PROFILES.powersaver);
    } else if (this.batteryManager.level < 0.5) {
      this.applyProfile(PERFORMANCE_PROFILES.balanced);
    }
  }
}
``` 