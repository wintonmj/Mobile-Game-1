# Configuration Service

## Problem Statement

Our mobile game architecture currently faces several challenges related to configuration management:

1. **Hardcoded configuration values** - Game settings, balance parameters, and feature flags are embedded directly in code
2. **Environment-specific configuration** - No clear way to handle different configurations for dev, test, and prod environments
3. **Lack of centralized configuration** - Configuration values are scattered throughout the codebase
4. **Difficulty in changing configuration** - Updating configurations requires code changes and redeployment
5. **No validation of configuration** - Configuration changes may introduce errors or inconsistencies
6. **Poor visibility into current configuration** - No easy way to view all current configuration values

## Role in Service Layer Architecture

The ConfigurationService is a **core infrastructure service** in our architecture that:

1. **Centralizes configuration** - Provides a single source of truth for all configuration values
2. **Supports multiple environments** - Handles different settings for dev, test, and prod
3. **Enables external configuration** - Allows loading configuration from files or remote sources
4. **Provides validation** - Ensures configuration values meet expected schemas and constraints
5. **Supports reactivity** - Enables components to react to configuration changes

The ConfigurationService will be implemented in **Phase 1** alongside the Registry and EventBus as it's a fundamental building block that other services will depend on for their configuration needs.

## Interface Definition

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface ConfigSchema {
  properties: Record<string, any>;
  required?: string[];
}

export interface IConfigurationService {
  // Core functionality
  loadConfiguration(environment: string): Promise<void>;
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  
  // Environment awareness
  getEnvironment(): 'dev' | 'test' | 'prod';
  isProduction(): boolean;
  isDevelopment(): boolean;
  isTestingEnvironment(): boolean;
  
  // External configuration
  loadFromFile(filePath: string): Promise<void>;
  saveToFile(filePath: string): Promise<void>;
  
  // Watching/reactivity
  watch<T>(key: string, callback: (newValue: T, oldValue: T) => void): () => void;
  
  // Schema validation
  validateConfig(schema: ConfigSchema): ValidationResult;
  registerSchema(schemaId: string, schema: ConfigSchema): void;
}
```

## Test-Driven Development Approach

### 1. Test Plan

We'll implement the ConfigurationService using TDD with these test categories:

1. **Core Functionality**
   - Test getting configuration values
   - Test setting configuration values
   - Test default values
   - Test nested configuration paths

2. **Environment Handling**
   - Test environment detection
   - Test environment-specific configuration loading
   - Test environment helper methods

3. **External Configuration**
   - Test loading from files
   - Test saving to files
   - Test handling invalid files/paths

4. **Reactive Configuration**
   - Test watching for configuration changes
   - Test unsubscribing from watchers
   - Test multiple watchers for the same key

5. **Schema Validation**
   - Test validating configuration against schemas
   - Test handling required properties
   - Test type validation

### 2. Sample Test Cases

```typescript
// __tests__/services/ConfigurationService.test.ts
import { ConfigurationService } from '../../services/ConfigurationService';
import * as fs from 'fs';
import * as path from 'path';

// Mock file system module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

