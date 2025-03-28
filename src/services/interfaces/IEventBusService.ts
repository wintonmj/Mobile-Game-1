/**
 * Interface for subscription objects returned by event registration methods.
 */
export interface Subscription {
  unsubscribe(): void;
}

/**
 * Interface for the EventBusService which provides a centralized 
 * event handling system for decoupled component communication.
 */
export interface IEventBusService {
  // Core event methods
  emit<T>(event: string, data?: T): void;
  on<T>(event: string, callback: (data?: T) => void): Subscription;
  off(event: string, callback: Function): void;
  once<T>(event: string, callback: (data?: T) => void): Subscription;
  
  // Utility methods
  getEventNames(): string[];
  clearAllEvents(): void;
  
  // Debugging helpers
  enableLogging(enabled: boolean): void;
  getSubscriberCount(event: string): number;
} 