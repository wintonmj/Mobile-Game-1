# Configuration Service API Documentation

## Version Information
- **Version**: v1.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team
- **Implementation**: Sprint 1

## Overview
The `ConfigurationService` is responsible for managing game configuration and settings. It provides a centralized system for handling game configuration, environment-specific settings, and runtime configuration management.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [TypeScript Standards](../standards/typescript.mdc)
- [Sprint 1 Implementation Plan](../../architecture/decisions/sprint1-implementation-plan.md)

## Core Interface

```typescript
import { 
  IGameService,
  ServiceError,
  ServiceThreadError,
  ServiceStateError,
  IEventBus,
  GameEventMap
} from './types';

/**
 * Service responsible for configuration management
 * @implements IGameService
 */
interface IConfigurationService extends IGameService {
  /**
   * Get a configuration value
   * @param key Configuration key using dot notation (e.g., 'game.width')
   * @param defaultValue Default value if key not found
   * @returns Configuration value or default
   */
  get<T>(key: string, defaultValue?: T): T;
  
  /**
   * Set a configuration value
   * @param key Configuration key using dot notation
   * @param value Value to set
   * @throws ConfigError if value cannot be set
   */
  set<T>(key: string, value: T): void;
  
  /**
   * Load configuration from a source
   * @param source Configuration source (object or file path)
   * @throws ConfigError if configuration cannot be loaded
   */
  load(source: ConfigSource): Promise<void>;
  
  /**
   * Get environment-specific configuration
   * @param env Environment name (e.g., 'development', 'production')
   * @returns Environment-specific configuration
   */
  getEnvConfig(env: string): Record<string, unknown>;
  
  /**
   * Validate configuration against schema
   * @param schema Configuration schema
   * @throws ConfigValidationError if validation fails
   */
  validate(schema: ConfigSchema): void;
}

/**
 * Configuration source type
 */
type ConfigSource = string | Record<string, unknown>;

/**
 * Configuration schema for validation
 */
interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: unknown;
    validate?: (value: unknown) => boolean;
  };
}

/**
 * Base error class for configuration-related errors
 */
class ConfigError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Error thrown when configuration validation fails
 */
class ConfigValidationError extends ConfigError {
  constructor(key: string, value: unknown, reason: string) {
    super(`Configuration validation failed for key "${key}": ${reason}`);
    this.name = 'ConfigValidationError';
    this.key = key;
    this.value = value;
    this.reason = reason;
  }
  
  key: string;
  value: unknown;
  reason: string;
}
```

## Usage Examples

### Basic Configuration Management
```typescript
class GameManager {
  private configService: IConfigurationService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.configService = registry.get<IConfigurationService>('config');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  async init(): Promise<void> {
    try {
      // Load base configuration
      await this.configService.load({
        game: {
          width: 800,
          height: 600,
          backgroundColor: 0x000000
        },
        debug: {
          enabled: false,
          showFPS: true
        }
      });
      
      // Load environment-specific configuration
      const envConfig = this.configService.getEnvConfig(process.env.NODE_ENV || 'development');
      await this.configService.load(envConfig);
      
      // Validate configuration
      this.configService.validate({
        'game.width': { type: 'number', required: true },
        'game.height': { type: 'number', required: true },
        'game.backgroundColor': { type: 'number', required: true },
        'debug.enabled': { type: 'boolean', default: false },
        'debug.showFPS': { type: 'boolean', default: true }
      });
      
      // Emit configuration loaded event
      this.eventBus.emit('config.loaded', {
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error('Configuration error:', error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
}
```

### Runtime Configuration Changes
```typescript
class SettingsManager {
  private configService: IConfigurationService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.configService = registry.get<IConfigurationService>('config');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  updateGraphicsSettings(quality: 'low' | 'medium' | 'high'): void {
    try {
      switch (quality) {
        case 'low':
          this.configService.set('graphics.particles.enabled', false);
          this.configService.set('graphics.shadows.enabled', false);
          break;
        case 'medium':
          this.configService.set('graphics.particles.enabled', true);
          this.configService.set('graphics.shadows.enabled', false);
          break;
        case 'high':
          this.configService.set('graphics.particles.enabled', true);
          this.configService.set('graphics.shadows.enabled', true);
          break;
      }
      
      // Emit settings changed event
      this.eventBus.emit('settings.changed', {
        category: 'graphics',
        quality,
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error('Failed to update graphics settings:', error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
}
```

## Implementation Checklist
1. **Configuration Management**
   - [ ] Implement configuration loading
   - [ ] Handle environment-specific configs
   - [ ] Support runtime configuration changes
   - [ ] Implement validation system

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Validate configuration values
   - [ ] Handle loading failures gracefully
   - [ ] Emit error events

3. **Event Communication**
   - [ ] Emit configuration change events
   - [ ] Handle error events
   - [ ] Clean up event listeners

4. **Performance**
   - [ ] Cache configuration values
   - [ ] Optimize validation
   - [ ] Handle large configurations

## Change History
- v1.0.0 (2024-03-31)
  - Initial implementation
  - Added configuration validation
  - Added environment-specific configuration
  - Added event system integration 