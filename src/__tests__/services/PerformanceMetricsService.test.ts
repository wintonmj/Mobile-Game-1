import { jest } from '@jest/globals';
import { PerformanceMetricsService } from '../../services/PerformanceMetricsService';
import { Registry } from '../../services/Registry';
import { EventBusService } from '../../services/EventBusService';

describe('PerformanceMetricsService', () => {
  let registry: Registry;
  let eventBus: EventBusService;
  let metricsService: PerformanceMetricsService;

  beforeEach(() => {
    jest.useFakeTimers();
    registry = new Registry();
    eventBus = new EventBusService();
    registry.registerService('EventBusService', eventBus);
    metricsService = new PerformanceMetricsService(registry);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with default metrics', () => {
    const metrics = metricsService.getMetrics();
    expect(metrics.fps).toBe(0);
    expect(metrics.memoryUsage).toBe(0);
    expect(metrics.loadingTime).toBe(0);
    expect(metrics.cacheHitRate).toBe(0);
    expect(metrics.assetLoadTimes.size).toBe(0);
  });

  test('should track asset loading times', () => {
    // Simulate asset loading
    eventBus.emit('asset:loadStart', 'test-asset');
    // Simulate some time passing
    jest.advanceTimersByTime(100);
    eventBus.emit('asset:loadComplete', 'test-asset');

    const metrics = metricsService.getMetrics();
    expect(metrics.assetLoadTimes.get('test-asset')).toBeGreaterThanOrEqual(100);
  });

  test('should calculate average asset load time', () => {
    // Simulate multiple asset loads
    eventBus.emit('asset:loadStart', 'asset1');
    jest.advanceTimersByTime(100);
    eventBus.emit('asset:loadComplete', 'asset1');

    eventBus.emit('asset:loadStart', 'asset2');
    jest.advanceTimersByTime(200);
    eventBus.emit('asset:loadComplete', 'asset2');

    const avgTime = metricsService.getAverageAssetLoadTime();
    expect(avgTime).toBeGreaterThanOrEqual(150);
  });

  test('should track FPS', () => {
    // Simulate game updates
    for (let i = 0; i < 60; i++) {
      eventBus.emit('game:update');
      jest.advanceTimersByTime(1000 / 60); // Simulate 60 FPS
    }

    const metrics = metricsService.getMetrics();
    expect(metrics.fps).toBeGreaterThan(0);
  });

  test('should reset metrics', () => {
    // Add some metrics
    eventBus.emit('asset:loadStart', 'test-asset');
    jest.advanceTimersByTime(100);
    eventBus.emit('asset:loadComplete', 'test-asset');

    metricsService.resetMetrics();
    const metrics = metricsService.getMetrics();
    expect(metrics.assetLoadTimes.size).toBe(0);
    expect(metrics.fps).toBe(0);
    expect(metrics.memoryUsage).toBe(0);
  });
}); 