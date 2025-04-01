import { IGameService } from './IGameService';

/**
 * Service identifier type
 */
export type ServiceId = string;

/**
 * Service constructor type
 */
export type ServiceConstructor<T extends IGameService> = new (...args: unknown[]) => T;

/**
 * Service dependency configuration
 */
export interface ServiceDependency {
  serviceId: ServiceId;
  required: boolean;
}

/**
 * Service registration configuration
 */
export interface ServiceConfig {
  id: ServiceId;
  dependencies?: ServiceDependency[];
  initPriority?: number;
}

/**
 * Service registration entry in the registry
 */
export interface ServiceEntry {
  service: IGameService;
  config: ServiceConfig;
  initialized: boolean;
}

/**
 * Service lifecycle states
 */
export enum ServiceState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  DESTROYING = 'DESTROYING',
  DESTROYED = 'DESTROYED',
  ERROR = 'ERROR'
} 