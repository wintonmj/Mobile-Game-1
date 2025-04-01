# Browser Storage Strategy

## Overview
This document outlines the comprehensive approach to browser storage for our game, detailing storage mechanisms, fallback strategies, size management, and data migration approaches. It serves as a reference for implementing reliable and efficient data persistence in browser environments.

## Storage Approaches

### 1. Primary Storage Mechanisms

#### localStorage
- **Usage**: Store small, frequently accessed game data (player settings, game progress, UI preferences)
- **Limitations**:
  - Storage size limited to ~5MB per domain
  - Synchronous API can block the main thread
  - String-only storage requires serialization/deserialization
- **Implementation Pattern**:
```typescript
// Storing data with error handling
try {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
} catch (error) {
  // Handle QuotaExceededError
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    // Implement fallback strategy
  }
}
```

#### IndexedDB
- **Usage**: Store larger datasets (game save files, asset metadata, level data)
- **Advantages**:
  - Much larger storage limits (typically 50-100MB+)
  - Asynchronous API doesn't block main thread
  - Support for complex data structures without serialization
- **Implementation Pattern**:
```typescript
function saveToIndexedDB(key: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gameData', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('gameState')) {
        db.createObjectStore('gameState');
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['gameState'], 'readwrite');
      const store = transaction.objectStore('gameState');
      
      store.put(data, key);
      
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = (error) => {
        db.close();
        reject(error);
      };
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}
```

#### SessionStorage
- **Usage**: Temporary data during gameplay session (current game state, temporary achievements)
- **Limitations**: Data is cleared when the browser tab is closed

#### Cache API
- **Usage**: Store static assets and resources for offline play
- **Integration**: Works with Service Workers for offline functionality

### 2. Fallback Strategy

#### Tiered Storage Approach
1. **Primary**: localStorage for critical, small data
2. **Secondary**: IndexedDB for larger datasets
3. **Tertiary**: Cloud-based storage (if applicable)

#### Automatic Fallback Implementation
```typescript
async function saveData(key: string, data: any): Promise<void> {
  const serializedData = JSON.stringify(data);
  
  // Try localStorage first
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedData);
    return;
  } catch (error) {
    // Fall back to IndexedDB if localStorage fails
    if (isIndexedDBAvailable()) {
      try {
        await saveToIndexedDB(key, data);
        return;
      } catch (idbError) {
        console.error('IndexedDB storage failed', idbError);
      }
    }
    
    // If all local storage fails, implement cloud fallback if available
    if (isOnline() && isCloudSyncEnabled()) {
      try {
        await saveToCloud(key, data);
        return;
      } catch (cloudError) {
        console.error('Cloud storage failed', cloudError);
      }
    }
    
    // All storage mechanisms failed
    throw new Error('All storage mechanisms failed');
  }
}
```

#### Feature Detection
```typescript
function detectStorageCapabilities(): StorageCapabilities {
  const capabilities = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    cacheAPI: false,
    estimatedQuota: 0
  };
  
  // Test localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    capabilities.localStorage = true;
  } catch (e) {
    capabilities.localStorage = false;
  }
  
  // Test sessionStorage
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    capabilities.sessionStorage = true;
  } catch (e) {
    capabilities.sessionStorage = false;
  }
  
  // Test IndexedDB
  capabilities.indexedDB = typeof indexedDB !== 'undefined';
  
  // Test Cache API
  capabilities.cacheAPI = 'caches' in window;
  
  // Get estimated quota (where supported)
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(estimation => {
      capabilities.estimatedQuota = estimation.quota || 0;
    });
  }
  
  return capabilities;
}
```

## Storage Limit Management

### 1. Size Estimation and Monitoring

#### Data Size Calculation
```typescript
function calculateDataSize(data: any): number {
  const serialized = JSON.stringify(data);
  return new Blob([serialized]).size;
}
```

