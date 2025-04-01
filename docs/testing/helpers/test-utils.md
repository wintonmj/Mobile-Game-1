# Testing Utilities

## Overview
This document provides documentation for general testing utilities used across the project. These utilities help with common testing tasks, data generation, and test setup.

## Contents
- [Test Setup Utilities](#test-setup-utilities)
- [Data Generation](#data-generation)
- [Time Management](#time-management)
- [Event Testing](#event-testing)
- [Examples](#examples)

## Test Setup Utilities

### Test Environment Setup
```typescript
// tests/helpers/test-setup.ts
export class TestSetup {
  static configureTestEnvironment(): void {
    // Configure Jest environment
    jest.useFakeTimers();
    
    // Mock window properties
    global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
    global.cancelAnimationFrame = jest.fn();
    
    // Mock canvas
    global.HTMLCanvasElement.prototype.getContext = () => ({
      // Basic canvas context mock
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn()
    });
  }
  
  static cleanupTestEnvironment(): void {
    jest.useRealTimers();
    jest.clearAllMocks();
  }
}
```

### Test Data Context
```typescript
export class TestContext<T = any> {
  private context: Map<string, T> = new Map();
  
  set(key: string, value: T): void {
    this.context.set(key, value);
  }
  
  get(key: string): T | undefined {
    return this.context.get(key);
  }
  
  clear(): void {
    this.context.clear();
  }
}
```

## Data Generation

### Random Data Generators
```typescript
export class TestDataGenerator {
  static createRandomPlayer(config: Partial<PlayerConfig> = {}): PlayerConfig {
    return {
      id: `player-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Player ${Math.floor(Math.random() * 1000)}`,
      health: Math.floor(Math.random() * 100) + 50,
      level: Math.floor(Math.random() * 10) + 1,
      ...config
    };
  }
  
  static createRandomItem(config: Partial<ItemConfig> = {}): ItemConfig {
    const types = ['weapon', 'armor', 'potion', 'scroll'];
    return {
      id: `item-${Math.random().toString(36).substr(2, 9)}`,
      type: types[Math.floor(Math.random() * types.length)],
      value: Math.floor(Math.random() * 100),
      ...config
    };
  }
  
  static createRandomPosition(): Vector2 {
    return {
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600)
    };
  }
}
```

### Mock Data Factories
```typescript
export class MockFactory {
  static createMockEventEmitter(): jest.Mocked<EventEmitter> {
    return {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn()
    } as unknown as jest.Mocked<EventEmitter>;
  }
  
  static createMockStorage(): jest.Mocked<Storage> {
    const store: { [key: string]: string } = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn(),
      length: 0
    } as unknown as jest.Mocked<Storage>;
  }
}
```

## Time Management

### Time Control Utilities
```typescript
export class TimeController {
  private currentTime: number = 0;
  
  advanceTime(milliseconds: number): void {
    this.currentTime += milliseconds;
    jest.advanceTimersByTime(milliseconds);
  }
  
  async waitForNextFrame(): Promise<void> {
    await new Promise(resolve => requestAnimationFrame(resolve));
    this.currentTime += 16.67; // Approximate frame time
  }
  
  async waitForFrames(frames: number): Promise<void> {
    for (let i = 0; i < frames; i++) {
      await this.waitForNextFrame();
    }
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  reset(): void {
    this.currentTime = 0;
    jest.clearAllTimers();
  }
}
```

## Event Testing

### Event Assertion Utilities
```typescript
export class EventAssertion {
  private events: Array<{ type: string, data?: any }> = [];
  
  recordEvent(type: string, data?: any): void {
    this.events.push({ type, data });
  }
  
  assertEventEmitted(type: string, data?: any): void {
    const event = this.events.find(e => e.type === type);
    expect(event).toBeDefined();
    if (data) {
      expect(event?.data).toMatchObject(data);
    }
  }
  
  assertEventSequence(sequence: Array<{ type: string, data?: any }>): void {
    expect(this.events.length).toBeGreaterThanOrEqual(sequence.length);
    sequence.forEach((expected, index) => {
      expect(this.events[index].type).toBe(expected.type);
      if (expected.data) {
        expect(this.events[index].data).toMatchObject(expected.data);
      }
    });
  }
  
  clear(): void {
    this.events = [];
  }
}
```

## Examples

### Using Test Setup
```typescript
describe('Game Component', () => {
  beforeAll(() => {
    TestSetup.configureTestEnvironment();
  });
  
  afterAll(() => {
    TestSetup.cleanupTestEnvironment();
  });
  
  test('should render game canvas', () => {
    const game = new Game();
    expect(game.canvas).toBeDefined();
  });
});
```

### Using Data Generation
```typescript
describe('Player Interactions', () => {
  test('should handle item pickup', () => {
    const player = TestDataGenerator.createRandomPlayer();
    const item = TestDataGenerator.createRandomItem({ type: 'weapon' });
    
    player.pickupItem(item);
    
    expect(player.inventory).toContain(item);
  });
});
```

### Using Time Control
```typescript
describe('Animation System', () => {
  let timeController: TimeController;
  
  beforeEach(() => {
    timeController = new TimeController();
  });
  
  test('should complete animation after duration', async () => {
    const animation = new Animation({ duration: 1000 });
    animation.start();
    
    timeController.advanceTime(500);
    expect(animation.progress).toBe(0.5);
    
    timeController.advanceTime(500);
    expect(animation.isComplete).toBe(true);
  });
});
```

### Using Event Assertion
```typescript
describe('Combat System', () => {
  let eventAssertion: EventAssertion;
  
  beforeEach(() => {
    eventAssertion = new EventAssertion();
  });
  
  test('should emit correct combat sequence', () => {
    const combat = new CombatSystem();
    combat.on('*', (type, data) => eventAssertion.recordEvent(type, data));
    
    combat.start();
    
    eventAssertion.assertEventSequence([
      { type: 'combatStart' },
      { type: 'turnStart', data: { round: 1 } },
      { type: 'action', data: { type: 'attack' } },
      { type: 'turnEnd' }
    ]);
  });
});
```

## Best Practices

1. **Test Setup**
   - Use consistent environment configuration
   - Clean up after tests
   - Reset state between tests
   - Mock external dependencies

2. **Data Generation**
   - Generate realistic test data
   - Use type-safe generators
   - Provide customization options
   - Document data constraints

3. **Time Management**
   - Use fake timers consistently
   - Control animation frames
   - Handle async operations
   - Test time-dependent features

4. **Event Testing**
   - Record events accurately
   - Test event sequences
   - Verify event payloads
   - Clean up event listeners

## Version Control
- Version: 1.0.0
- Last Updated: [Current Date]
- Status: Active 