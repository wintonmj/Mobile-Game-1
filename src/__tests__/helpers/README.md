# Using Model-Context-Protocol for Game Testing

This guide explains how to use our model-context-protocol implementation to improve testing by capturing browser errors.

## Key Features

- Track and assert browser errors in tests
- Access the browser context for rendering tests
- Simplify testing of JavaScript execution in the browser environment
- Detect rendering issues and runtime errors

## Getting Started

### 1. Import the ModelContextTest class

```typescript
import { ModelContextTest } from '../helpers/modelContextTest';
```

### 2. Wrap your test functions with ModelContextTest.createTest

```typescript
it('should render without errors', ModelContextTest.createTest(async () => {
  // Your test code here
  
  // Assert no browser errors occurred
  ModelContextTest.assertNoErrors();
}));
```

### 3. Wait for browser rendering

```typescript
await ModelContextTest.waitForRender();
```

### 4. Execute code in the browser context

```typescript
ModelContextTest.executeInBrowserContext(() => {
  // Code that might throw browser-specific errors
});
```

### 5. Assert on errors

```typescript
// Assert no errors occurred
ModelContextTest.assertNoErrors();

// Assert specific error occurred
ModelContextTest.assertErrorMatching(/Failed to load resource/);
```

## Example: Testing Animation Loading

```typescript
it('should load player animations without errors', ModelContextTest.createTest(async () => {
  // Create the animation loader
  const loader = new PlayerAnimationLoader(scene);
  
  // Load animations
  loader.preloadAnimations();
  
  // Wait for any async operations
  await ModelContextTest.waitForRender();
  
  // Create animations
  loader.createAnimations();
  
  // Assert no browser errors occurred
  ModelContextTest.assertNoErrors();
}));
```

## Browser Error Types Captured

- JavaScript runtime errors
- Resource loading failures
- Animation creation errors
- WebGL context errors
- Console errors

## Best Practices

1. Always assert on errors at the end of your test
2. Use waitForRender() when testing anything visual
3. Use executeInBrowserContext() for potentially problematic code
4. Clean browser state between tests (already handled by the test wrapper)
5. Keep tests focused on one aspect at a time 