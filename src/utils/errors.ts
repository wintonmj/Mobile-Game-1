export class ConfigurationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigurationValidationError extends ConfigurationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ConfigurationValidationError';
  }
}

export class ConfigurationParseError extends ConfigurationError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'ConfigurationParseError';
  }
}
