# Mocks vs Helpers in Testing

## Overview
This document explains the key differences between mocks and helpers in our testing infrastructure, their purposes, and when to use each approach. Understanding these differences is crucial for maintaining clean and effective tests.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Implementation Patterns](#implementation-patterns)
3. [Usage Guidelines](#usage-guidelines)
4. [Best Practices](#best-practices)
5. [Examples](#examples)

## Core Concepts

### Mocks (`__mocks__/`)
Mocks are direct replacements for external modules and dependencies.

#### Purpose
- Replace real implementations with controlled versions
- Simulate external module behavior
- Control dependency responses in tests
- Provide basic implementations for complex systems

#### Characteristics
```typescript
// Example from __mocks__/phaser.js
class Scene {
  constructor(config) {
    // Basic mock implementation
    this.add = {
      sprite: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis()
      }))
    };
  }
}
```

### Helpers (`tests/helpers/`)
Helpers are utility functions that simplify test setup and provide additional functionality.

#### Purpose
- Provide utility functions for test setup
- Create pre-configured mock instances
- Simplify common testing patterns
- Add type safety and validation

#### Characteristics
```typescript
// Example from tests/helpers/phaser-mock.ts
export function createMockScene() {
  const mockScene = {
    // Helper provides pre-configured mock with common settings
    add: {
      sprite: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        // Additional helper methods
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      })),
    },
    // Helper includes additional utility methods
    events: {
      emit: jest.fn(),
      on: jest.fn()
    }
  };
  return mockScene;
}
```

## Implementation Patterns

### Key Differences

1. **Level of Abstraction**
   - Mocks: Low-level, basic implementations
   - Helpers: High-level, convenient utilities

2. **Usage Pattern**
   ```typescript
   // Mock usage (automatic)
   jest.mock('phaser');
   
   // Helper usage (explicit)
   const scene = createMockScene();
   ```

3. **Functionality**
   - Mocks: Replace real implementations
   - Helpers: Provide testing utilities and setup

4. **Type Safety**
   - Mocks: Basic JavaScript implementations
   - Helpers: TypeScript types and interfaces

5. **Configuration**
   - Mocks: Fixed behavior
   - Helpers: Configurable behavior

### Project Organization
```
project/
├── __mocks__/           # Basic mock implementations
│   └── phaser.js        # Replaces Phaser module
└── tests/
    └── helpers/         # Testing utilities
        ├── phaser-mock.ts    # Scene creation helpers
        └── scene-test-bed.ts # Testing environment setup
```

## Usage Guidelines

### When to Use Mocks
1. Replacing external module functionality
2. Basic simulation of dependencies
3. Automatic module mocking with Jest
4. Simple, fixed behaviors

```typescript
// Using mocks
jest.mock('phaser');
import { Scene } from 'phaser';

describe('Game Scene', () => {
  it('should initialize', () => {
    const scene = new Scene();
    // Test with basic mock functionality
  });
});
```

### When to Use Helpers
1. Complex test setup scenarios
2. Reusable test configurations
3. Type-safe test utilities
4. Configurable test behaviors

```typescript
// Using helpers
import { createMockScene } from '../helpers/phaser-mock';

describe('Game Scene', () => {
  it('should handle complex setup', () => {
    const scene = createMockScene({
      add: customSpriteMock,
      input: customInputMock
    });
    // Test with helper-provided utilities
  });
});
```

## Best Practices

1. **Mock Implementation**
   - Keep mocks simple and focused
   - Implement only necessary functionality
   - Use Jest's mock functions appropriately
   - Document mock behavior

2. **Helper Design**
   - Make helpers reusable and configurable
   - Provide clear TypeScript types
   - Include validation and error checking
   - Document helper functionality

3. **Maintenance**
   - Update mocks when external APIs change
   - Keep helpers aligned with testing patterns
   - Regularly review and refactor
   - Maintain documentation

## Examples

### Complex Testing Scenario
```typescript
// Combined usage of mocks and helpers
jest.mock('phaser'); // Use basic mock

describe('Game Feature', () => {
  let scene;
  let spriteMock;

  beforeEach(() => {
    // Use helper for complex setup
    scene = createMockScene();
    spriteMock = createMockSprite({
      x: 100,
      y: 100
    });
  });

  it('should handle game logic', () => {
    // Test implementation
  });
});
```

## Related Documentation
- [Jest Testing Strategy](../jest-testing-strategy.md)
- [Test Implementation Details](../test-implementation-details.md)
- [Phaser.js Mocking Utilities](../helpers/phaser-mock.md)

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | [Current Date] | Initial documentation of mocks vs helpers | 