#### Storage Usage Monitoring
```typescript
async function getStorageUsage(): Promise<StorageUsage> {
  let localStorageUsage = 0;
  
  // Calculate localStorage usage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const item = localStorage.getItem(key);
      if (item) {
        localStorageUsage += key.length + item.length;
      }
    }
  }
  
  // Get IndexedDB usage (if available)
  let indexedDBUsage = 0;
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    indexedDBUsage = estimate.usage || 0;
  }
  
  return {
    localStorage: localStorageUsage,
    indexedDB: indexedDBUsage,
    total: localStorageUsage + indexedDBUsage
  };
}
```

### 2. Data Prioritization Strategies

#### Critical vs. Non-Critical Data
- **Critical Data**: Player progress, account info, essential settings
  - Always prioritize in localStorage
  - Implement multiple backup strategies
- **Non-Critical Data**: Cosmetic settings, achievement history, non-essential stats
  - Store in IndexedDB when space is limited
  - Can be regenerated or fetched if lost

#### Automatic Storage Optimization
```typescript
async function optimizeStorage(): Promise<boolean> {
  const usage = await getStorageUsage();
  
  // Check if optimization is needed (over 80% full)
  if (usage.localStorage < MAX_LOCAL_STORAGE_SIZE * 0.8) {
    return false; // No optimization needed
  }
  
  // 1. Move non-critical data to IndexedDB
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${STORAGE_PREFIX}non_critical_`)) {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      await saveToIndexedDB(key, data);
      localStorage.removeItem(key);
    }
  }
  
  // 2. Compress infrequently accessed data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('history')) {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const compressed = compressData(data);
      localStorage.setItem(key, JSON.stringify(compressed));
    }
  }
  
  // 3. Clean old save states, keeping only the 3 most recent
  await cleanupOldSaveStates(3);
  
  return true; // Optimization performed
}
```

### 3. Compression Techniques

#### JSON Minification
- Remove unnecessary whitespace and keys with default values
- Shorten key names in storage objects

#### Custom Compression
For large datasets:
```typescript
function compressData(data: any): any {
  // For simple objects: Use shortened property names
  if (typeof data === 'object' && !Array.isArray(data)) {
    const compressed: Record<string, any> = {};
    
    // Use a mapping for property compression
    const keyMap: Record<string, string> = {
      'playerPosition': 'pp',
      'inventoryItems': 'ii',
      'completedQuests': 'cq',
      // Add more mappings as needed
    };
    
    Object.entries(data).forEach(([key, value]) => {
      const compressedKey = keyMap[key] || key;
      compressed[compressedKey] = value;
    });
    
    return compressed;
  }
  
  // For arrays: Consider serialization techniques if appropriate
  return data;
}

function decompressData(compressed: any): any {
  if (typeof compressed === 'object' && !Array.isArray(compressed)) {
    const decompressed: Record<string, any> = {};
    
    // Reverse mapping for decompression
    const keyMap: Record<string, string> = {
      'pp': 'playerPosition',
      'ii': 'inventoryItems',
      'cq': 'completedQuests',
      // Add more mappings as needed
    };
    
    Object.entries(compressed).forEach(([key, value]) => {
      const decompressedKey = keyMap[key] || key;
      decompressed[decompressedKey] = value;
    });
    
    return decompressed;
  }
  
  return compressed;
}
```

## Data Migration Strategies

### 1. Version-Based Schema Management

#### Schema Versioning
- Maintain a version for storage schema in localStorage
- Implement migration functions for version updates
- Never delete old data until migration is confirmed successful

#### Version Migration Implementation
```typescript
type MigrationFn = (oldData: any) => any;

const migrations: Record<string, MigrationFn> = {
  '1.0-to-1.1': (oldData) => {
    // Example: Add new fields or restructure data
    return {
      ...oldData,
      newField: 'defaultValue',
      // Transform existing fields if needed
      inventory: oldData.inventory.map(item => ({
        ...item,
        durability: item.durability || 100
      }))
    };
  },
  '1.1-to-1.2': (oldData) => {
    // Another migration
    return transformData(oldData);
  }
};

