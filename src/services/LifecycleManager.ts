import { ILifecycleAware } from './interfaces/ILifecycleAware';
import { Registry } from './Registry';
import { ServiceStatus } from './interfaces/ServiceStatus';

export class LifecycleManager {
    private static instance: LifecycleManager;
    private registry: Registry;
    private scene: Phaser.Scene | null = null;
    private services: Map<string, ILifecycleAware> = new Map();
    private serviceStatus: Map<string, ServiceStatus> = new Map();
    private initializationOrder: string[] = [];
    private isInitialized: boolean = false;
    private activeScenes: Set<Phaser.Scene> = new Set();

    private constructor() {
        this.registry = new Registry();
    }

    public static getInstance(): LifecycleManager {
        if (!LifecycleManager.instance) {
            LifecycleManager.instance = new LifecycleManager();
        }
        return LifecycleManager.instance;
    }

    /**
     * Register a service with the lifecycle manager
     * @param serviceId The unique identifier for the service
     * @param service The service instance implementing ILifecycleAware
     */
    public registerService(serviceId: string, service: ILifecycleAware): void {
        if (this.services.has(serviceId)) {
            throw new Error(`Service ${serviceId} is already registered`);
        }
        this.services.set(serviceId, service);
        this.serviceStatus.set(serviceId, ServiceStatus.CREATED);
        this.updateInitializationOrder();
    }

    /**
     * Unregister a service from the lifecycle manager
     * @param serviceId The unique identifier for the service
     */
    public unregisterService(serviceId: string): void {
        if (!this.services.has(serviceId)) {
            throw new Error(`Service ${serviceId} is not registered`);
        }
        this.services.delete(serviceId);
        this.serviceStatus.delete(serviceId);
        this.updateInitializationOrder();
    }

    /**
     * Get the current status of a service
     * @param serviceId The unique identifier for the service
     */
    public getServiceStatus(serviceId: string): ServiceStatus {
        return this.serviceStatus.get(serviceId) ?? ServiceStatus.CREATED;
    }

    /**
     * Get the current scene
     */
    public getCurrentScene(): Phaser.Scene | null {
        return this.scene;
    }

    /**
     * Get all active scenes
     */
    public getActiveScenes(): Phaser.Scene[] {
        return Array.from(this.activeScenes);
    }

    /**
     * Check if a scene is active
     */
    public isSceneActive(scene: Phaser.Scene): boolean {
        return this.activeScenes.has(scene);
    }

    /**
     * Initialize all registered services
     * @param scene The Phaser scene
     */
    public async initialize(scene: Phaser.Scene): Promise<void> {
        if (this.isInitialized) {
            throw new Error('LifecycleManager is already initialized');
        }

        this.scene = scene;
        this.activeScenes.add(scene);
        this.isInitialized = true;

        // Initialize services in order
        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service) {
                await service.onInit(scene);
                this.serviceStatus.set(serviceId, ServiceStatus.CREATED);
            }
        }
    }

    /**
     * Start all registered services
     */
    public async start(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LifecycleManager is not initialized');
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                await service.onStart(this.scene);
                this.serviceStatus.set(serviceId, ServiceStatus.STARTED);
            }
        }
    }

    /**
     * Pause all registered services
     */
    public async pause(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LifecycleManager is not initialized');
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                await service.onPause(this.scene);
                this.serviceStatus.set(serviceId, ServiceStatus.PAUSED);
            }
        }
    }

    /**
     * Resume all registered services
     */
    public async resume(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LifecycleManager is not initialized');
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                await service.onResume(this.scene);
                this.serviceStatus.set(serviceId, ServiceStatus.RESUMED);
            }
        }
    }

    /**
     * Stop all registered services
     */
    public async stop(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LifecycleManager is not initialized');
        }

        // Stop services in reverse order
        for (const serviceId of this.initializationOrder.reverse()) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                await service.onStop(this.scene);
                this.serviceStatus.set(serviceId, ServiceStatus.SHUTDOWN);
            }
        }
    }

    /**
     * Destroy all registered services
     */
    public async destroy(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('LifecycleManager is not initialized');
        }

        // Destroy services in reverse order
        for (const serviceId of this.initializationOrder.reverse()) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                await service.onDestroy(this.scene);
                this.serviceStatus.set(serviceId, ServiceStatus.DESTROYED);
            }
        }

        this.services.clear();
        this.serviceStatus.clear();
        this.initializationOrder = [];
        this.isInitialized = false;
        this.scene = null;
        this.activeScenes.clear();
    }

    /**
     * Handle scene sleep
     */
    public async onSceneSleep(scene: Phaser.Scene): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && scene === this.scene) {
                await service.onPause(scene);
                this.serviceStatus.set(serviceId, ServiceStatus.SLEEPING);
            }
        }
    }

    /**
     * Handle scene wake
     */
    public async onSceneWake(scene: Phaser.Scene): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && scene === this.scene) {
                await service.onResume(scene);
                this.serviceStatus.set(serviceId, ServiceStatus.WAKING);
            }
        }
    }

    /**
     * Update the initialization order based on service priorities and dependencies
     */
    private updateInitializationOrder(): void {
        const serviceIds = Array.from(this.services.keys());
        const visited = new Set<string>();
        const temp = new Set<string>();
        const order: string[] = [];

        const visit = (serviceId: string): void => {
            if (temp.has(serviceId)) {
                throw new Error(`Circular dependency detected for service ${serviceId}`);
            }
            if (visited.has(serviceId)) {
                return;
            }

            temp.add(serviceId);
            const service = this.services.get(serviceId);
            if (service) {
                for (const depId of service.getDependencies()) {
                    if (this.services.has(depId)) {
                        visit(depId);
                    }
                }
            }
            temp.delete(serviceId);
            visited.add(serviceId);
            order.push(serviceId);
        };

        // Sort services by priority first
        const sortedServices = serviceIds.sort((a, b) => {
            const serviceA = this.services.get(a);
            const serviceB = this.services.get(b);
            return (serviceA?.getPriority() ?? 0) - (serviceB?.getPriority() ?? 0);
        });

        // Visit each service in priority order
        for (const serviceId of sortedServices) {
            if (!visited.has(serviceId)) {
                visit(serviceId);
            }
        }

        this.initializationOrder = order;
    }

    /**
     * Update all registered services
     * @param time The current game time
     * @param delta The time delta since last update
     */
    public update(time: number, delta: number): void {
        if (!this.isInitialized) {
            return;
        }

        for (const serviceId of this.initializationOrder) {
            const service = this.services.get(serviceId);
            if (service && this.scene) {
                service.onServiceUpdate(time, delta);
            }
        }
    }
} 