/**
 * Core service interface that all game services must implement
 * Provides lifecycle management for initialization and cleanup
 */
export interface IGameService {
  /**
   * Initialize the service
   * Should handle any setup, resource allocation, and state initialization
   */
  init(): Promise<void>;

  /**
   * Clean up the service
   * Should handle resource cleanup, event unsubscription, and state cleanup
   */
  destroy(): void;
} 