async function migrateData(currentVersion: string): Promise<void> {
  const storedVersion = localStorage.getItem(`${STORAGE_PREFIX}schema_version`) || '1.0';
  
  if (storedVersion === currentVersion) {
    return; // No migration needed
  }
  
  // Get all versions between stored and current
  const versionsToMigrate = getVersionsBetween(storedVersion, currentVersion);
  
  // Backup data before migration
  const allData = await getAllStoredData();
  await saveToIndexedDB('backup_before_migration', {
    data: allData,
    timestamp: Date.now(),
    fromVersion: storedVersion,
    toVersion: currentVersion
  });
  
  // Perform migrations in sequence
  for (const version of versionsToMigrate) {
    const migrationKey = `${version.from}-to-${version.to}`;
    if (migrations[migrationKey]) {
      try {
        // Get all data that needs migration
        const keys = getKeysForVersion(version.from);
        
        // Apply migration to each data store
        for (const key of keys) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const migratedData = migrations[migrationKey](data);
          localStorage.setItem(key, JSON.stringify(migratedData));
        }
      } catch (error) {
        console.error(`Migration ${migrationKey} failed:`, error);
        // Restore from backup
        await restoreFromBackup();
        throw error;
      }
    }
  }
  
  // Update schema version after successful migration
  localStorage.setItem(`${STORAGE_PREFIX}schema_version`, currentVersion);
}
```

### 2. Data Backup and Recovery

#### Regular Backups
- Create periodic backups to IndexedDB or cloud storage
- Implement a rolling backup strategy (keep last N backups)

#### Recovery Process
```typescript
async function createBackup(): Promise<string> {
  const backupId = `backup_${Date.now()}`;
  const allData = {};
  
  // Collect all data from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      allData[key] = localStorage.getItem(key);
    }
  }
  
  // Store in IndexedDB
  await saveToIndexedDB(backupId, {
    data: allData,
    timestamp: Date.now(),
    version: getCurrentVersion()
  });
  
  // Maintain only N most recent backups
  await cleanupOldBackups(5);
  
  return backupId;
}