describe('ConfigurationService', () => {
  let configService: ConfigurationService;
  
  beforeEach(() => {
    configService = new ConfigurationService();
    // Reset mock file system
    jest.clearAllMocks();
  });
  
  describe('Core Functionality', () => {
    test('should get configuration values', () => {
      // Arrange
      configService.set('game.difficulty', 'hard');
      
      // Act
      const difficulty = configService.get<string>('game.difficulty');
      
      // Assert
      expect(difficulty).toBe('hard');
    });
    
    test('should return default value when config not found', () => {
      // Act
      const value = configService.get<number>('nonexistent.key', 42);
      
      // Assert
      expect(value).toBe(42);
    });
    
    test('should handle nested configuration paths', () => {
      // Arrange
      configService.set('player.stats.health', 100);
      configService.set('player.stats.mana', 50);
      
      // Act
      const health = configService.get<number>('player.stats.health');
      const mana = configService.get<number>('player.stats.mana');
      
      // Assert
      expect(health).toBe(100);
      expect(mana).toBe(50);
    });
    
    test('should override existing values', () => {
      // Arrange
      configService.set('player.level', 1);
      
      // Act
      configService.set('player.level', 2);
      const level = configService.get<number>('player.level');
      
      // Assert
      expect(level).toBe(2);
    });
  });
  
  describe('Environment Handling', () => {
    test('should detect environment correctly', () => {
      // Arrange - mock process.env
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Act
      const isProd = configService.isProduction();
      const isDev = configService.isDevelopment();
      const isTest = configService.isTestingEnvironment();
      
      // Assert
      expect(isProd).toBe(true);
      expect(isDev).toBe(false);
      expect(isTest).toBe(false);
      
      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should load environment-specific configuration', async () => {
      // Arrange
      const mockConfig = {
        game: {
          difficulty: 'easy',
          maxPlayers: 4
        }
      };
      
      // Mock file system to return our config
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));
      
      // Act
      await configService.loadConfiguration('dev');
      
      // Assert
      expect(configService.get('game.difficulty')).toBe('easy');
      expect(configService.get('game.maxPlayers')).toBe(4);
      expect(configService.getEnvironment()).toBe('dev');
    });
  });
  
  describe('External Configuration', () => {
    test('should load configuration from file', async () => {
      // Arrange
      const mockConfig = {
        game: {
          levels: [1, 2, 3],
          playerSpeed: 5
        }
      };
      
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));
      
      // Act
      await configService.loadFromFile('config.json');
      
      // Assert
      expect(configService.get('game.levels')).toEqual([1, 2, 3]);
      expect(configService.get('game.playerSpeed')).toBe(5);
      expect(fs.promises.readFile).toHaveBeenCalledWith('config.json', 'utf8');
    });
    
    test('should save configuration to file', async () => {
      // Arrange
      configService.set('game.score', 1000);
      configService.set('player.name', 'TestPlayer');
      
      // Act
      await configService.saveToFile('save-config.json');
      
      // Assert
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'save-config.json',
        expect.any(String),
        'utf8'
      );
      
      // Verify the saved content contains our config
      const savedContent = (fs.promises.writeFile as jest.Mock).mock.calls[0][1];
      const parsedContent = JSON.parse(savedContent);
      expect(parsedContent.game.score).toBe(1000);
      expect(parsedContent.player.name).toBe('TestPlayer');
    });
    
    test('should handle file system errors', async () => {
      // Arrange
      const errorMessage = 'File not found';
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(configService.loadFromFile('nonexistent.json')).rejects.toThrow(errorMessage);
    });
  });
  
  describe('Reactive Configuration', () => {
    test('should notify watchers when values change', () => {
      // Arrange
      const callback = jest.fn();
      configService.set('game.score', 100);
      configService.watch('game.score', callback);
      
      // Act
      configService.set('game.score', 200);
      
      // Assert
      expect(callback).toHaveBeenCalledWith(200, 100);
    });
    
    test('should not notify watchers after unsubscribing', () => {
      // Arrange
      const callback = jest.fn();
      configService.set('game.score', 100);
      const unsubscribe = configService.watch('game.score', callback);
      
      // Act
      unsubscribe();
      configService.set('game.score', 200);
      
      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should support multiple watchers for the same key', () => {
      // Arrange
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      configService.set('player.health', 100);
      configService.watch('player.health', callback1);
      configService.watch('player.health', callback2);
      
      // Act
      configService.set('player.health', 80);
      
      // Assert
      expect(callback1).toHaveBeenCalledWith(80, 100);
      expect(callback2).toHaveBeenCalledWith(80, 100);
    });
  });
  
  describe('Schema Validation', () => {
    test('should validate configuration against schema', () => {
      // Arrange
      const playerSchema = {
        properties: {
          name: { type: 'string' },
          level: { type: 'number', minimum: 1 },
          inventory: { type: 'array' }
        },
        required: ['name', 'level']
      };
      
      configService.set('player.name', 'Hero');
      configService.set('player.level', 5);
      configService.set('player.inventory', ['sword', 'shield']);
      
      // Act
      const result = configService.validateConfig(playerSchema);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    test('should detect validation errors', () => {
      // Arrange
      const playerSchema = {
        properties: {
          name: { type: 'string' },
          level: { type: 'number', minimum: 1 }
        },
        required: ['name', 'level']
      };
      
      configService.set('player.name', 'Hero');
      // Missing required 'level' property
      
      // Act
      const result = configService.validateConfig(playerSchema);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing required property 'level'");
    });
    
    test('should register and retrieve schemas', () => {
      // Arrange
      const playerSchema = {
        properties: {
          name: { type: 'string' },
          level: { type: 'number' }
        },
        required: ['name']
      };
      
      // Act
      configService.registerSchema('player', playerSchema);
      configService.set('player.name', 'Hero');
      
      // Validate against registered schema
      const result = configService.validateConfig(playerSchema);
      
      // Assert
      expect(result.isValid).toBe(true);
    });
  });
});
```

### 3. Implementation Strategy

1. **Start with core functionality**
   - Implement basic configuration storage
   - Add getter and setter methods
   - Implement nested path access
   - Make tests pass with minimal implementation

2. **Add environment handling**
   - Implement environment detection
   - Add environment-specific configuration loading
   - Create helper methods for common environment checks

3. **Implement external configuration**
   - Add file loading and saving
   - Implement proper error handling
   - Support different file formats (JSON, YAML)

4. **Add reactive configuration**
   - Implement watcher registration
   - Add notification mechanism
   - Create unsubscribe functionality

5. **Add schema validation**
   - Implement basic validation logic
   - Add schema registration
   - Support common validation rules

### 4. Acceptance Criteria

The ConfigurationService implementation will be considered complete when:

1. All tests pass consistently
2. The interface is fully implemented
3. It correctly handles environment-specific configuration
4. It properly loads and saves configuration from external files
5. Configuration changes notify registered watchers
6. It validates configuration against registered schemas
7. Documentation is complete with usage examples

## Integration with Game Systems

The ConfigurationService will be used throughout our game to manage various configuration aspects:

### 1. Game Balance Configuration

```typescript
export class GameBalanceService {
  private configService: IConfigurationService;
  
