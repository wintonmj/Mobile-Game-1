import { IService } from './interfaces/IService';
import { ServiceStatus } from './interfaces/ServiceStatus';

// Define Service interface locally to avoid import issues
export interface Service {
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  onRegister?: () => void;
  onUnregister?: () => void;
}

// Define IRegistry interface
export interface IRegistry {
  registerService<T extends Service>(serviceId: string, serviceInstance: T): void;
  getService<T>(serviceId: string): T;
  hasService(serviceId: string): boolean;
  unregisterService(serviceId: string): void;
  clear(): void;
  registerDependencies(serviceId: string, dependencyIds: string[]): void;
  getServiceDependencies(serviceId: string): string[];
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  initializeBasicServices(): void;
  registerLifecycleService(serviceId: string, service: IService): void;
  getServiceStatus(serviceId: string): ServiceStatus;
  getServicesForScene(scene: Phaser.Scene): IService[];
  updateServiceScene(serviceId: string, scene: Phaser.Scene | null): void;
}

export interface IRegistryService extends Service {
  registerService<T extends Service>(serviceId: string, serviceInstance: T): void;
  getService<T>(serviceId: string): T;
  hasService(serviceId: string): boolean;
  unregisterService(serviceId: string): void;
  clear(): void;
  registerDependencies(serviceId: string, dependencyIds: string[]): void;
  getServiceDependencies(serviceId: string): string[];
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  initializeBasicServices(): void;
}

export class Registry implements IRegistry {
  private services: Map<string, Service> = new Map();
  private lifecycleServices: Map<string, IService> = new Map();
  private sceneServices: Map<Phaser.Scene, Set<string>> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private initialized: boolean = false;

  registerService<T extends Service>(serviceId: string, serviceInstance: T): void {
    this.services.set(serviceId, serviceInstance);
    if (!this.dependencies.has(serviceId)) {
      this.dependencies.set(serviceId, new Set());
    }
    serviceInstance.onRegister?.();
  }

  registerLifecycleService(serviceId: string, service: IService): void {
    if (this.lifecycleServices.has(serviceId)) {
      throw new Error(`Lifecycle service ${serviceId} is already registered`);
    }
    this.lifecycleServices.set(serviceId, service);
    this.registerService(serviceId, service);
  }

  getService<T>(serviceId: string): T {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    return service as T;
  }

  hasService(serviceId: string): boolean {
    return this.services.has(serviceId);
  }

  getServiceStatus(serviceId: string): ServiceStatus {
    const service = this.lifecycleServices.get(serviceId);
    if (!service) {
      throw new Error(`Lifecycle service not found: ${serviceId}`);
    }
    return service.getStatus();
  }

  getServicesForScene(scene: Phaser.Scene): IService[] {
    const serviceIds = this.sceneServices.get(scene);
    if (!serviceIds) {
      return [];
    }
    return Array.from(serviceIds)
      .map(id => this.lifecycleServices.get(id))
      .filter((service): service is IService => service !== undefined);
  }

  updateServiceScene(serviceId: string, scene: Phaser.Scene | null): void {
    const service = this.lifecycleServices.get(serviceId);
    if (!service) {
      throw new Error(`Lifecycle service not found: ${serviceId}`);
    }

    // Remove from old scene
    const oldScene = service.getScene();
    if (oldScene) {
      const oldSceneServices = this.sceneServices.get(oldScene);
      if (oldSceneServices) {
        oldSceneServices.delete(serviceId);
        if (oldSceneServices.size === 0) {
          this.sceneServices.delete(oldScene);
        }
      }
    }

    // Add to new scene
    if (scene) {
      if (!this.sceneServices.has(scene)) {
        this.sceneServices.set(scene, new Set());
      }
      this.sceneServices.get(scene)?.add(serviceId);
    }

    service.setScene(scene);
  }

  unregisterService(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.onUnregister?.();
    }

    const lifecycleService = this.lifecycleServices.get(serviceId);
    if (lifecycleService) {
      const scene = lifecycleService.getScene();
      if (scene) {
        const sceneServices = this.sceneServices.get(scene);
        if (sceneServices) {
          sceneServices.delete(serviceId);
          if (sceneServices.size === 0) {
            this.sceneServices.delete(scene);
          }
        }
      }
      this.lifecycleServices.delete(serviceId);
    }

    this.services.delete(serviceId);
    this.dependencies.delete(serviceId);
  }

  clear(): void {
    for (const service of this.services.values()) {
      service.onUnregister?.();
    }
    this.services.clear();
    this.lifecycleServices.clear();
    this.sceneServices.clear();
    this.dependencies.clear();
    this.initialized = false;
  }

  registerDependencies(serviceId: string, dependencyIds: string[]): void {
    if (!this.hasService(serviceId)) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    for (const dependencyId of dependencyIds) {
      if (!this.hasService(dependencyId)) {
        throw new Error(`Dependency not found: ${dependencyId}`);
      }
      this.dependencies.get(serviceId)?.add(dependencyId);
    }
  }

  getServiceDependencies(serviceId: string): string[] {
    const deps = this.dependencies.get(serviceId);
    return deps ? Array.from(deps) : [];
  }

  private validateDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCircularDependency = (serviceId: string): void => {
      if (recursionStack.has(serviceId)) {
        throw new Error('Circular dependency detected');
      }

      if (visited.has(serviceId)) {
        return;
      }

      visited.add(serviceId);
      recursionStack.add(serviceId);

      const deps = this.dependencies.get(serviceId);
      if (deps) {
        for (const depId of deps) {
          checkCircularDependency(depId);
        }
      }

      recursionStack.delete(serviceId);
    };

    for (const serviceId of this.services.keys()) {
      if (!visited.has(serviceId)) {
        checkCircularDependency(serviceId);
      }
    }
  }

  private getInitializationOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (serviceId: string): void => {
      if (visited.has(serviceId)) {
        return;
      }

      visited.add(serviceId);

      const deps = this.dependencies.get(serviceId);
      if (deps) {
        for (const depId of deps) {
          visit(depId);
        }
      }

      order.push(serviceId);
    };

    for (const serviceId of this.services.keys()) {
      if (!visited.has(serviceId)) {
        visit(serviceId);
      }
    }

    return order;
  }

  private getShutdownOrder(): string[] {
    return this.getInitializationOrder().reverse();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.validateDependencies();
    const order = this.getInitializationOrder();

    for (const serviceId of order) {
      const service = this.services.get(serviceId);
      if (service?.initialize) {
        await service.initialize();
      }
    }

    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const order = this.getShutdownOrder();
    const errors: Error[] = [];

    for (const serviceId of order) {
      const service = this.services.get(serviceId);
      if (service?.shutdown) {
        try {
          await service.shutdown();
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    this.initialized = false;

    if (errors.length > 0) {
      throw new Error(`Shutdown failed: ${errors.map((e) => e.message).join(', ')}`);
    }
  }

  /**
   * Initializes the registry with basic services required by the application
   * This includes the EventBusService that's used for decoupled communication
   */
  async initializeBasicServices(): Promise<void> {
    if (!this.hasService('eventBus')) {
      // Dynamically import to avoid circular dependencies
      const EventBusModule = await import('./EventBusService');
      this.registerService('eventBus', new EventBusModule.EventBusService());
    }
  }
}
