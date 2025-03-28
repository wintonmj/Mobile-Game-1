/**
 * Base interface for all services registered in the Registry
 */
export interface Service {
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
  onRegister?: () => void;
  onUnregister?: () => void;
}

/**
 * Interface for the Registry service that manages all other services
 */
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
} 