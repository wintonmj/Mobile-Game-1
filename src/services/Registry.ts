export interface Service {
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  onRegister?: () => void;
  onUnregister?: () => void;
}

export class Registry {
  private services: Map<string, Service> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private initialized: boolean = false;

  registerService<T extends Service>(serviceId: string, serviceInstance: T): void {
    this.services.set(serviceId, serviceInstance);
    if (!this.dependencies.has(serviceId)) {
      this.dependencies.set(serviceId, new Set());
    }
    serviceInstance.onRegister?.();
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

  unregisterService(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.onUnregister?.();
    }
    this.services.delete(serviceId);
    this.dependencies.delete(serviceId);
  }

  clear(): void {
    for (const service of this.services.values()) {
      service.onUnregister?.();
    }
    this.services.clear();
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
}
