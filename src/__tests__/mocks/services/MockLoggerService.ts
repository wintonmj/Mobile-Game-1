import { ILoggerService } from '../../../services/interfaces/ILoggerService';

export class MockLoggerService implements ILoggerService {
  private logs: string[] = [];

  log(message: string): void {
    this.logs.push(`[LOG] ${message}`);
  }

  error(message: string): void {
    this.logs.push(`[ERROR] ${message}`);
  }

  warn(message: string): void {
    this.logs.push(`[WARN] ${message}`);
  }

  debug(message: string): void {
    this.logs.push(`[DEBUG] ${message}`);
  }

  getLogs(): string[] {
    return [...this.logs];
  }
}
