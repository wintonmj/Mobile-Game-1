import { jest } from '@jest/globals';
// First import the mock to ensure it's set up
import { fsMock } from '../mocks/fs';
// Then import the services
import { Registry, Service } from '../../services/Registry';
import { ConfigurationService } from '../../services/ConfigurationService';
import { ILoggerService } from '../../services/interfaces/ILoggerService';

// Force requiring the modules to use the mocked version
jest.mock('fs');

interface TestService extends Service {
  name: string;
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  onRegister?: () => void;
  onUnregister?: () => void;
}

// Mock logger service
class MockLoggerService implements ILoggerService, Service {
  log(message: string): void {}
  error(message: string): void {}
  warn(message: string): void {}
  debug(message: string): void {}

  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
  onRegister(): void {}
  onUnregister(): void {}
}

describe('Registry', () => {
  let registry: Registry;
  let configService: ConfigurationService;
  let loggerService: MockLoggerService;

  beforeEach(() => {
    registry = new Registry();
    configService = new ConfigurationService();
    loggerService = new MockLoggerService();
    // Initialize empty mock filesystem
    fsMock.clearFiles();
  });

  afterEach(() => {
    // Restore real filesystem after each test
    fsMock.restore();
  });

  describe('Service Dependencies', () => {
    test('should register service dependencies', () => {
      const serviceA: TestService = { name: 'ServiceA' };
      const serviceB: TestService = { name: 'ServiceB' };

      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);

      const dependencies = registry.getServiceDependencies('serviceB');
      expect(dependencies).toEqual(['serviceA']);
    });

    test('should throw when registering dependencies for non-existent service', () => {
      expect(() => {
        registry.registerDependencies('nonExistentService', ['serviceA']);
      }).toThrow('Service not found: nonExistentService');
    });

    test('should throw when registering non-existent dependency', () => {
      const serviceA: TestService = { name: 'ServiceA' };
      registry.registerService('serviceA', serviceA);

      expect(() => {
        registry.registerDependencies('serviceA', ['nonExistentService']);
      }).toThrow('Dependency not found: nonExistentService');
    });

    test('should detect circular dependencies', () => {
      const serviceA: TestService = { name: 'ServiceA' };
      const serviceB: TestService = { name: 'ServiceB' };

      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);

      registry.registerDependencies('serviceA', ['serviceB']);
      registry.registerDependencies('serviceB', ['serviceA']);

      expect(async () => {
        await registry.initialize();
      }).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('Service Initialization', () => {
    test('should initialize services in dependency order', async () => {
      const initOrder: string[] = [];

      const serviceA: TestService = {
        name: 'ServiceA',
        initialize: async () => {
          initOrder.push('ServiceA');
        },
      };

      const serviceB: TestService = {
        name: 'ServiceB',
        initialize: async () => {
          initOrder.push('ServiceB');
        },
      };

      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);

      await registry.initialize();

      expect(initOrder).toEqual(['ServiceA', 'ServiceB']);
    });

    test('should handle initialization errors gracefully', async () => {
      const serviceA: TestService = {
        name: 'ServiceA',
        initialize: async () => {
          throw new Error('Initialization failed');
        },
      };

      registry.registerService('serviceA', serviceA);

      await expect(registry.initialize()).rejects.toThrow('Initialization failed');
    });

    test('should initialize services with multiple dependencies', async () => {
      const initOrder: string[] = [];

      const serviceA: TestService = {
        name: 'ServiceA',
        initialize: async () => {
          initOrder.push('ServiceA');
        },
      };

      const serviceB: TestService = {
        name: 'ServiceB',
        initialize: async () => {
          initOrder.push('ServiceB');
        },
      };

      const serviceC: TestService = {
        name: 'ServiceC',
        initialize: async () => {
          initOrder.push('ServiceC');
        },
      };

      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerService('serviceC', serviceC);

      registry.registerDependencies('serviceB', ['serviceA']);
      registry.registerDependencies('serviceC', ['serviceA', 'serviceB']);

      await registry.initialize();

      expect(initOrder).toEqual(['ServiceA', 'ServiceB', 'ServiceC']);
    });
  });

  describe('Service Shutdown', () => {
    test('should shutdown services in reverse dependency order', async () => {
      const shutdownOrder: string[] = [];

      const serviceA: TestService = {
        name: 'ServiceA',
        shutdown: async () => {
          shutdownOrder.push('ServiceA');
        },
      };

      const serviceB: TestService = {
        name: 'ServiceB',
        shutdown: async () => {
          shutdownOrder.push('ServiceB');
        },
      };

      registry.registerService('serviceA', serviceA);
      registry.registerService('serviceB', serviceB);
      registry.registerDependencies('serviceB', ['serviceA']);

      await registry.initialize();
      await registry.shutdown();

      expect(shutdownOrder).toEqual(['ServiceB', 'ServiceA']);
    });

    test('should handle shutdown errors gracefully', async () => {
      const serviceA: TestService = {
        name: 'ServiceA',
        shutdown: async () => {
          throw new Error('Shutdown failed');
        },
      };

      registry.registerService('serviceA', serviceA);

      await registry.initialize();
      await expect(registry.shutdown()).rejects.toThrow('Shutdown failed');
    });
  });

  describe('Service Lifecycle Hooks', () => {
    test('should call onRegister when registering a service', () => {
      const onRegisterSpy = jest.fn();
      const service: TestService = {
        name: 'TestService',
        onRegister: onRegisterSpy,
      };

      registry.registerService('testService', service);
      expect(onRegisterSpy).toHaveBeenCalled();
    });

    test('should call onUnregister when unregistering a service', () => {
      const onUnregisterSpy = jest.fn();
      const service: TestService = {
        name: 'TestService',
        onUnregister: onUnregisterSpy,
      };

      registry.registerService('testService', service);
      registry.unregisterService('testService');
      expect(onUnregisterSpy).toHaveBeenCalled();
    });

    test('should call onUnregister when clearing all services', () => {
      const onUnregisterSpy1 = jest.fn();
      const onUnregisterSpy2 = jest.fn();

      const service1: TestService = {
        name: 'Service1',
        onUnregister: onUnregisterSpy1,
      };

      const service2: TestService = {
        name: 'Service2',
        onUnregister: onUnregisterSpy2,
      };

      registry.registerService('service1', service1);
      registry.registerService('service2', service2);
      registry.clear();

      expect(onUnregisterSpy1).toHaveBeenCalled();
      expect(onUnregisterSpy2).toHaveBeenCalled();
    });

    test('should handle missing lifecycle hooks gracefully', () => {
      const service: TestService = {
        name: 'TestService',
      };

      expect(() => {
        registry.registerService('testService', service);
      }).not.toThrow();

      expect(() => {
        registry.unregisterService('testService');
      }).not.toThrow();
    });
  });

  describe('Environment Handling', () => {
    const originalEnv = process.env.NODE_ENV;
    const mockConfig = {
      game: {
        difficulty: 'easy',
        maxPlayers: 4,
      },
    };

    // Create a spy on the ConfigurationService to intercept loadConfiguration
    let loadConfigSpy: any;

    beforeEach(() => {
      // Reset environment before each test
      process.env.NODE_ENV = originalEnv;
      
      // Clear any previous mocks
      fsMock.clearFiles();
      
      // Create the spy
      loadConfigSpy = jest.spyOn(ConfigurationService.prototype, 'loadConfiguration');
      
      // Override loadConfiguration to bypass file system access
      loadConfigSpy.mockImplementation(async function(this: ConfigurationService, environment: any) {
        // Update the environment
        (this as any).currentEnvironment = environment;
        
        // Set some mock config data directly
        (this as any).config = {
          game: {
            difficulty: environment === 'prod' ? 'hard' : environment === 'test' ? 'medium' : 'easy',
            maxPlayers: environment === 'prod' ? 8 : environment === 'test' ? 2 : 4
          }
        };
        
        console.log(`Mock loadConfiguration called for environment: ${environment}`);
        console.log(`Mock config set:`, (this as any).config);
        
        return Promise.resolve();
      });
    });

    afterEach(() => {
      // Restore environment after each test
      process.env.NODE_ENV = originalEnv;
      
      // Restore the original method
      loadConfigSpy.mockRestore();
    });

    test('should initialize services with correct environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      registry.registerService('config', configService);
      registry.registerService('logger', loggerService);

      // Act
      await registry.initialize();

      // Assert
      expect(configService.getEnvironment()).toBe('dev');
      expect(loadConfigSpy).toHaveBeenCalledWith('dev');
    });

    test('should handle environment changes during runtime', async () => {
      // Arrange
      registry.registerService('config', configService);
      registry.registerService('logger', loggerService);
      await registry.initialize();

      // Act
      process.env.NODE_ENV = 'production';
      await configService.loadConfiguration('prod');

      // Assert
      expect(configService.getEnvironment()).toBe('prod');
      expect(configService.isProduction()).toBe(true);
      expect(loadConfigSpy).toHaveBeenCalledWith('prod');
    });

    test('should maintain service dependencies across environment changes', async () => {
      // Arrange
      registry.registerService('config', configService);
      registry.registerService('logger', loggerService);
      registry.registerDependencies('logger', ['config']);
      await registry.initialize();

      // Act
      process.env.NODE_ENV = 'test';
      await configService.loadConfiguration('test');

      // Assert
      expect(registry.getServiceDependencies('logger')).toContain('config');
      expect(configService.getEnvironment()).toBe('test');
      expect(loadConfigSpy).toHaveBeenCalledWith('test');
    });

    test('should handle environment-specific service initialization', async () => {
      // Arrange
      const mockInitialize = jest.fn().mockImplementation(async (): Promise<void> => {
        const config = registry.getService<ConfigurationService>('config');
        if (config.isProduction()) {
          // Production-specific initialization
          return Promise.resolve();
        }
        // Development-specific initialization
        return Promise.resolve();
      });

      const envSpecificService: Service = {
        initialize: mockInitialize as () => Promise<void>,
        shutdown: async () => {},
        onRegister: () => {},
        onUnregister: () => {},
      };

      registry.registerService('config', configService);
      registry.registerService('envSpecific', envSpecificService);
      registry.registerDependencies('envSpecific', ['config']);

      // Act
      process.env.NODE_ENV = 'production';
      await registry.initialize();

      // Assert
      expect(mockInitialize).toHaveBeenCalled();
      expect(configService.isProduction()).toBe(true);
      expect(loadConfigSpy).toHaveBeenCalledWith('prod');
    });
  });
});
