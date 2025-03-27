/// <reference types="jest" />

import { jest } from '@jest/globals';
import { ConfigurationService } from '../../services/ConfigurationService';
import { ConfigurationError, ConfigurationParseError } from '../../utils/errors';
import { fsMock } from '../mocks/fs';

describe('ConfigurationService', () => {
  let configService: ConfigurationService;

  beforeEach(() => {
    configService = new ConfigurationService();
    fsMock.clearFiles();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fsMock.restore();
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
    const originalEnv = process.env.NODE_ENV;
    const mockProdConfig = {
      game: {
        difficulty: 'hard',
        maxPlayers: 8,
      },
    };
    const mockDevConfig = {
      game: {
        difficulty: 'easy',
        maxPlayers: 4,
      },
    };
    const mockTestConfig = {
      game: {
        difficulty: 'medium',
        maxPlayers: 2,
      },
    };

    beforeEach(() => {
      // Reset environment before each test
      process.env.NODE_ENV = originalEnv;
    });

    afterEach(() => {
      // Restore environment after each test
      process.env.NODE_ENV = originalEnv;
    });

    test('should detect environment correctly', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      fsMock.createConfigFile('prod', mockProdConfig);

      // Act
      await configService.loadConfiguration('prod');

      const isProd = configService.isProduction();
      const isDev = configService.isDevelopment();
      const isTest = configService.isTestingEnvironment();

      // Assert
      expect(isProd).toBe(true);
      expect(isDev).toBe(false);
      expect(isTest).toBe(false);
    });

    test('should load environment-specific configuration', async () => {
      // Arrange
      fsMock.createConfigFile('dev', mockDevConfig);

      // Act
      await configService.loadConfiguration('dev');

      // Assert
      expect(configService.get('game.difficulty')).toBe('easy');
      expect(configService.get('game.maxPlayers')).toBe(4);
      expect(configService.getEnvironment()).toBe('dev');
    });

    test('should handle missing configuration file', async () => {
      // Arrange - ensure no config file exists
      fsMock.ensureConfigFileMissing('dev');

      // Act & Assert
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(/Configuration file not found/);
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(ConfigurationError);
    });

    test('should handle invalid JSON in configuration file', async () => {
      // Arrange
      fsMock.createInvalidConfigFile('dev');

      // Act & Assert
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(/Failed to parse configuration file/);
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(ConfigurationParseError);
    });

    test('should load configuration for multiple environments', async () => {
      // Arrange
      fsMock.createConfigFiles({
        dev: mockDevConfig,
        test: mockTestConfig,
        prod: mockProdConfig
      });

      // Act - Load dev configuration
      await configService.loadConfiguration('dev');
      expect(configService.get('game.difficulty')).toBe('easy');
      
      // Switch to test environment
      await configService.loadConfiguration('test');
      expect(configService.get('game.difficulty')).toBe('medium');
      
      // Switch to prod environment
      await configService.loadConfiguration('prod');
      expect(configService.get('game.difficulty')).toBe('hard');
    });

    test('should handle permission errors when accessing configuration files', async () => {
      // Arrange
      fsMock.createInaccessibleConfigFile('dev');

      // Act & Assert
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(ConfigurationError);
    });
  });
});
