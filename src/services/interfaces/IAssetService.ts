import {
  AssetDefinition,
  AssetInfo,
  AssetOptions,
  AssetType,
  CachePrunedData,
  MemoryUsageData,
} from '../../types/assets';
import { Subscription } from './IEventBusService';
import { IRegistry } from './IRegistry';

/**
 * Asset service event types
 */
// Load events
export interface ILoadStarted {
  key: string;
  type: AssetType;
  timestamp: number;
}

export interface ILoadProgress {
  key: string;
  progress: number; // 0-1
  bytes?: number;
  totalBytes?: number;
}

export interface ILoadCompleted {
  key: string;
  type: AssetType;
  duration: number; // ms
  size?: number; // bytes
}

export interface ILoadError {
  key: string;
  type: AssetType;
  error: Error | string;
  attemptCount: number;
  willRetry: boolean;
}

// State events
export interface IStateChanged {
  key: string;
  previousState: 'unregistered' | 'registered' | 'loading' | 'loaded' | 'error' | 'released';
  newState: 'registered' | 'loading' | 'loaded' | 'error' | 'released';
}

// Group events
export interface IGroupOperation {
  groupId: string;
  assetCount: number;
  operation: 'created' | 'loading' | 'loaded' | 'released';
}

// Memory events
export interface IMemoryWarning {
  currentUsage: number;
  threshold: number;
  recommendedAction: string;
}

export interface IMemoryCritical {
  currentUsage: number;
  threshold: number;
  requiredAction: string;
}

export interface IMemoryReleased {
  freedMemory: number;
  releasedAssets: string[];
  trigger: 'manual' | 'automatic' | 'critical';
}

export interface IMemoryUsage {
  total: number;
  byType: Record<AssetType, number>;
  largestAssets: Array<{
    key: string;
    size: number;
    type: AssetType;
  }>;
  timestamp: number;
}

export interface ICacheFull {
  currentCount: number;
  maxAllowed: number;
  oldestAssets: Array<{ key: string; lastUsed: number }>;
}

export interface ICachePruned {
  removedCount: number;
  freedMemory: number;
  removedAssets: string[];
}

/**
 * Group all asset events for improved organization
 */
export const AssetEvents = {
  LoadStarted: {} as ILoadStarted,
  LoadProgress: {} as ILoadProgress,
  LoadCompleted: {} as ILoadCompleted,
  LoadError: {} as ILoadError,
  StateChanged: {} as IStateChanged,
  GroupOperation: {} as IGroupOperation,
  MemoryWarning: {} as IMemoryWarning,
  MemoryCritical: {} as IMemoryCritical,
  MemoryReleased: {} as IMemoryReleased,
  MemoryUsage: {} as IMemoryUsage,
  CacheFull: {} as ICacheFull,
  CachePruned: {} as ICachePruned,
};

// Type lookup for type-safety in eventMap
export type AssetEventsType = typeof AssetEvents;
export type AssetEventKeys = keyof AssetEventsType;

/**
 * Event map interface for AssetService events
 */
export interface AssetEventMap {
  'asset.load.started': ILoadStarted;
  'asset.load.progress': ILoadProgress;
  'asset.load.completed': ILoadCompleted;
  'asset.load.error': ILoadError;
  'asset.state.changed': IStateChanged;
  'asset.group.operation': IGroupOperation;
  'asset.memory.warning': IMemoryWarning;
  'asset.memory.critical': IMemoryCritical;
  'asset.memory.released': IMemoryReleased;
  'asset.memory.usage': IMemoryUsage;
  'asset.cache.full': ICacheFull;
  'asset.cache.pruned': ICachePruned;
  'asset.released': ILoadStarted;
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
  loadAsset(
    key: string
  ): Promise<
    | Phaser.GameObjects.GameObject
    | Phaser.Loader.FileTypes.AudioFile
    | Phaser.Textures.Texture
    | object
  >;
  isLoaded(key: string): boolean;

  // Asset retrieval
  getTexture(key: string): Phaser.Textures.Texture;
  getAudio(key: string): Phaser.Sound.BaseSound;
  getJSON(key: string): object;
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
  getLoadingStatus(): { loaded: number; total: number; inProgress: string[] };

  // Event subscription management
  subscribe<K extends keyof AssetEventMap>(
    eventName: K,
    callback: (data: AssetEventMap[K]) => void
  ): Subscription | null;
  subscribeOnce<K extends keyof AssetEventMap>(
    eventName: K,
    callback: (data: AssetEventMap[K]) => void
  ): Subscription | null;
  watchLoading(
    keys: string[],
    onProgress: (progress: number) => void,
    onComplete: () => void
  ): { stopWatching: () => void };
  isEventBusAvailable(): boolean;
  getEventHistory(): Array<{ event: string; data: any; timestamp: number }>;
  reconnectEventBus(registry: IRegistry): boolean;
}
