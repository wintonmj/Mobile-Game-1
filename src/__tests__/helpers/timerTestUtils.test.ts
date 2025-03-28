import { jest } from '@jest/globals';
import {
  advanceTimersAndRunMicrotasks,
  runAllTimersAndMicrotasks,
  runPendingTimers,
  clearAllTimersAndMicrotasks,
  setupFakeTimers,
  restoreRealTimers,
  waitForTime,
  waitForCondition,
  withFakeTimers
} from './timerTestUtils';

describe('Timer Test Utilities', () => {
  beforeEach(() => {
    setupFakeTimers();
  });

  afterEach(() => {
    restoreRealTimers();
  });

  describe('advanceTimersAndRunMicrotasks', () => {
    it('should advance timers and run microtasks', async () => {
      const promise = new Promise<void>(resolve => {
        setTimeout(() => {
          Promise.resolve().then(() => {
            resolve();
          });
        }, 1000);
      });

      const startTime = Date.now();
      await advanceTimersAndRunMicrotasks(1000);
      await promise;
      const endTime = Date.now();

      expect(endTime - startTime).toBe(1000);
    });
  });

  describe('runAllTimersAndMicrotasks', () => {
    it('should run all pending timers and microtasks', async () => {
      const results: number[] = [];
      
      setTimeout(() => {
        Promise.resolve().then(() => {
          results.push(1);
        });
      }, 1000);
      
      setTimeout(() => {
        Promise.resolve().then(() => {
          results.push(2);
        });
      }, 2000);

      await runAllTimersAndMicrotasks();
      expect(results).toEqual([1, 2]);
    });
  });

  describe('runPendingTimers', () => {
    it('should run only pending timers without microtasks', async () => {
      const results: number[] = [];
      
      setTimeout(() => {
        results.push(1);
      }, 1000);
      
      setTimeout(() => {
        results.push(2);
      }, 2000);

      runPendingTimers();
      expect(results).toEqual([1, 2]);
    });
  });

  describe('clearAllTimersAndMicrotasks', () => {
    it('should clear all timers and mocks', () => {
      const mockFn = jest.fn();
      setTimeout(mockFn, 1000);
      
      clearAllTimersAndMicrotasks();
      
      runPendingTimers();
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('waitForTime', () => {
    it('should wait for specified time', async () => {
      const startTime = Date.now();
      await waitForTime(1000);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBe(1000);
    });
  });

  describe('waitForCondition', () => {
    it('should wait for condition to be true', async () => {
      let value = false;
      setTimeout(() => {
        value = true;
      }, 1000);

      await waitForCondition(() => value);
      expect(value).toBe(true);
    });

    it('should throw error if condition never becomes true', async () => {
      await expect(waitForCondition(() => false, 100)).rejects.toThrow('Timeout waiting for condition');
    });
  });

  describe('withFakeTimers', () => {
    it('should set up and restore timers correctly', async () => {
      const originalTimers = jest.getTimerCount();
      
      await withFakeTimers(async () => {
        expect(jest.getTimerCount()).not.toBe(originalTimers);
      });
      
      expect(jest.getTimerCount()).toBe(originalTimers);
    });

    it('should restore timers even if test fails', async () => {
      const originalTimers = jest.getTimerCount();
      
      await expect(withFakeTimers(async () => {
        throw new Error('Test error');
      })).rejects.toThrow('Test error');
      
      expect(jest.getTimerCount()).toBe(originalTimers);
    });
  });
}); 