  constructor(registry: IRegistry) {
    this.configService = registry.getService<IConfigurationService>('config');
    
    // Load environment-specific balance configuration
    this.loadBalanceConfig();
  }
  
  private async loadBalanceConfig(): Promise<void> {
    // Load balance settings based on current environment
    const env = this.configService.getEnvironment();
    await this.configService.loadFromFile(`assets/config/balance.${env}.json`);
    
    // Register schema for validation
    this.configService.registerSchema('balance', BALANCE_SCHEMA);
    
    // Validate loaded configuration
    const validation = this.configService.validateConfig(BALANCE_SCHEMA);
    if (!validation.isValid) {
      console.error('Invalid balance configuration:', validation.errors);
    }
  }
  
  public getEnemySpawnRate(difficulty: string): number {
    return this.configService.get<number>(`balance.enemySpawn.${difficulty}`, 1.0);
  }
  
  public getPlayerStartingStats(): PlayerStats {
    return this.configService.get<PlayerStats>('balance.player.startingStats', DEFAULT_PLAYER_STATS);
  }
  
  public getLevelUpRequirements(level: number): number {
    return this.configService.get<number>(`balance.player.levelUp.${level}`, level * 1000);
  }
}
```

### 2. Feature Flags

```typescript
export class FeatureFlagService {
  private configService: IConfigurationService;
  private eventBus: IEventBusService;
  
  constructor(registry: IRegistry) {
    this.configService = registry.getService<IConfigurationService>('config');
    this.eventBus = registry.getService<IEventBusService>('eventBus');
    
    this.loadFeatureFlags();
  }
  
  private async loadFeatureFlags(): Promise<void> {
    // Load feature flags based on environment
    const env = this.configService.getEnvironment();
    await this.configService.loadFromFile(`assets/config/features.${env}.json`);
    
    // Watch for feature flag changes and emit events when they change
    this.setupFeatureFlagWatchers();
  }
  
