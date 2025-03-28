import { Service } from '../Registry';
import { ServiceStatus } from './ServiceStatus';

export interface IService extends Service {
    /**
     * Get the current status of the service
     */
    getStatus(): ServiceStatus;

    /**
     * Get the scene this service belongs to
     */
    getScene(): Phaser.Scene | null;

    /**
     * Set the scene this service belongs to
     */
    setScene(scene: Phaser.Scene | null): void;

    /**
     * Get the priority of this service (lower numbers are initialized first)
     */
    getPriority(): number;

    /**
     * Get the dependencies of this service
     */
    getDependencies(): string[];

    /**
     * Called when the service is being initialized
     */
    onInit(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being started
     */
    onStart(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being paused
     */
    onPause(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being resumed
     */
    onResume(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being stopped
     */
    onStop(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being destroyed
     */
    onDestroy(scene: Phaser.Scene): Promise<void>;
} 