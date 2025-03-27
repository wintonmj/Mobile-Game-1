import { jest } from '@jest/globals';
import { Service } from '../../../services/Registry';

/**
 * Mock implementation of a LoggerService
 */
export class MockLoggerService implements Service {
  // Expose mock functions
  mockFunctions = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    initialize: jest.fn().mockImplementation(async () => Promise.resolve()),
    shutdown: jest.fn().mockImplementation(async () => Promise.resolve()),
  };

  /**
   * Log an informational message
   */
  info(message: string, ...args: any[]): void {
    this.mockFunctions.info(message, ...args);
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    this.mockFunctions.debug(message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    this.mockFunctions.warn(message, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    this.mockFunctions.error(message, ...args);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    this.mockFunctions.initialize();
    return Promise.resolve();
  }

  /**
   * Shut down the service
   */
  async shutdown(): Promise<void> {
    this.mockFunctions.shutdown();
    return Promise.resolve();
  }

  /**
   * Called when the service is registered
   */
  onRegister(): void {
    // No action needed for the mock
  }

  /**
   * Called when the service is unregistered
   */
  onUnregister(): void {
    // No action needed for the mock
  }
}

/**
 * Create a new mock LoggerService
 */
export function createMockLoggerService(): MockLoggerService {
  return new MockLoggerService();
}

export default {
  MockLoggerService,
  createMockLoggerService,
};
