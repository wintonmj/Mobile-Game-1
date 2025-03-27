import fs from 'fs';
import { ConfigurationError, ConfigurationParseError } from '../utils/errors';
import { Service } from './Registry';

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface ConfigSchema {
  properties: Record<string, any>;
  required?: string[];
}

export type Environment = 'dev' | 'test' | 'prod';

export class ConfigurationService implements Service {
  private config: Record<string, any> = {};
  private currentEnvironment: Environment = 'dev';

  /**
   * Get a configuration value by key
   * @param key The configuration key (supports dot notation for nested values)
   * @param defaultValue Optional default value if the key doesn't exist
   * @returns The configuration value or the default value
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key);
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Set a configuration value
   * @param key The configuration key (supports dot notation for nested values)
   * @param value The value to set
   */
  set<T>(key: string, value: T): void {
    this.setNestedValue(this.config, key, value);
  }

  /**
   * Get a nested value from an object using dot notation
   * @param obj The object to traverse
   * @param path The dot-notation path
   * @returns The value at the path or undefined if not found
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, part) => {
      return current && typeof current === 'object' ? current[part] : undefined;
    }, obj);
  }

  /**
   * Set a nested value in an object using dot notation
   * @param obj The object to modify
   * @param path The dot-notation path
   * @param value The value to set
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;

    let current = obj;
    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
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
      console.log('Before fs.promises.readFile call');
      const configContent = await fs.promises.readFile(configPath, 'utf8');
      console.log('Successfully read file content:', configContent.substring(0, 50) + '...');

      try {
        const config = JSON.parse(configContent);
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
      if (error instanceof Error) {
        console.log('Error name:', error.name);
        console.log('Error message:', error.message);
        console.log('Error has code property:', 'code' in error);
        if ('code' in error) {
          console.log('Error code:', (error as any).code);
        }
      } else {
        // Convert non-Error objects to a more usable format
        error = new Error(String(error));
        console.log('Converted non-Error to Error:', error);
      }

      // If it's already a ConfigurationError, pass it through
      if (error instanceof ConfigurationError) {
        throw error;
      }

      // If it's a NodeJS.ErrnoException with ENOENT code, convert to ConfigurationError
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new ConfigurationError(`Configuration file not found: ${configPath}`, 'ENOENT');
      }

      // For any other error, wrap it in a ConfigurationError
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
