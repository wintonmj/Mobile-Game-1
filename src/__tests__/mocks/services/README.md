# Service Mocks

This directory contains mock implementations of services for testing purposes.

## MockConfigurationService

`MockConfigurationService` provides a test-friendly implementation of the `ConfigurationService` that doesn't require filesystem access or environment variables.

### Basic Usage

```typescript
import { createMockConfigurationService } from '../mocks/services/MockConfigurationService';

// Create a mock configuration service with the default 'dev' environment
const configService = createMockConfigurationService();

// Or specify a different environment
const prodConfigService = createMockConfigurationService('prod');
```

### Environment Control

The mock provides methods to easily change environments during tests:

```typescript
// Change the environment
await configService.loadConfiguration('test');

// Check the environment
expect(configService.getEnvironment()).toBe('test');
expect(configService.isTestingEnvironment()).toBe(true);
```

### Configuration Values

Default configuration values are provided based on the environment:

```typescript
// Default values per environment
const difficulty = configService.get('game.difficulty');
// 'easy' for 'dev', 'medium' for 'test', 'hard' for 'prod'

const maxPlayers = configService.get('game.maxPlayers');
// 4 for 'dev', 2 for 'test', 8 for 'prod'
```

You can also set custom configuration values:

```typescript
// Set a specific configuration value
configService.set('game.difficulty', 'custom');
configService.set('newSetting', true);

// Get the custom value
expect(configService.get('game.difficulty')).toBe('custom');
```

### Using with Registry

The mock fully implements the `Service` interface and can be used with the Registry:

```typescript
import { Registry } from '../../../services/Registry';
import { createMockConfigurationService } from '../mocks/services/MockConfigurationService';

const registry = new Registry();
const configService = createMockConfigurationService('prod');

registry.registerService('config', configService);
await registry.initialize();
```

### Why Use This Mock

1. No filesystem dependencies
2. Predictable, controlled behavior
3. Environment-specific configuration
4. Full implementation of the Service interface
5. Configurable through an easy-to-use API 