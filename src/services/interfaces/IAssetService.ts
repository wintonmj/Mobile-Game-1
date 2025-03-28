import { AssetDefinition, AssetInfo, AssetOptions, AssetType, CachePrunedData, MemoryUsageData } from '../../types/assets';
import { Subscription } from './IEventBusService';
import { IRegistry } from './IRegistry';

/**
 * Event map interface for AssetService events
 */
export interface AssetEventMap {
  'asset.load.started': AssetEvents.LoadStarted;
  'asset.load.progress': AssetEvents.LoadProgress;
  'asset.load.completed': AssetEvents.LoadCompleted;
  'asset.load.error': AssetEvents.LoadError;
  'asset.state.changed': AssetEvents.StateChanged;
  'asset.group.operation': AssetEvents.GroupOperation;
  'asset.memory.warning': AssetEvents.MemoryWarning;
  'asset.memory.critical': AssetEvents.MemoryCritical;
  'asset.memory.released': AssetEvents.MemoryReleased;
  'asset.memory.usage': AssetEvents.MemoryUsage;
  'asset.cache.full': AssetEvents.CacheFull;
  'asset.cache.pruned': AssetEvents.CachePruned;
}

/**
 * Namespace for asset service event types
 */
export namespace AssetEvents {
  // Load events
  export interface LoadStarted {
    key: string;
    type: AssetType;
    timestamp: number;
  }
  
  export interface LoadProgress {
    key: string;
    progress: number;  // 0-1
    bytes?: number;
    totalBytes?: number;
  }
  
  export interface LoadCompleted {
    key: string;
    type: AssetType;
    duration: number;  // ms
    size?: number;     // bytes
  }
  
  export interface LoadError {
    key: string;
    type: AssetType;
    error: Error | string;
    attemptCount: number;
    willRetry: boolean;
  }
  
  // State events
  export interface StateChanged {
    key: string;
    previousState: 'unregistered' | 'registered' | 'loading' | 'loaded' | 'error' | 'released';
    newState: 'registered' | 'loading' | 'loaded' | 'error' | 'released';
  }
  
  // Group events
  export interface GroupOperation {
    groupId: string;
    assetCount: number;
    operation: 'created' | 'loading' | 'loaded' | 'released';
  }
  
  // Memory events
  export interface MemoryWarning {
    currentUsage: number;
    threshold: number;
    recommendedAction: string;
  }
  
  export interface MemoryCritical {
    currentUsage: number;
    threshold: number;
    requiredAction: string;
  }
  
  export interface MemoryReleased {
    freedMemory: number;
    releasedAssets: string[];
    trigger: 'manual' | 'automatic' | 'critical';
  }
  
  export interface MemoryUsage {
    total: number;
    byType: Record<AssetType, number>;
    largestAssets: Array<{
      key: string;
      size: number;
      type: AssetType;
    }>;
    timestamp: number;
  }
  
  export interface CacheFull {
    currentCount: number;
    maxAllowed: number;
    oldestAssets: Array<{ key: string, lastUsed: number }>;
  }
  
  export interface CachePruned {
    removedCount: number;
    freedMemory: number;
    removedAssets: string[];
  }
}

/**
 * Interface for the AssetService which provides a centralized
 * resource management system for game assets.
 */
export interface IAssetService {
  // Asset registration
  registerAsset(key: string, path: string, type: AssetType, options?: AssetOptions): void;
  registerMultiple(assets: AssetDefinition[]): void;
  
  // Asset loading
  preload(keys: string[], onProgress?: (progress: number) => void): Promise<void>;
  loadAsset(key: string): Promise<any>;
  isLoaded(key: string): boolean;
  
  // Asset retrieval
  getTexture(key: string): Phaser.Textures.Texture;
  getAudio(key: string): Phaser.Sound.BaseSound;
  getJSON(key: string): any;
  getAtlas(key: string): Phaser.Textures.Texture;
  getBitmapFont(key: string): Phaser.GameObjects.BitmapText;
  
  // Asset management
  releaseAsset(key: string): boolean;
  clearAssets(keys?: string[]): void;
  
  // Memory management
  getMemoryUsage(): MemoryUsageData;
  setMemoryThresholds(warning: number, critical: number): void;
  enableMemoryMonitoring(interval?: number): void;
  disableMemoryMonitoring(): void;
  getTotalMemoryUsed(): number;
  getMemoryUsageByType(): Record<AssetType, number>;
  pruneCache(targetSize?: number): CachePrunedData;
  
  // Asset metadata
  getAssetInfo(key: string): AssetInfo | null;
  
  // Asset groups
  createGroup(groupId: string, assetKeys: string[]): void;
  loadGroup(groupId: string, onProgress?: (progress: number) => void): Promise<void>;
  releaseGroup(groupId: string): void;
  
  // Monitoring and utilities
  getLoadedAssetCount(): number;
  getTotalAssetCount(): number;
  getLoadingStatus(): { loaded: number, total: number, inProgress: string[] };
  
  // Event subscription management
  subscribe<K extends keyof AssetEventMap>(eventName: K, callback: (data: AssetEventMap[K]) => void): Subscription | null;
  subscribeOnce<K extends keyof AssetEventMap>(eventName: K, callback: (data: AssetEventMap[K]) => void): Subscription | null;
  watchLoading(keys: string[], onProgress: (progress: number) => void, onComplete: () => void): { stopWatching: () => void };
  isEventBusAvailable(): boolean;
  getEventHistory(): Array<{event: string, data: any, timestamp: number}>;
  reconnectEventBus(registry: IRegistry): boolean;
} 