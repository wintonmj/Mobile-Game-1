# Test Helpers

## Overview
This directory contains test utilities, helper functions, and common testing infrastructure used across all test types. These helpers ensure consistent testing patterns and reduce code duplication.

## Directory Structure
```
helpers/
├── factories/       # Test data factories
├── mocks/          # Common mock implementations
├── utils/          # Testing utility functions
└── fixtures/       # Test fixtures and data
```

## Helper Categories

### Test Factories
```typescript
// Entity factory example
export const createTestPlayer = (overrides = {}) => ({
  id: 'test-player',
  health: 100,
  position: { x: 0, y: 0 },
  inventory: [],
  ...overrides
});

// Scene factory example
export const createTestScene = (config = {}) => {
  return new TestScene({
    active: false,
    visible: false,
    ...config
  });
};
```

### Common Mocks
```typescript
// Service mock example
export const createMockEventBus = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  clear: jest.fn()
});

// Phaser mock example
export const createMockGame = () => ({
  scene: {
    add: jest.fn(),
    remove: jest.fn()
  },
  input: {
    keyboard: {
      addKey: jest.fn()
    }
  }
});
```

### Testing Utilities
```typescript
// Async helper
export const waitForEvent = (eventBus, eventName, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event ${eventName} not emitted within ${timeout}ms`));
    }, timeout);

    eventBus.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

// State helper
export const getGameState = () => {
  return TestBed.inject(GameState);
};
```

## Common Patterns

### Setup Helpers
```typescript
export const setupTestEnvironment = async () => {
  const gameState = await TestBed.createService(GameState);
  const eventBus = await TestBed.createService(EventBus);
  const player = createTestPlayer();
  
  return { gameState, eventBus, player };
};
```

### Cleanup Helpers
```typescript
export const cleanupTestEnvironment = async () => {
  await TestBed.resetTestingModule();
  jest.clearAllMocks();
};
```

## Best Practices
1. Keep helpers focused and reusable
2. Document helper functions clearly
3. Use TypeScript for type safety
4. Handle cleanup properly
5. Follow consistent patterns

## Usage Examples
```typescript
describe('Player Combat', () => {
  let testEnv;

  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  it('should handle combat sequence', async () => {
    const { player } = testEnv;
    const enemy = createTestEnemy();
    
    await initiateCombat(player, enemy);
    expect(enemy.health).toBeLessThan(100);
  });
});
```

## Related Documentation
- [Test Implementation Details](../test-implementation-details.md)
- [Mocking Strategies](../mocking/strategies.md)
- [Testing Standards](../testing-standards.md)
