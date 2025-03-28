/**
 * Enum for supported asset types
 */
export enum AssetType {
  IMAGE = 'image',
  SPRITE_SHEET = 'spritesheet',
  ATLAS = 'atlas',
  AUDIO = 'audio',
  JSON = 'json',
  BITMAP_FONT = 'bitmapFont',
  VIDEO = 'video',
  TILEMAP = 'tilemap',
  HTML = 'html',
  SHADER = 'shader',
}

/**
 * Enum for asset cache policies
 */
export enum CachePolicy {
  PERSISTENT = 'persistent', // Keep in memory until explicitly released
  SESSION = 'session', // Keep for current game session
  LEVEL = 'level', // Keep only while current level is active
  TEMPORARY = 'temporary', // Release as soon as possible after use
  MANUAL = 'manual', // Only load/unload through explicit calls
}

/**
 * Interface for asset definition metadata
 */
export interface AssetDefinition {
  key: string;
  path: string;
  type: AssetType;
  options?: AssetOptions;
  cachePolicy?: CachePolicy;
}

/**
 * Interface for asset-specific loading options
 */
export interface AssetOptions {
  // Common options
  crossOrigin?: string;
  xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;

  // Type-specific options
  frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
  atlasURL?: string;
  atlasXhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
  dataURL?: string;
  dataXhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}

/**
 * Interface for asset metadata and status information
 */
export interface AssetInfo {
  key: string;
  path: string;
  type: AssetType;
  loaded: boolean;
  loadTime?: number;
  size?: number;
  lastUsed?: number;
  cachePolicy: CachePolicy;
}

/**
 * Interface for memory usage data
 */
export interface MemoryUsageData {
  total: number;
  byType: Record<AssetType, number>;
  largestAssets: Array<{
    key: string;
    size: number;
    type: AssetType;
  }>;
}

/**
 * Interface for cache pruning result data
 */
export interface CachePrunedData {
  removedCount: number;
  freedMemory: number;
  removedAssets: string[];
}
