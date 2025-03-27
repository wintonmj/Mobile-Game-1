import { jest } from '@jest/globals';

/**
 * BrowserErrorTracker - Uses model-context-protocol to capture browser errors
 *
 * This utility allows tests to:
 * 1. Access the browser's error events during test execution
 * 2. Capture and assert against browser console errors
 * 3. Detect rendering issues and other runtime browser problems
 */
export class BrowserErrorTracker {
  private static errors: Array<{
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    error?: Error;
  }> = [];
  private static originalErrorHandler: OnErrorEventHandler | null = null;
  private static isTracking = false;
  private static consoleSpy: ReturnType<typeof jest.spyOn> | null = null;

  /**
   * Start tracking browser errors
   */
  public static startTracking(): void {
    if (this.isTracking) {
      return;
    }

    // Clear previous errors
    this.errors = [];

    // Save original handler if it exists
    this.originalErrorHandler = window.onerror;

    // Set up error event handler
    window.onerror = (message, source, lineno, colno, error) => {
      this.errors.push({ message: message.toString(), source, lineno, colno, error });

      // If there was an original handler, call it
      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }

      return false;
    };

    // Also capture console errors
    this.consoleSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      this.errors.push({ message: args.join(' ') });
    });

    this.isTracking = true;
  }

  /**
   * Stop tracking browser errors and restore original handlers
   */
  public static stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    // Restore original error handler
    window.onerror = this.originalErrorHandler;

    // Restore console.error if spy exists
    if (this.consoleSpy) {
      this.consoleSpy.mockRestore();
      this.consoleSpy = null;
    }

    this.isTracking = false;
  }

  /**
   * Get all captured errors
   */
  public static getErrors(): Array<{
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    error?: Error;
  }> {
    return [...this.errors];
  }

  /**
   * Clear captured errors
   */
  public static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if any errors were captured
   */
  public static hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Add an error directly to the error collection
   * This is used when capturing errors from executeInBrowserContext
   */
  public static addError(error: Error | string): void {
    const message = error instanceof Error ? error.message : error;
    this.errors.push({
      message,
      error: error instanceof Error ? error : new Error(message),
    });
  }
}
