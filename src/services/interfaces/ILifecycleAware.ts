export interface ILifecycleAware {
    /**
     * Called when the service is being initialized
     * @param scene The Phaser scene this service belongs to
     */
    onInit(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being started
     * @param scene The Phaser scene this service belongs to
     */
    onStart(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being paused
     * @param scene The Phaser scene this service belongs to
     */
    onPause(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being resumed
     * @param scene The Phaser scene this service belongs to
     */
    onResume(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being stopped
     * @param scene The Phaser scene this service belongs to
     */
    onStop(scene: Phaser.Scene): Promise<void>;

    /**
     * Called when the service is being destroyed
     * @param scene The Phaser scene this service belongs to
     */
    onDestroy(scene: Phaser.Scene): Promise<void>;

    /**
     * Called during the game loop update
     * @param time The current game time
     * @param delta The time delta since last update
     */
    onServiceUpdate(time: number, delta: number): void;

    /**
     * Get the priority of this service (lower numbers are initialized first)
     */
    getPriority(): number;

    /**
     * Get the dependencies of this service
     */
    getDependencies(): string[];
} 