async function restoreFromBackup(backupId?: string): Promise<boolean> {
  // If no backup ID specified, use the most recent
  if (!backupId) {
    const backups = await getBackupsList();
    if (backups.length === 0) {
      return false;
    }
    backupId = backups[0].id;
  }
  
  try {
    // Get backup from IndexedDB
    const backup = await loadFromIndexedDB(backupId);
    if (!backup || !backup.data) {
      return false;
    }
    
    // Restore data to localStorage
    Object.entries(backup.data).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });
    
    return true;
  } catch (error) {
    console.error('Backup restoration failed:', error);
    return false;
  }
}
```

### 3. Cross-Browser Compatibility

#### Feature Detection
- Test for storage features before using them
- Implement graceful degradation for unsupported features

#### Browser-Specific Workarounds
```typescript
function getStorageImplementation(): StorageInterface {
  // Default implementation
  const defaultImpl: StorageInterface = {
    save: async (key, data) => { /* default implementation */ },
    load: async (key) => { /* default implementation */ },
    delete: async (key) => { /* default implementation */ }
  };
  
  // Safari private browsing mode workaround
  if (isSafariPrivateMode()) {
    return getSafariPrivateBrowsingImpl();
  }
  
  // IE11 IndexedDB workaround
  if (isIE11() && needsIndexedDBFallback()) {
    return getIE11CompatibleImpl();
  }
  
  return defaultImpl;
}
```

## Implementation Guide

### 1. Service Implementation

#### Storage Service Architecture
```typescript
export interface IStorageService {
  saveData(key: string, data: any): Promise<void>;
  loadData<T>(key: string, defaultValue?: T): Promise<T>;
  deleteData(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class StorageService implements IStorageService {
  private static instance: StorageService;
  private readonly STORAGE_PREFIX = 'game_';
  private capabilities: StorageCapabilities;
  
  private constructor() {
    this.capabilities = detectStorageCapabilities();
  }
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  // Implement IStorageService methods
  // ...
}
```

### 2. Integration with Game Systems

#### Save Game Integration
```typescript
// In the game's save system
async function saveGame(slot: number): Promise<boolean> {
  try {
    const storageService = StorageService.getInstance();
    
    // Collect game state
    const gameState = collectGameState();
    
    // Calculate size before saving
    const dataSize = calculateDataSize(gameState);
    if (dataSize > WARN_SIZE_THRESHOLD) {
      console.warn(`Save data size (${dataSize} bytes) is approaching storage limits`);
    }
    
    // Save with appropriate key
    await storageService.saveData(`save_${slot}`, gameState);
    
    // Update save metadata
    const metadata = {
      timestamp: Date.now(),
      playerLevel: gameState.player.level,
      playTime: gameState.statistics.playTime,
      location: gameState.player.currentLocation
    };
    await storageService.saveData(`save_${slot}_meta`, metadata);
    
    return true;
  } catch (error) {
    // Handle save failure
    console.error('Save failed:', error);
    return false;
  }
}
```

### 3. Error Handling and Recovery

#### Storage Event Listeners
```typescript
// Listen for storage events (changes from other tabs)
window.addEventListener('storage', (event) => {
  if (event.key && event.key.startsWith(STORAGE_PREFIX)) {
    // Handle storage changes from other tabs
    handleExternalStorageChange(event.key, event.newValue);
  }
});

// Listen for storage quota errors
window.addEventListener('error', (event) => {
  if (event.message.includes('QuotaExceededError')) {
    // Trigger storage optimization
    optimizeStorage().then(optimized => {
      if (optimized) {
        // Retry the last operation
        retryLastOperation();
      } else {
        // Show storage warning to user
        showStorageWarning();
      }
    });
  }
});
```

## Testing Strategy

### 1. Unit Tests
- Test individual storage operations
- Verify fallback mechanisms work correctly
- Test compression/decompression logic

### 2. Integration Tests
- Test storage service with actual game data
- Verify migrations between versions
- Test recovery from simulated failures

### 3. Storage Limit Tests
```typescript
describe('Browser Storage Limits and Fallback Tests', () => {
  let storageService;
  
  beforeEach(() => {
    // Mock storage with size tracking
    const mockLocalStorage = (() => {
      let store = {};
      let usedBytes = 0;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB mock limit
      
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          // Calculate size
          const itemSize = (key.length + value.length) * 2; // Unicode = 2 bytes per char
          
          // Check if adding this would exceed quota
          if (usedBytes + itemSize > MAX_SIZE) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
          }
          
          store[key] = value;
          usedBytes += itemSize;
        }),
        // Additional mock methods...
      };
    })();
    
    // Initialize storage service with mocks
    storageService = new StorageService();
  });
  
  test('should automatically fall back to IndexedDB when localStorage is full', async () => {
    // Test implementation
  });
  
  // Additional tests...
});
```

## Performance Considerations

### 1. Asynchronous Operations
- Never block the main thread with storage operations
- Use promise-based API for all storage interactions
- Consider using Web Workers for large data operations

### 2. Batching Updates
- Group related storage operations
- Implement a queue system for storage operations
- Use debouncing for frequently changing data

### 3. Lazy Loading
- Only load data when needed
- Implement progressive loading for large datasets
- Use partial updates for large objects

## Security Considerations

### 1. Data Sensitivity
- Never store sensitive user information in browser storage
- Implement secure storage for authentication tokens
- Consider encryption for sensitive game data

### 2. Input Validation
- Validate all data before storage
- Sanitize data loaded from storage before use
- Implement schema validation for stored data

## Related Documents
- [Service Registry Pattern](./service-registry.md)
- [Event-Driven Architecture](./event-driven.md)
- [MVP High-Level Architecture](../MVPHighLevelArchitecture.md)
- [Technical Stack](../technical-stack.md)

## Conclusion
This browser storage strategy provides a comprehensive approach to handling data persistence in browser environments. By implementing tiered storage, fallback mechanisms, size optimization, and data migration strategies, we can ensure reliable data storage even in restricted browser environments. 