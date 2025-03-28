import fs from 'fs';
import { ConfigurationError, ConfigurationParseError } from '../utils/errors';
import { Service } from './Registry';

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * JSON Schema property type definition
 */
export interface SchemaProperty {
  type: string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  required?: string[];
  [key: string]: unknown;
}

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Type for configuration objects
 */
export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigValue[];

/**
 * Interface for configuration objects
 */
export interface ConfigObject {
  [key: string]: ConfigValue;
}

/**
 * Interface for error objects with code property
 */
interface ErrorWithCode extends Error {
  code: string;
}

export type Environment = 'dev' | 'test' | 'prod';

// In-memory configuration for testing
const testConfigStore = new Map<string, string>();

// Testing mode flag
let isTestMode = false;

/**
 * Set the ConfigurationService to testing mode
 * This should be called before creating any ConfigurationService instances in tests
 */
export function enableTestMode(enabled: boolean = true): void {
  isTestMode = enabled;
  if (enabled) {
    // Clear the test store when enabling test mode
    testConfigStore.clear();
  }
}

/**
 * Set test configuration for an environment
 * @param env Environment
 * @param config Configuration object
 */
export function setTestConfiguration(env: Environment, config: ConfigObject): void {
  if (!isTestMode) {
    throw new Error('Cannot set test configuration when not in test mode');
  }
  testConfigStore.set(`config.${env}.json`, JSON.stringify(config));
}

/**
 * Set invalid JSON for a specific environment (for testing parse errors)
 * @param env Environment
 */
export function setInvalidTestConfiguration(env: Environment): void {
  if (!isTestMode) {
    throw new Error('Cannot set test configuration when not in test mode');
  }
  testConfigStore.set(`config.${env}.json`, '{invalid"json:content');
}

/**
 * Clear test configuration for an environment
 * @param env Environment
 */
export function clearTestConfiguration(env: Environment): void {
  if (!isTestMode) {
    throw new Error('Cannot clear test configuration when not in test mode');
  }
  testConfigStore.delete(`config.${env}.json`);
}

export class ConfigurationService implements Service {
  private config: ConfigObject = {};
  private currentEnvironment: Environment = 'dev';

  /**
   * Get a configuration value by key
   * @param key The configuration key (supports dot notation for nested values)
   * @param defaultValue Optional default value if the key doesn't exist
   * @returns The configuration value or the default value
   */
  get<T extends ConfigValue>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key);
    return value !== undefined ? (value as T) : (defaultValue as T);
  }

  /**
   * Set a configuration value
   * @param key The configuration key (supports dot notation for nested values)
   * @param value The value to set
   */
  set<T extends ConfigValue>(key: string, value: T): void {
    this.setNestedValue(this.config, key, value);
  }

  /**
   * Get a nested value from an object using dot notation
   * @param obj The object to traverse
   * @param path The dot-notation path
   * @returns The value at the path or undefined if not found
   */
  private getNestedValue(obj: ConfigObject, path: string): ConfigValue | undefined {
    return path.split('.').reduce<ConfigValue | undefined>((current, part) => {
      if (
        current === undefined ||
        current === null ||
        typeof current !== 'object' ||
        Array.isArray(current)
      ) {
        return undefined;
      }
      return (current as ConfigObject)[part];
    }, obj as ConfigValue);
  }

  /**
   * Set a nested value in an object using dot notation
   * @param obj The object to modify
   * @param path The dot-notation path
   * @param value The value to set
   */
  private setNestedValue(obj: ConfigObject, path: string, value: ConfigValue): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;

    let current = obj;
    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      const next = current[part];
      if (typeof next !== 'object' || next === null || Array.isArray(next)) {
        current[part] = {};
      }
      current = current[part] as ConfigObject;
    }

    current[lastPart] = value;
  }

  /**
   * Get the current environment
   * @returns The current environment ('dev', 'test', or 'prod')
   */
  getEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Check if the current environment is production
   * @returns true if the environment is production
   */
  isProduction(): boolean {
    return this.currentEnvironment === 'prod';
  }

  /**
   * Check if the current environment is development
   * @returns true if the environment is development
   */
  isDevelopment(): boolean {
    return this.currentEnvironment === 'dev';
  }

  /**
   * Check if the current environment is testing
   * @returns true if the environment is testing
   */
  isTestingEnvironment(): boolean {
    return this.currentEnvironment === 'test';
  }

  /**
   * Load configuration for a specific environment
   * @param environment The environment to load configuration for
   * @throws ConfigurationError if the configuration file cannot be loaded
   * @throws ConfigurationParseError if the configuration file contains invalid JSON
   */
  async loadConfiguration(environment: Environment): Promise<void> {
    this.currentEnvironment = environment;
    const configPath = `config.${environment}.json`;
    console.log(`Attempting to load configuration from: ${configPath}`);

    try {
      let configContent: string;

      // Use test store in test mode, file system otherwise
      if (isTestMode) {
        configContent = testConfigStore.get(configPath) || '';
        if (!configContent) {
          throw new ConfigurationError(
            `Configuration file not found: ${configPath}`,
            'FILE_NOT_FOUND'
          );
        }
      } else {
        console.log('Before fs.promises.readFile call');
        configContent = await fs.promises.readFile(configPath, 'utf8');
        console.log('Successfully read file content:', configContent.substring(0, 50) + '...');
      }

      try {
        const config = JSON.parse(configContent) as ConfigObject;
        // Merge the new configuration with existing config
        this.config = { ...this.config, ...config };
        console.log('Config parsed and merged successfully');
      } catch (parseError: unknown) {
        console.log('Parse error:', parseError);
        const errorMessage =
          parseError instanceof Error ? parseError.message : 'Unknown parse error';
        throw new ConfigurationParseError(
          `Failed to parse configuration file ${configPath}: ${errorMessage}`
        );
      }
    } catch (error: unknown) {
      console.log('File read error:', error);
      console.log('Error type:', typeof error);
      console.log('Error is Error instance:', error instanceof Error);

      // Convert to Error object if it's not already one
      let typedError: Error;
      if (!(error instanceof Error)) {
        typedError = new Error(String(error));
        console.log('Converted non-Error to Error:', typedError);
      } else {
        typedError = error;
      }

      // If it's already a ConfigurationError, pass it through
      if (typedError instanceof ConfigurationError) {
        throw typedError;
      }

      // Check for file not found error
      if ('code' in typedError && (typedError as ErrorWithCode).code === 'ENOENT') {
        throw new ConfigurationError(
          `Configuration file not found: ${configPath}`,
          'FILE_NOT_FOUND'
        );
      }

      // Check for permission error
      if ('code' in typedError && (typedError as ErrorWithCode).code === 'EACCES') {
        throw new ConfigurationError(
          `Permission denied when accessing configuration file: ${configPath}`,
          'PERMISSION_ERROR'
        );
      }

      // For any other error, wrap it in a ConfigurationError
      const errorMessage = typedError.message || 'Unknown error';
      throw new ConfigurationError(`Failed to load configuration: ${errorMessage}`, 'LOAD_ERROR');
    }
  }

  async initialize(): Promise<void> {
    // Load configuration based on current environment
    const env = process.env.NODE_ENV || 'development';
    const environment = env === 'production' ? 'prod' : env === 'test' ? 'test' : 'dev';
    await this.loadConfiguration(environment);
  }

  async shutdown(): Promise<void> {
    // Clean up any resources if needed
  }

  onRegister(): void {
    // Called when the service is registered with the registry
  }

  onUnregister(): void {
    // Called when the service is unregistered from the registry
  }
}
