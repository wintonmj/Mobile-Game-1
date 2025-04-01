# Phaser Scene Mocking Patterns

## Overview
This document outlines proven patterns and solutions for mocking Phaser scenes in unit tests, based on practical implementation experience. It provides reusable approaches that ensure reliable and maintainable tests.

## Table of Contents
1. [Common Challenges](#common-challenges)
2. [Recommended Patterns](#recommended-patterns)
3. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
4. [Implementation Examples](#implementation-examples)
5. [Best Practices](#best-practices)
6. [Integration Points](#integration-points)

## Common Challenges

### Scene Lifecycle Management
- Difficulty in controlling scene lifecycle events
- Complexity in mocking Phaser's internal systems
- Challenges with event emission and handling
- State management during testing

### Mock Implementation Issues
- Type safety with mock objects
- Maintaining mock state
- Callback handling
- Event system simulation

## Recommended Patterns

### Direct Scene Instantiation
Instead of using complex test beds, prefer direct scene instantiation for better control:

```typescript
// Preferred approach
const scene = new GameScene();
```

### Mock Object Structure
Define clear interfaces for mock objects to ensure type safety:

```typescript
interface MockSprite {
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setScale: jest.Mock;
  setDepth: jest.Mock;
  setAlpha: jest.Mock;
  setTint: jest.Mock;
  play: jest.Mock;
  on: jest.Mock;
}

interface MockText {
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setStyle: jest.Mock;
  setText: jest.Mock;
  on: jest.Mock;
}
```

### Scene Property Access
Make scene properties accessible for testing while maintaining encapsulation:

```typescript
class GameScene extends Scene {
  // Properties made public for testing
  sprite: any;
  text: any;
  
  // Regular scene implementation
}
```

### Mock Setup Pattern
Initialize mocks before scene creation:

```typescript
// Create mock objects
const spriteMock = {
  setPosition: jest.fn().mockReturnThis(),
  setOrigin: jest.fn().mockReturnThis(),
  // ... other methods
};

// Set up scene mocks
scene.add = {
  sprite: jest.fn().mockReturnValue(spriteMock),
  text: jest.fn().mockReturnValue(textMock)
} as any;

// Initialize scene
scene.create();
```

## Anti-Patterns to Avoid

1. **Complex Test Beds**
   - Avoid over-engineered test bed solutions
   - Don't mock more than necessary
   - Keep setup code simple and explicit

2. **Implicit Dependencies**
   - Don't rely on global state
   - Avoid hidden dependencies between tests
   - Make all mock setup explicit

3. **Brittle Mocks**
   - Don't create mocks that are too tightly coupled to implementation
   - Avoid excessive mock verification
   - Keep mock objects focused on essential behavior

## Implementation Examples

### Basic Scene Test Setup
```typescript
describe('GameScene', () => {
  let scene: GameScene;
  let spriteMock: MockSprite;
  let textMock: MockText;
  
  beforeEach(() => {
    // Create mock objects
    spriteMock = createSpriteMock();
    textMock = createTextMock();
    
    // Create and setup scene
    scene = new GameScene();
    setupSceneMocks(scene, spriteMock, textMock);
    
    // Initialize
    scene.create();
  });
  
  // Test cases...
});
```

### Event Handling Tests
```typescript
test('should handle input events correctly', () => {
  // Arrange
  let eventCallback: ((e: any) => void) | null = null;
  scene.input.on = jest.fn((event, callback) => {
    eventCallback = callback;
  });
  
  // Act
  scene.create();
  eventCallback?.({ x: 100, y: 100 });
  
  // Assert
  expect(spriteMock.setPosition).toHaveBeenCalledWith(100, 100);
});
```

## Best Practices

1. **Mock Organization**
   - Keep mock creation functions separate and reusable
   - Use consistent patterns across test files
   - Document mock behavior clearly

2. **Test Independence**
   - Reset all mocks between tests
   - Avoid shared state
   - Make test setup explicit

3. **Type Safety**
   - Define interfaces for mock objects
   - Use TypeScript's type system effectively
   - Avoid using `any` where possible

4. **Scene Lifecycle**
   - Mock only necessary lifecycle methods
   - Call lifecycle methods in the correct order
   - Clean up resources after tests

## Integration Points

### With Testing Framework
- Jest configuration for Phaser mocking
- Test helper utilities
- Custom matchers if needed

### With Type System
- TypeScript interfaces for mocks
- Type definitions for Phaser objects
- Custom type utilities

### With CI/CD Pipeline
- Test execution in CI environment
- Coverage reporting
- Integration with build process

## Future Considerations

1. **Extensibility**
   - Document patterns for new Phaser features
   - Support for different testing scenarios
   - Integration with new game features

2. **Maintenance**
   - Regular review of mocking patterns
   - Updates for new Phaser versions
   - Refinement based on team feedback

3. **Performance**
   - Optimization of test execution
   - Reduction of setup complexity
   - Improved mock reusability

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | [Current Date] | Initial documentation of scene mocking patterns |

## Related Documentation
- [Mocking Strategies](./mocking-strategies.md)
- [Test Data Strategy](./test-data-strategy.md)
- [Testing Standards](../standards/testing-standards.md)

## Mock Setup Sequence

### Import Ordering
The order of imports and mock setup is crucial for proper test functionality:

```typescript
// 1. First, import core dependencies
import { Scene } from 'phaser';
import { jest } from '@jest/globals';

// 2. Then import test utilities
import { SceneTestBed } from './helpers/scene-test-bed';

// 3. Finally, import the component under test
import { GameScene } from './GameScene';
```

### Mock Setup Order
The sequence of mock setup is critical:

1. **Define Mock Interfaces**
   ```typescript
   interface MockSprite {
     setPosition: jest.Mock;
     // ... other methods
   }
   ```

2. **Create Mock Objects**
   ```typescript
   const spriteMock = {
     setPosition: jest.fn().mockReturnThis(),
     // ... other methods
   };
   ```

3. **Initialize Scene**
   ```typescript
   const scene = new GameScene();
   ```

4. **Setup Scene Mocks**
   ```typescript
   scene.add = {
     sprite: jest.fn().mockReturnValue(spriteMock),
     // ... other mocks
   } as any;
   ```

5. **Initialize Scene Lifecycle**
   ```typescript
   scene.create();
   ```

### Common Pitfalls
- Setting up mocks after scene creation
- Missing jest import leading to undefined mocks
- Incorrect mock function initialization order
- Improper event callback registration timing

### Best Practices for Setup Sequence
1. Always import jest before creating any mocks
2. Define all mock interfaces before implementation
3. Create all mock objects before scene initialization
4. Set up scene mocks before calling lifecycle methods
5. Register event handlers before triggering events