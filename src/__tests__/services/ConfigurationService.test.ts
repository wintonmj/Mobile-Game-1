/// <reference types="jest" />

import { jest } from '@jest/globals';
import { ConfigurationService } from '../../services/ConfigurationService';
import { ConfigurationError, ConfigurationParseError } from '../../utils/errors';
import { fsMock } from '../mocks/fs';

// We don't need to mock fs here as it's already mocked in the fs.ts mock file

describe('ConfigurationService', () => {
  let configService: ConfigurationService;

  beforeEach(() => {
    configService = new ConfigurationService();
    fsMock.clearFiles();
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
      fsMock.setFileContent('config.prod.json', JSON.stringify(mockProdConfig));

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
      fsMock.setFileContent('config.dev.json', JSON.stringify(mockDevConfig));

      // Act
      await configService.loadConfiguration('dev');

      // Assert
      expect(configService.get('game.difficulty')).toBe('easy');
      expect(configService.get('game.maxPlayers')).toBe(4);
      expect(configService.getEnvironment()).toBe('dev');
    });

    test('should handle missing configuration file', async () => {
      // Arrange - ensure no files are set up
      fsMock.clearFiles();

      // Act & Assert
      // The mock will throw an ENOENT error which should be converted to a ConfigurationError
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(/Configuration file not found/);
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(ConfigurationError);
    });

    test('should handle invalid JSON in configuration file', async () => {
      // Arrange
      fsMock.setFileContent('config.dev.json', 'invalid json');

      // Act & Assert
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(/Failed to parse configuration file/);
      await expect(configService.loadConfiguration('dev')).rejects.toThrow(ConfigurationParseError);
    });
  });
});