  private setupFeatureFlagWatchers(): void {
    // Get all feature flags
    const features = this.configService.get<Record<string, boolean>>('features', {});
    
    // Set up watchers for each feature
    Object.keys(features).forEach(featureKey => {
      this.configService.watch<boolean>(`features.${featureKey}`, (newValue, oldValue) => {
        if (newValue !== oldValue) {
          this.eventBus.emit('featureFlag.changed', { 
            feature: featureKey, 
            enabled: newValue,
            previous: oldValue
          });
        }
      });
    });
  }
  
  public isFeatureEnabled(featureKey: string): boolean {
    // Check if feature flag is enabled, defaulting to false for safety
    return this.configService.get<boolean>(`features.${featureKey}`, false);
  }
  
  public toggleFeature(featureKey: string): void {
    const currentValue = this.isFeatureEnabled(featureKey);
    this.configService.set(`features.${featureKey}`, !currentValue);
  }
}
```

### 3. User Preferences

```typescript
export class UserPreferencesService {
  private configService: IConfigurationService;
  private static readonly PREFS_FILE = 'user-preferences.json';
  
  constructor(registry: IRegistry) {
    this.configService = registry.getService<IConfigurationService>('config');
    
    // Load user preferences
    this.loadPreferences();
  }
  
  private async loadPreferences(): Promise<void> {
    try {
      await this.configService.loadFromFile(UserPreferencesService.PREFS_FILE);
    } catch (error) {
      // If no preferences file exists, use defaults
      this.resetToDefaults();
    }
  }
  
  public async savePreferences(): Promise<void> {
    try {
      await this.configService.saveToFile(UserPreferencesService.PREFS_FILE);
    } catch (error) {
      console.error('Failed to save preferences', error);
      throw error;
    }
  }
  
  public getAudioVolume(type: 'music' | 'sfx'): number {
    return this.configService.get<number>(`preferences.audio.${type}`, 0.5);
  }
  
  public setAudioVolume(type: 'music' | 'sfx', value: number): void {
    this.configService.set(`preferences.audio.${type}`, Math.max(0, Math.min(1, value)));
    // Save preferences after updating
    this.savePreferences();
  }
  
  public getControlSensitivity(): number {
    return this.configService.get<number>('preferences.controls.sensitivity', 1.0);
  }
  
  public setControlSensitivity(value: number): void {
    this.configService.set('preferences.controls.sensitivity', value);
    this.savePreferences();
  }
  
  public resetToDefaults(): void {
    const defaultPreferences = {
      audio: {
        music: 0.5,
        sfx: 0.7
      },
      controls: {
        sensitivity: 1.0,
        invertY: false
      },
      graphics: {
        quality: 'medium',
        particleEffects: true
      }
    };
    
    // Reset all preference values
    Object.keys(defaultPreferences).forEach(section => {
      this.configService.set(`preferences.${section}`, defaultPreferences[section]);
    });
    
    this.savePreferences();
  }
}
```

## Performance Considerations

1. **Caching**: Optimize frequent access to configuration values
2. **Lazy loading**: Load configuration files only when needed
3. **Memory usage**: Minimize duplication of configuration data
4. **Change detection**: Efficient tracking of configuration changes
5. **Schema validation**: Optimize validation for large configuration objects

## Key Benefits

1. **Centralized configuration**: Single source of truth for all configuration values
2. **Environment awareness**: Automatic handling of different environments
3. **External configuration**: Configuration changes without code modification
4. **Reactive updates**: Components can react to configuration changes
5. **Validation**: Prevents invalid configurations from breaking the game

## Migration Strategy

1. **Identify configuration values**: Find hardcoded values throughout the codebase
2. **Create configuration files**: Move values to environment-specific config files
3. **Implement service**: Create the ConfigurationService with core functionality
4. **Refactor incrementally**: Update one component at a time to use the service
5. **Add validation**: Create schemas for critical configuration sections
6. **Document patterns**: Create clear documentation on configuration usage patterns 