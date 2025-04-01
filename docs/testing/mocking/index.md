# Mocking Strategies

## Overview
This directory contains mocking strategies, patterns, and implementations used across the test suite. Proper mocking is essential for isolating components and ensuring reliable tests.

## Directory Structure
```
mocking/
├── services/        # Service mock implementations
├── components/      # Component mock implementations
├── systems/         # Game system mocks
└── external/        # External dependency mocks
```

## Mock Categories

### Service Mocks
- Game state service
- Event bus service
- Audio service
- Input service
- Scene service
- Network service

### Component Mocks
- UI components
- Game entities
- Scene components
- Input handlers
- Visual effects

### System Mocks
- Physics system
- Collision system
- Animation system
- Particle system
- Sound system

### External Mocks
- Browser APIs
- WebGL context
- Network requests
- Local storage
- Audio context

## Implementation Patterns

### Service Mocking
```typescript
export class MockGameStateService implements IGameStateService {
  private state: GameState = {
    player: null,
    level: 1,
    score: 0
  };

  getState(): GameState {
    return this.state;
  }

  setState(newState: Partial<GameState>): void {
    this.state = { ...this.state, ...newState };
  }

  reset(): void {
    this.state = {
      player: null,
      level: 1,
      score: 0
    };
  }
}
```

### Component Mocking
```typescript
export const MockPlayerComponent = {
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  update: jest.fn(),
  move: jest.fn(),
  attack: jest.fn(),
  takeDamage: jest.fn()
};
```

### System Mocking
```typescript
export const MockPhysicsSystem = {
  update: jest.fn(),
  addBody: jest.fn(),
  removeBody: jest.fn(),
  setGravity: jest.fn(),
  checkCollision: jest.fn()
};
```

## Best Practices

### Mock Implementation
1. Keep mocks simple
2. Implement only needed functionality
3. Use TypeScript interfaces
4. Maintain type safety
5. Document mock behavior

### Mock Usage
1. Reset mocks between tests
2. Verify mock interactions
3. Use appropriate mock types
4. Handle async operations
5. Clean up resources

### Common Patterns
```typescript
describe('Combat System', () => {
  let mockPlayer;
  let mockEnemy;
  let mockEventBus;

  beforeEach(() => {
    mockPlayer = createMockPlayer();
    mockEnemy = createMockEnemy();
    mockEventBus = createMockEventBus();
  });

  it('should handle combat sequence', () => {
    // Arrange
    const combat = new CombatSystem(mockEventBus);
    
    // Act
    combat.initiateCombat(mockPlayer, mockEnemy);
    
    // Assert
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'COMBAT_STARTED',
      expect.any(Object)
    );
  });
});
```

## Testing Utilities

### Mock Factories
```typescript
export const createMockService = <T>(
  implementation: Partial<T>
): jest.Mocked<T> => {
  const mock = jest.fn(() => implementation);
  return mock() as jest.Mocked<T>;
};
```

### Verification Helpers
```typescript
export const verifyMockCalls = (
  mock: jest.Mock,
  expectedCalls: any[][]
) => {
  expect(mock.mock.calls).toEqual(expectedCalls);
};
```

## Common Issues and Solutions

### Timing Issues
- Use fake timers
- Mock async operations
- Handle promises properly
- Control event timing
- Manage timeouts

### State Management
- Reset mock state
- Track mock interactions
- Verify state changes
- Handle side effects
- Clean up between tests

## Related Documentation
- [Test Helpers](../helpers/index.md)
- [Integration Testing](../integration-testing/index.md)
- [Jest Configuration](../jest-testing-strategy.md)

## Contents

1. [Mocking Strategies](./mocking-strategies.md)
   - General Mocking Patterns
   - Service Mocking
   - Component Mocking
   - Phaser-Specific Mocking Strategies
   - Best Practices and Anti-Patterns
