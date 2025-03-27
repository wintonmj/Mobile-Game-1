export class Registry {
  private services: Map<string, unknown> = new Map();

  registerService<T>(serviceId: string, serviceInstance: T): void {
    this.services.set(serviceId, serviceInstance);
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
    this.services.delete(serviceId);
  }

  clear(): void {
    this.services.clear();
  }
} 