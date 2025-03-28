import { jest } from '@jest/globals';
import { EventBusService } from '../../services/EventBusService';

describe('EventBusService', () => {
  let eventBus: EventBusService;
  
  beforeEach(() => {
    eventBus = new EventBusService();
  });
  
  describe('Basic Event Operations', () => {
    test('should allow subscribing to events', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      // Act
      eventBus.on(eventName, callback);
      
      // Assert
      expect(eventBus.getSubscriberCount(eventName)).toBe(1);
    });
    
    test('should trigger callbacks when events are emitted', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      const payload = { test: 'data' };
      
      eventBus.on(eventName, callback);
      
      // Act
      eventBus.emit(eventName, payload);
      
      // Assert
      expect(callback).toHaveBeenCalledWith(payload);
    });
    
    test('should stop receiving events after unsubscribing', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      const subscription = eventBus.on(eventName, callback);
      
      // Act - unsubscribe and emit
      subscription.unsubscribe();
      eventBus.emit(eventName, {});
      
      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
    
    test('should receive event only once with once()', () => {
      // Arrange
      const callback = jest.fn();
      const eventName = 'test.event';
      
      eventBus.once(eventName, callback);
      
      // Act - emit twice
      eventBus.emit(eventName, { count: 1 });
      eventBus.emit(eventName, { count: 2 });
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ count: 1 });
    });
  });
  
  describe('Event Patterns', () => {
    test('should support wildcard event subscriptions', () => {
      // Arrange
      const callback = jest.fn();
      
      // Act
      eventBus.on('player.*', callback);
      eventBus.emit('player.move', { x: 10, y: 20 });
      eventBus.emit('player.attack', { target: 'enemy' });
      eventBus.emit('enemy.move', { x: 5, y: 5 }); // Should not trigger callback
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(2);
    });
    
    test('should support hierarchical event names', () => {
      // Arrange
      const rootCallback = jest.fn();
      const specificCallback = jest.fn();
      
      // Act
      eventBus.on('game', rootCallback);
      eventBus.on('game.level.complete', specificCallback);
      
      eventBus.emit('game', { status: 'running' });
      eventBus.emit('game.level.complete', { level: 1 });
      
      // Assert
      expect(rootCallback).toHaveBeenCalledTimes(1);
      expect(specificCallback).toHaveBeenCalledTimes(1);
    });
    
    test('should handle edge cases in wildcard subscriptions', () => {
      // Arrange
      const rootWildcardCallback = jest.fn();
      const noEventCallback = jest.fn();
      
      // Act
      eventBus.on('*', rootWildcardCallback);
      eventBus.on('nonexistent.event', noEventCallback);
      
      eventBus.emit('any.event', { data: 'test' });
      
      // Assert
      expect(rootWildcardCallback).toHaveBeenCalledTimes(1);
      expect(noEventCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    test('should continue processing other subscribers if one throws an error', () => {
      // Arrange
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const successCallback = jest.fn();
      const eventName = 'error.test';
      
      console.error = jest.fn(); // Mock console.error
      
      // Act
      eventBus.on(eventName, errorCallback);
      eventBus.on(eventName, successCallback);
      eventBus.emit(eventName);
      
      // Assert
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('Debugging', () => {
    test('should list all event names', () => {
      // Arrange
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      eventBus.on('event3', () => {});
      
      // Act
      const eventNames = eventBus.getEventNames();
      
      // Assert
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toContain('event3');
      expect(eventNames.length).toBe(3);
    });
    
    test('should count subscribers correctly', () => {
      // Arrange
      const event = 'counting.test';
      
      eventBus.on(event, () => {});
      eventBus.on(event, () => {});
      const sub = eventBus.on(event, () => {});
      
      // Act & Assert
      expect(eventBus.getSubscriberCount(event)).toBe(3);
      
      // Remove one
      sub.unsubscribe();
      expect(eventBus.getSubscriberCount(event)).toBe(2);
    });
    
    test('should clear all events', () => {
      // Arrange
      eventBus.on('event1', () => {});
      eventBus.on('event2', () => {});
      
      // Act
      eventBus.clearAllEvents();
      
      // Assert
      expect(eventBus.getEventNames().length).toBe(0);
      expect(eventBus.getSubscriberCount('event1')).toBe(0);
    });
  });
  
  describe('Performance', () => {
    test('should handle many subscribers efficiently', () => {
      // Arrange
      const event = 'perf.test';
      const subscribers = 1000;
      let callCount = 0;
      
      // Add many subscribers
      for (let i = 0; i < subscribers; i++) {
        eventBus.on(event, () => { callCount++; });
      }
      
      // Act
      const startTime = performance.now();
      eventBus.emit(event);
      const endTime = performance.now();
      
      // Assert
      expect(callCount).toBe(subscribers);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
    
    test('should handle high frequency events efficiently', () => {
      // Arrange
      const event = 'highfreq.test';
      const emitCount = 1000;
      const callback = jest.fn();
      
      eventBus.on(event, callback);
      
      // Act
      const startTime = performance.now();
      for (let i = 0; i < emitCount; i++) {
        eventBus.emit(event, { count: i });
      }
      const endTime = performance.now();
      
      // Assert
      expect(callback).toHaveBeenCalledTimes(emitCount);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
}); 