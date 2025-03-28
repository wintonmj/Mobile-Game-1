import { jest } from '@jest/globals';

/**
 * Custom error class for timer-related errors
 */
export class TimerError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'TimerError';
  }
}

/**
 * Configuration options for timer operations
 */
export interface TimerOptions {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  doNotFake?: Array<'nextTick' | 'setImmediate' | 'setTimeout' | 'setInterval' | 'clearTimeout' | 'clearInterval' | 'Date' | 'requestAnimationFrame' | 'cancelAnimationFrame' | 'requestIdleCallback' | 'cancelIdleCallback'>;
}

/**
 * Default timer options
 */
const DEFAULT_TIMER_OPTIONS: Required<TimerOptions> = {
  timeoutMs: 10000,
  retryCount: 3,
  retryDelayMs: 100,
  doNotFake: ['nextTick', 'setImmediate']
};

/**
 * Helper function to advance timers and run microtasks
 * This ensures that both timers and microtasks are processed
 */
export async function advanceTimersAndRunMicrotasks(
  ms: number = 0,
  options: TimerOptions = {}
): Promise<void> {
  const { timeoutMs = DEFAULT_TIMER_OPTIONS.timeoutMs } = options;
  
  if (ms > timeoutMs) {
    throw new TimerError(
      `Advance time ${ms}ms exceeds maximum timeout ${timeoutMs}ms`,
      'ADVANCE_TIME_EXCEEDED'
    );
  }

  try {
    if (ms > 0) {
      jest.advanceTimersByTime(ms);
    }
    // Run any pending microtasks
    await Promise.resolve();
  } catch (error) {
    throw new TimerError(
      `Failed to advance timers: ${(error as Error).message}`,
      'TIMER_ADVANCE_FAILED'
    );
  }
}

/**
 * Helper function to run all timers and microtasks
 * This ensures that all pending timers and microtasks are processed
 */
export async function runAllTimersAndMicrotasks(
  options: TimerOptions = {}
): Promise<void> {
  try {
    jest.runAllTimers();
    // Run any pending microtasks
    await Promise.resolve();
  } catch (error) {
    throw new TimerError(
      `Failed to run all timers: ${(error as Error).message}`,
      'TIMER_RUN_FAILED'
    );
  }
}

/**
 * Helper function to run only pending timers with error handling
 */
export function runPendingTimers(): void {
  try {
    jest.runOnlyPendingTimers();
  } catch (error) {
    throw new TimerError(
      `Failed to run pending timers: ${(error as Error).message}`,
      'PENDING_TIMER_RUN_FAILED'
    );
  }
}

/**
 * Helper function to clear all timers and microtasks
 * This is useful for cleaning up between tests
 */
export function clearAllTimersAndMicrotasks(): void {
  try {
    jest.clearAllTimers();
    jest.clearAllMocks();
  } catch (error) {
    throw new TimerError(
      `Failed to clear timers: ${(error as Error).message}`,
      'TIMER_CLEAR_FAILED'
    );
  }
}

/**
 * Helper function to set up fake timers with proper microtask handling
 * This should be called in beforeEach blocks
 */
export function setupFakeTimers(options: TimerOptions = {}): void {
  const { doNotFake = DEFAULT_TIMER_OPTIONS.doNotFake } = options;
  
  try {
    jest.useFakeTimers({ 
      doNotFake,
      legacyFakeTimers: false
    });
  } catch (error) {
    throw new TimerError(
      `Failed to setup fake timers: ${(error as Error).message}`,
      'TIMER_SETUP_FAILED'
    );
  }
}

/**
 * Helper function to restore real timers
 * This should be called in afterEach blocks
 */
export function restoreRealTimers(): void {
  try {
    jest.useRealTimers();
  } catch (error) {
    throw new TimerError(
      `Failed to restore real timers: ${(error as Error).message}`,
      'TIMER_RESTORE_FAILED'
    );
  }
}

/**
 * Helper function to wait for a specific amount of time
 * This is useful for testing timeouts and delays
 */
export async function waitForTime(
  ms: number,
  options: TimerOptions = {}
): Promise<void> {
  const { timeoutMs = DEFAULT_TIMER_OPTIONS.timeoutMs } = options;
  
  if (ms > timeoutMs) {
    throw new TimerError(
      `Wait time ${ms}ms exceeds maximum timeout ${timeoutMs}ms`,
      'WAIT_TIME_EXCEEDED'
    );
  }
  
  await advanceTimersAndRunMicrotasks(ms, options);
}

/**
 * Helper function to wait for a condition to be true
 * This is useful for testing async operations that need to complete
 */
export async function waitForCondition(
  condition: () => boolean,
  options: TimerOptions = {}
): Promise<void> {
  const {
    timeoutMs = DEFAULT_TIMER_OPTIONS.timeoutMs,
    retryDelayMs = DEFAULT_TIMER_OPTIONS.retryDelayMs
  } = options;
  
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new TimerError(
        `Timeout waiting for condition after ${timeoutMs}ms`,
        'CONDITION_TIMEOUT'
      );
    }
    await waitForTime(retryDelayMs, { timeoutMs });
  }
}

/**
 * Helper function to run a test with proper timer setup and cleanup
 * This is useful for wrapping test cases that need timer manipulation
 */
export async function withFakeTimers(
  testFn: () => Promise<void> | void,
  options: TimerOptions = {}
): Promise<void> {
  setupFakeTimers(options);
  try {
    await testFn();
  } finally {
    restoreRealTimers();
  }
} 