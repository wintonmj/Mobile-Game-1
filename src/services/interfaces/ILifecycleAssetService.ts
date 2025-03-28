import { IAssetService } from './IAssetService';
import { IService } from './IService';

export interface ILifecycleAssetService extends IAssetService, IService {
    /**
     * Get the current scene this service is managing assets for
     */
    getCurrentScene(): Phaser.Scene | null;

    /**
     * Set the current scene this service should manage assets for
     */
    setCurrentScene(scene: Phaser.Scene | null): void;

    /**
     * Get all assets that belong to a specific scene
     */
    getSceneAssets(scene: Phaser.Scene): string[];

    /**
     * Release all assets that belong to a specific scene
     */
    releaseSceneAssets(scene: Phaser.Scene): void;

    /**
     * Get memory usage for a specific scene
     */
    getSceneMemoryUsage(scene: Phaser.Scene): number;

    /**
     * Get loading status for a specific scene
     */
    getSceneLoadingStatus(scene: Phaser.Scene): { loaded: number; total: number; inProgress: string[] };
} 