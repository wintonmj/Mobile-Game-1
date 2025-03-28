import { IRegistry } from './interfaces/IRegistry';
import { EventBusService } from './EventBusService';

// Define memory interface for TypeScript
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

export interface PerformanceMetrics {
  loadingTime: number;
  memoryUsage: number;
  fps: number;
  assetLoadTimes: Map<string, number>;
  cacheHitRate: number;
}

export class PerformanceMetricsService {
  private registry: IRegistry;
  private eventBus: EventBusService;
  private metrics: PerformanceMetrics;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private assetLoadStartTimes: Map<string, number> = new Map();

  constructor(registry: IRegistry) {
    this.registry = registry;
    this.eventBus = registry.getService('EventBusService') as EventBusService;
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      loadingTime: 0,
      memoryUsage: 0,
      fps: 0,
      assetLoadTimes: new Map(),
      cacheHitRate: 0,
    };
  }

  private setupEventListeners(): void {
    // Track asset loading
    this.eventBus.on<string>('asset:loadStart', (data?: string) => {
      if (data) {
        const startTime = performance.now();
        this.assetLoadStartTimes.set(data, startTime);
      }
    });

    this.eventBus.on<string>('asset:loadComplete', (data?: string) => {
      if (data) {
        const startTime = this.assetLoadStartTimes.get(data);
        if (startTime !== undefined) {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          this.metrics.assetLoadTimes.set(data, loadTime);
          this.assetLoadStartTimes.delete(data);
          this.metrics.loadingTime += loadTime;
        }
      }
    });

    // Track FPS
    this.eventBus.on('game:update', () => {
      const currentTime = performance.now();
      this.frameCount++;

      const elapsed = currentTime - this.lastTime;
      if (elapsed >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastTime = currentTime;
      } else {
        // Update FPS on every frame for more responsive metrics
        this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      }
    });

    // Track memory usage
    this.eventBus.on('game:update', () => {
      this.updateMemoryUsage();
    });
  }

  private updateMemoryUsage(): void {
    const performanceWithMemory = performance as PerformanceWithMemory;
    if (performanceWithMemory.memory) {
      this.metrics.memoryUsage = performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
  }

  public getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      assetLoadTimes: new Map(this.metrics.assetLoadTimes),
    };
  }

  public getAverageAssetLoadTime(): number {
    const times = Array.from(this.metrics.assetLoadTimes.values());
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.assetLoadStartTimes.clear();
  }
} 