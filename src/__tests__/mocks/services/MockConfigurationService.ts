import { jest } from '@jest/globals';
import { Service } from '../../../services/Registry';

// Define the Environment type locally to avoid import issues
type Environment = 'dev' | 'test' | 'prod';

// Create proper configuration interface
interface GameConfig {
  difficulty: string;
  maxPlayers: number;
}

interface AppConfig {
  game: GameConfig;
  [key: string]: unknown;
}

/**
 * Mock implementation of the ConfigurationService
 */
export class MockConfigurationService implements Service {
  private mockConfig: AppConfig = {
    game: {
      difficulty: 'easy',
      maxPlayers: 4,
    },
  };
  // Make this protected instead of private so it can be set by factory function
  protected _mockEnvironment: Environment = 'dev';

  /**
   * Get a configuration value by key
   */
  get<T>(key: string, defaultValue?: T): T {
    const parts = key.split('.');
    let current: unknown = this.mockConfig;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue as T;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current !== undefined ? (current as T) : (defaultValue as T);
  }

  /**
   * Set a configuration value
   */
  set<T>(key: string, value: T): void {
    const parts = key.split('.');
    const lastPart = parts.pop()!;
    let current: Record<string, unknown> = this.mockConfig;

    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[lastPart] = value;
  }

  /**
   * Get the current environment
   */
  getEnvironment(): Environment {
    return this._mockEnvironment;
  }

  /**
   * Set the mock environment - helper method for testing
   */
  setMockEnvironment(environment: Environment): void {
    this._mockEnvironment = environment;
  }

  /**
   * Check if the current environment is production
   */
  isProduction(): boolean {
    return this._mockEnvironment === 'prod';
  }

  /**
   * Check if the current environment is development
   */
  isDevelopment(): boolean {
    return this._mockEnvironment === 'dev';
  }

  /**
   * Check if the current environment is testing
   */
  isTestingEnvironment(): boolean {
    return this._mockEnvironment === 'test';
  }

  /**
   * Load configuration for a specific environment
   */
  async loadConfiguration(environment: Environment): Promise<void> {
    this._mockEnvironment = environment;

    // Update mock config based on environment
    this.mockConfig.game.difficulty =
      environment === 'prod' ? 'hard' : environment === 'test' ? 'medium' : 'easy';
    this.mockConfig.game.maxPlayers = environment === 'prod' ? 8 : environment === 'test' ? 2 : 4;

    return Promise.resolve();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // In mock, just use the current environment rather than loading from process.env
    // This allows tests to control the environment through the constructor
    return Promise.resolve();
  }

  /**
   * Shut down the service
   */
  async shutdown(): Promise<void> {
    // No cleanup needed for the mock
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
 * Create a new mock ConfigurationService with a specific environment
 */
export function createMockConfigurationService(
  environment: Environment = 'dev'
): MockConfigurationService {
  const service = new MockConfigurationService();
  // Use the setter method to change the environment
  service.setMockEnvironment(environment);

  // Update mock config based on environment
  service.set(
    'game.difficulty',
    environment === 'prod' ? 'hard' : environment === 'test' ? 'medium' : 'easy'
  );
  service.set('game.maxPlayers', environment === 'prod' ? 8 : environment === 'test' ? 2 : 4);

  return service;
}

export default {
  MockConfigurationService,
  createMockConfigurationService,
};
