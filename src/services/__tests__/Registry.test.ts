import { Registry } from '../Registry';
import { ILoggerService } from '../interfaces/ILoggerService';
import { MockLoggerService } from '../../__tests__/mocks/services/MockLoggerService';

describe('Registry', () => {
  let registry: Registry;
  
  beforeEach(() => {
    registry = new Registry();
  });
  
  describe('Service Registration and Retrieval', () => {
    test('should register and retrieve a service', () => {
      // Arrange
      const loggerService = new MockLoggerService();
      
      // Act
      registry.registerService('logger', loggerService);
      const retrievedService = registry.getService<ILoggerService>('logger');
      
      // Assert
      expect(retrievedService).toBe(loggerService);
    });
    
    test('should throw error when getting non-existent service', () => {
      // Act & Assert
      expect(() => {
        registry.getService<ILoggerService>('nonExistentService');
      }).toThrow('Service not found: nonExistentService');
    });
    
    test('should check if service exists', () => {
      // Arrange
      const loggerService = new MockLoggerService();
      
      // Act
      registry.registerService('logger', loggerService);
      
      // Assert
      expect(registry.hasService('logger')).toBe(true);
      expect(registry.hasService('nonExistentService')).toBe(false);
    });
  });

  describe('Service Lifecycle Management', () => {
    test('should unregister a service', () => {
      // Arrange
      const loggerService = new MockLoggerService();
      registry.registerService('logger', loggerService);

      // Act
      registry.unregisterService('logger');

      // Assert
      expect(registry.hasService('logger')).toBe(false);
    });

    test('should clear all services', () => {
      // Arrange
      const loggerService1 = new MockLoggerService();
      const loggerService2 = new MockLoggerService();
      registry.registerService('logger1', loggerService1);
      registry.registerService('logger2', loggerService2);

      // Act
      registry.clear();

      // Assert
      expect(registry.hasService('logger1')).toBe(false);
      expect(registry.hasService('logger2')).toBe(false);
    });

    test('should replace existing service', () => {
      // Arrange
      const originalService = new MockLoggerService();
      const newService = new MockLoggerService();
      registry.registerService('logger', originalService);

      // Act
      registry.registerService('logger', newService);
      const retrievedService = registry.getService<ILoggerService>('logger');

      // Assert
      expect(retrievedService).toBe(newService);
      expect(retrievedService).not.toBe(originalService);
    });
  });
}); 