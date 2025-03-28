import { IEventBusService, Subscription } from './interfaces/IEventBusService';

/**
 * Base interface for all services registered in the Registry
 */
interface Service {
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  onRegister?: () => void;
  onUnregister?: () => void;
}

/**
 * Type for callback functions that handle event data
 */
type EventCallback<T = unknown> = (data?: T) => void;

/**
 * Represents a subscription to an event.
 * Provides a method to unsubscribe from the event.
 */
class EventSubscription implements Subscription {
  constructor(
    private eventBus: EventBusService,
    private event: string,
    private callback: EventCallback
  ) {}

  unsubscribe(): void {
    this.eventBus.off(this.event, this.callback);
  }
}

/**
 * Implementation of the EventBusService interface.
 * Provides a centralized event system for decoupled component communication.
 */
export class EventBusService implements IEventBusService, Service {
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private loggingEnabled = false;

  /**
   * Lifecycle method called when the service is registered
   */
  onRegister(): void {
    if (this.loggingEnabled) {
      console.log('[EventBus] Service registered');
    }
  }

  /**
   * Lifecycle method called when the service is unregistered
   */
  onUnregister(): void {
    this.clearAllEvents();
    if (this.loggingEnabled) {
      console.log('[EventBus] Service unregistered');
    }
  }

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
      this.notifySubscribers<T>(subscribers, data);
    }

    // Handle wildcard subscribers (e.g., 'player.*' should receive 'player.move')
    const parts = event.split('.');
    while (parts.length > 0) {
      parts.pop();
      const wildcardEvent = parts.length > 0 ? `${parts.join('.')}.*` : '*';
      const wildcardSubscribers = this.subscribers.get(wildcardEvent);

      if (wildcardSubscribers) {
        this.notifySubscribers<T>(wildcardSubscribers, data);
      }
    }
  }

  /**
   * Subscribes to an event with a callback function.
   * @param event The event name
   * @param callback The function to call when the event is emitted
   * @returns A subscription object that can be used to unsubscribe
   */
  on<T>(event: string, callback: EventCallback<T>): Subscription {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    const subscribers = this.subscribers.get(event)!;
    subscribers.add(callback as EventCallback);

    if (this.loggingEnabled) {
      console.log(`[EventBus] Subscribed to: ${event}, count: ${subscribers.size}`);
    }

    return new EventSubscription(this, event, callback as EventCallback);
  }

  /**
   * Unsubscribes a callback from an event.
   * @param event The event name
   * @param callback The callback function to remove
   */
  off<T>(event: string, callback: EventCallback<T>): void {
    const subscribers = this.subscribers.get(event);
    if (!subscribers) return;

    subscribers.delete(callback as EventCallback);

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
  once<T>(event: string, callback: EventCallback<T>): Subscription {
    const wrappedCallback = (data?: T) => {
      // Automatically unsubscribe after first call
      this.off(event, wrappedCallback as EventCallback);
      callback(data);
    };

    return this.on<T>(event, wrappedCallback);
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
  private notifySubscribers<T>(subscribers: Set<EventCallback>, data?: T): void {
    subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[EventBus] Error in subscriber callback:', error);
      }
    });
  }
}
