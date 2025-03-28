import { IEventBusService, Subscription } from './interfaces/IEventBusService';

/**
 * Represents a subscription to an event.
 * Provides a method to unsubscribe from the event.
 */
class EventSubscription implements Subscription {
  constructor(
    private eventBus: EventBusService,
    private event: string,
    private callback: Function
  ) {}

  unsubscribe(): void {
    this.eventBus.off(this.event, this.callback);
  }
}

/**
 * Implementation of the EventBusService interface.
 * Provides a centralized event system for decoupled component communication.
 */
export class EventBusService implements IEventBusService {
  private subscribers: Map<string, Set<Function>> = new Map();
  private loggingEnabled = false;

  /**
   * Emits an event with optional data to all subscribers.
   * @param event The event name
   * @param data Optional data to pass to subscribers
   */
  emit<T>(event: string, data?: T): void {
    if (this.loggingEnabled) {
      console.log(`[EventBus] Emitting: ${event}`, data);
    }

    // Handle direct subscribers
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      this.notifySubscribers(subscribers, data);
    }

    // Handle wildcard subscribers (e.g., 'player.*' should receive 'player.move')
    const parts = event.split('.');
    while (parts.length > 0) {
      parts.pop();
      const wildcardEvent = parts.length > 0 ? `${parts.join('.')}.*` : '*';
      const wildcardSubscribers = this.subscribers.get(wildcardEvent);
      
      if (wildcardSubscribers) {
        this.notifySubscribers(wildcardSubscribers, data);
      }
    }
  }

  /**
   * Subscribes to an event with a callback function.
   * @param event The event name
   * @param callback The function to call when the event is emitted
   * @returns A subscription object that can be used to unsubscribe
   */
  on<T>(event: string, callback: (data?: T) => void): Subscription {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    const subscribers = this.subscribers.get(event)!;
    subscribers.add(callback);

    if (this.loggingEnabled) {
      console.log(`[EventBus] Subscribed to: ${event}, count: ${subscribers.size}`);
    }

    return new EventSubscription(this, event, callback);
  }

  /**
   * Unsubscribes a callback from an event.
   * @param event The event name
   * @param callback The callback function to remove
   */
  off(event: string, callback: Function): void {
    const subscribers = this.subscribers.get(event);
    if (!subscribers) return;

    subscribers.delete(callback);
    
    if (subscribers.size === 0) {
      this.subscribers.delete(event);
    }

    if (this.loggingEnabled) {
      console.log(`[EventBus] Unsubscribed from: ${event}, remaining: ${subscribers.size}`);
    }
  }

  /**
   * Subscribes to an event, but only triggers the callback once.
   * @param event The event name
   * @param callback The function to call when the event is emitted
   * @returns A subscription object that can be used to unsubscribe
   */
  once<T>(event: string, callback: (data?: T) => void): Subscription {
    const wrappedCallback = ((data?: T) => {
      // Automatically unsubscribe after first call
      this.off(event, wrappedCallback);
      callback(data);
    }) as any;

    return this.on(event, wrappedCallback);
  }

  /**
   * Gets all event names that have subscribers.
   * @returns An array of event names
   */
  getEventNames(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Removes all event subscriptions.
   */
  clearAllEvents(): void {
    this.subscribers.clear();
    
    if (this.loggingEnabled) {
      console.log('[EventBus] All events cleared');
    }
  }

  /**
   * Enables or disables event logging.
   * @param enabled Whether logging should be enabled
   */
  enableLogging(enabled: boolean): void {
    this.loggingEnabled = enabled;
    console.log(`[EventBus] Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Gets the number of subscribers for an event.
   * @param event The event name
   * @returns The number of subscribers
   */
  getSubscriberCount(event: string): number {
    const subscribers = this.subscribers.get(event);
    return subscribers ? subscribers.size : 0;
  }

  /**
   * Notifies all subscribers of an event.
   * @param subscribers The set of subscriber callbacks
   * @param data The data to pass to subscribers
   */
  private notifySubscribers<T>(subscribers: Set<Function>, data?: T): void {
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[EventBus] Error in subscriber callback:', error);
      }
    });
  }
} 