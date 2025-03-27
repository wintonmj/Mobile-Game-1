import { jest } from '@jest/globals';
import { BrowserErrorTracker } from './browserErrorTracker';

/**
 * ModelContextTest provides utilities for testing with model-context-protocol
 *
 * Features:
 * - Setup a model-context-protocol testing environment
 * - Track and assert browser errors
 * - Expose browser context to tests
 * - Simplify testing of rendering and JavaScript execution in the browser
 */
export class ModelContextTest {
  private static isInitialized = false;

  /**
   * Initialize the model-context test environment
   * This should be called in the test setup
   */
  public static init(): void {
    if (this.isInitialized) {
      return;
    }

    // Initialize browser error tracking
    BrowserErrorTracker.startTracking();

    // Add additional model-context-protocol setup here
    // This would include any specific configuration for your application

    this.isInitialized = true;
  }

  /**
   * Clean up the model-context test environment
   * This should be called in the test teardown
   */
  public static cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    // Stop browser error tracking
    BrowserErrorTracker.stopTracking();

    this.isInitialized = false;
  }

  /**
   * Create a test wrapper function that initializes and cleans up the model-context environment
   * @param testFn The test function to wrap
   */
  public static createTest(testFn: () => void | Promise<void>): () => Promise<void> {
    return async () => {
      try {
        this.init();
        await testFn();
      } finally {
        this.cleanup();
      }
    };
  }

  /**
   * Assert that no browser errors were captured during the test
   */
  public static assertNoErrors(): void {
    const errors = BrowserErrorTracker.getErrors();
    expect(errors).toHaveLength(0);
  }

  /**
   * Assert that specific browser errors were captured during the test
   * @param errorPattern RegExp pattern to match against error messages
   */
  public static assertErrorMatching(errorPattern: RegExp): void {
    const errors = BrowserErrorTracker.getErrors();
    expect(errors.some((err) => errorPattern.test(err.message))).toBe(true);
  }

  /**
   * Wait for the browser to render and process events
   * @param ms Milliseconds to wait (default: 100)
   */
  public static async waitForRender(ms = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute a function in the browser context and track any errors
   * @param fn Function to execute
   * @param shouldRethrow Whether to rethrow the error after tracking it (default: false)
   */
  public static executeInBrowserContext<T>(fn: () => T, shouldRethrow = false): T | undefined {
    try {
      return fn();
    } catch (error) {
      if (error instanceof Error) {
        // Add the error to our tracker
        BrowserErrorTracker.addError(error);
      } else {
        // For non-Error objects, create a new Error
        const message = String(error);
        BrowserErrorTracker.addError(message);
      }

      // Optionally rethrow the error
      if (shouldRethrow) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(String(error));
        }
      }

      return undefined;
    }
  }

  /**
   * Get all captured browser errors
   */
  public static getErrors(): Array<{
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    error?: Error;
  }> {
    return BrowserErrorTracker.getErrors();
  }

  /**
   * Clear all captured errors
   */
  public static clearErrors(): void {
    BrowserErrorTracker.clearErrors();
  }
}
