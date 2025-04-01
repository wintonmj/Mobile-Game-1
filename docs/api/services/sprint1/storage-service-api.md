# Storage Service API Documentation

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team

## Overview
The `StorageService` is responsible for managing persistent data storage in the game. It provides a consistent interface for saving, loading, and managing game data across browser sessions.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [TypeScript Standards](../standards/typescript.mdc)

## Core Interface

```typescript
import { 
  IGameService,
  ServiceError,
  ServiceThreadError,
  ServiceStateError,
  IEventBus,
  GameEventMap
} from './types';

/**
 * Service responsible for data persistence
 * @implements IGameService
 */
interface IStorageService extends IGameService {
  /**
   * Save data to persistent storage
   * @param key Storage key
   * @param data Data to store (must be JSON serializable)
   * @returns Promise that resolves when data is saved
   * @throws StorageError if data cannot be saved
   */
  save<T>(key: string, data: T): Promise<void>;
  
  /**
   * Load data from persistent storage
   * @param key Storage key
   * @param defaultValue Default value if key not found
   * @returns Promise that resolves with loaded data
   * @throws StorageError if data cannot be loaded
   */
  load<T>(key: string, defaultValue?: T): Promise<T>;
  
  /**
   * Remove data from persistent storage
   * @param key Storage key to remove
   * @returns Promise that resolves when data is removed
   * @throws StorageError if data cannot be removed
   */
  remove(key: string): Promise<void>;
  
  /**
   * Clear all stored data
   * @returns Promise that resolves when all data is cleared
   * @throws StorageError if data cannot be cleared
   */
  clear(): Promise<void>;
  
  /**
   * Check if a key exists in storage
   * @param key Storage key to check
   * @returns Promise that resolves with boolean indicating existence
   */
  has(key: string): Promise<boolean>;
}

/**
 * Base error class for storage-related errors
 */
class StorageError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Error thrown when data cannot be saved to storage
 */
class StorageSaveError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Failed to save data with key: ${key}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'StorageSaveError';
    this.cause = cause;
    this.key = key;
  }
  
  cause?: Error;
  key: string;
}

/**
 * Error thrown when data cannot be loaded from storage
 */
class StorageLoadError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Failed to load data with key: ${key}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'StorageLoadError';
    this.cause = cause;
    this.key = key;
  }
  
  cause?: Error;
  key: string;
}

/**
 * Error thrown when storage quota is exceeded
 */
class StorageQuotaExceededError extends StorageError {
  constructor(key: string, dataSize: number, availableSpace: number) {
    super(`Storage quota exceeded when saving key: ${key}. Data size: ${dataSize} bytes, Available: ${availableSpace} bytes`);
    this.name = 'StorageQuotaExceededError';
    this.key = key;
    this.dataSize = dataSize;
    this.availableSpace = availableSpace;
  }
  
  key: string;
  dataSize: number;
  availableSpace: number;
}

/**
 * Error thrown when corrupted data is detected
 */
class StorageCorruptedDataError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Corrupted data detected for key: ${key}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'StorageCorruptedDataError';
    this.cause = cause;
    this.key = key;
  }
  
  cause?: Error;
  key: string;
}

/**
 * Error thrown when a storage operation fails due to browser compatibility issues
 */
class StorageCompatibilityError extends StorageError {
  constructor(feature: string, browserInfo: string) {
    super(`Storage feature not supported in current browser: ${feature} (${browserInfo})`);
    this.name = 'StorageCompatibilityError';
    this.feature = feature;
    this.browserInfo = browserInfo;
  }
  
  feature: string;
  browserInfo: string;
}
```

## Usage Examples

### Basic Storage Operations with Events
```typescript
class GameManager {
  private storageService: IStorageService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.storageService = registry.get<IStorageService>('storage');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  async saveGameProgress(progress: GameProgress): Promise<void> {
    try {
      // Save game progress
      await this.storageService.save('game.progress', progress);
      
      // Emit save success event
      this.eventBus.emit('storage.saved', {
        key: 'game.progress',
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof StorageQuotaExceededError) {
        // Handle storage full error
        this.eventBus.emit('error', {
          type: 'storage.quota',
          message: 'Storage full - cannot save game progress',
          details: {
            dataSize: error.dataSize,
            available: error.availableSpace
          }
        });
      } else {
        // Handle other storage errors
        this.eventBus.emit('error', {
          type: 'storage.save',
          message: 'Failed to save game progress',
          error
        });
      }
    }
  }
  
  async loadGameProgress(): Promise<GameProgress> {
    try {
      // Load game progress with default values
      const progress = await this.storageService.load<GameProgress>(
        'game.progress',
        DEFAULT_GAME_PROGRESS
      );
      
      // Emit load success event
      this.eventBus.emit('storage.loaded', {
        key: 'game.progress',
        timestamp: Date.now()
      });
      
      return progress;
    } catch (error) {
      if (error instanceof StorageCorruptedDataError) {
        // Handle corrupted data
        this.eventBus.emit('error', {
          type: 'storage.corrupted',
          message: 'Game progress data corrupted',
          error
        });
      }
      
      // Return default progress on any error
      return DEFAULT_GAME_PROGRESS;
    }
  }
}
```

### Advanced Storage Operations with Error Recovery
```typescript
class StorageManager {
  private storageService: IStorageService;
  private eventBus: IEventBus;
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.storageService = registry.get<IStorageService>('storage');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  async saveWithBackup<T>(key: string, data: T): Promise<void> {
    try {
      // Save backup first
      await this.storageService.save(`${key}_backup`, data);
      
      // Save main data
      await this.storageService.save(key, data);
      
      // Clean up old backup after successful save
      await this.storageService.remove(`${key}_backup`);
    } catch (error) {
      // Handle save errors with backup recovery
      if (error instanceof StorageQuotaExceededError) {
        // Try to free up space by cleaning old backups
        await this.cleanupOldBackups();
        // Retry the save operation
        return this.saveWithBackup(key, data);
      }
      
      throw error;
    }
  }
  
  async loadWithRecovery<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      // Try to load main data
      return await this.storageService.load<T>(key, defaultValue);
    } catch (error) {
      if (error instanceof StorageCorruptedDataError) {
        try {
          // Try to load from backup
          const backup = await this.storageService.load<T>(`${key}_backup`);
          if (backup) {
            // Restore from backup
            await this.storageService.save(key, backup);
            return backup;
          }
        } catch (backupError) {
          console.error('Backup recovery failed:', backupError);
        }
      }
      
      // Return default value if provided, otherwise rethrow
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }
}
```

## Implementation Checklist
1. **Storage Management**
   - [ ] Implement pluggable storage backends
   - [ ] Handle storage quotas
   - [ ] Manage data versioning
   - [ ] Support data migration

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Handle storage failures gracefully
   - [ ] Emit error events when appropriate
   - [ ] Validate data integrity

3. **Event Communication**
   - [ ] Emit storage operation events
   - [ ] Emit quota warning events
   - [ ] Handle error events
   - [ ] Track storage statistics

4. **Browser Support**
   - [ ] Handle cross-browser differences
   - [ ] Implement storage fallbacks
   - [ ] Support private browsing modes
   - [ ] Handle storage limitations

## Change History
- v2.0.0 (2024-03-31)
  - Added type-safe storage operations
  - Improved error handling
  - Added event system integration
  - Enhanced browser compatibility
- v1.0.0 (2024-03-01)
  - Initial implementation 