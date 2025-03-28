# Timeout Errors in Testing

## Overview
Timeout errors occur when a test takes longer than the specified maximum time to complete. In Jest, the default timeout is 5000ms (5 seconds), but this can be adjusted based on the needs of your tests.

## Common Causes

### 1. Async Operations Not Completing
- Promises not resolving
- Event listeners not firing
- Callbacks not being called
- Infinite loops in async code

### 2. Timer Synchronization Issues
- Fake timers not properly advancing
- Real timers interfering with fake timers
- Timer mocks not properly set up
- Missing timer cleanup

### 3. Mock Implementation Problems
- Incorrect mock function implementations
- Missing mock implementations
- Circular dependencies in mocks
- Mock functions not properly resolving

### 4. Resource Loading Issues
- Asset loading not properly simulated
- Network requests not properly mocked
- File system operations not properly mocked
- Cache operations not completing

## Solutions

### 1. Proper Timer Setup
```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
```

### 2. Async Operation Handling
```typescript
// Use proper async/await
test('async test', async () => {
  await someAsyncOperation();
  expect(result).toBe(expected);
});

// Or use done callback
test('async test with done', (done) => {
  someAsyncOperation().then(() => {
    expect(result).toBe(expected);
    done();
  });
});
```

### 3. Mock Implementation
```typescript
// Proper mock implementation
jest.mock('someModule', () => ({
  someFunction: jest.fn().mockResolvedValue(expectedValue)
}));

// Or inline mock
const mockFunction = jest.fn().mockImplementation(() => {
  return Promise.resolve(expectedValue);
});
```

### 4. Timeout Configuration
```typescript
// Global timeout configuration
jest.setTimeout(10000);

// Per-test timeout
test('long running test', async () => {
  // test code
}, 10000);
```

## Best Practices

1. **Start Small**
   - Begin with minimal test setup
   - Add complexity gradually
   - Verify each step works

2. **Proper Cleanup**
   - Clean up timers
   - Reset mocks
   - Clear event listeners

3. **Async Handling**
   - Use async/await consistently
   - Handle all promise rejections
   - Use proper error boundaries

4. **Mock Management**
   - Keep mocks simple
   - Document mock behavior
   - Verify mock calls

5. **Timer Management**
   - Use fake timers when possible
   - Advance timers properly
   - Clean up timer state

## Debugging Tips

1. **Add Logging**
   ```typescript
   test('debugging test', async () => {
     console.log('Test started');
     await someOperation();
     console.log('Operation completed');
   });
   ```

2. **Use Jest Debug Mode**
   ```bash
   jest --debug
   ```

3. **Check Promise Chain**
   ```typescript
   test('debug promise chain', async () => {
     const promise = someOperation()
       .then(result => {
         console.log('First then');
         return result;
       })
       .then(result => {
         console.log('Second then');
         return result;
       });
     await promise;
   });
   ```

4. **Verify Timer State**
   ```typescript
   test('debug timer state', () => {
     jest.useFakeTimers();
     console.log('Timer state:', jest.getTimerCount());
     // ... test code
   });
   ```

## Common Patterns

### 1. Loading Tests
```typescript
test('loading test', async () => {
  const loader = new AssetLoader();
  const loadPromise = loader.load('asset.png');
  
  // Simulate load completion
  jest.advanceTimersByTime(1000);
  
  await loadPromise;
  expect(loader.isLoaded()).toBe(true);
});
```

### 2. Event Tests
```typescript
test('event test', (done) => {
  const emitter = new EventEmitter();
  
  emitter.on('complete', () => {
    expect(result).toBe(expected);
    done();
  });
  
  // Trigger event
  emitter.emit('complete');
});
```

### 3. Cache Tests
```typescript
test('cache test', async () => {
  const cache = new Cache();
  
  // Setup cache
  await cache.set('key', 'value');
  
  // Verify cache
  expect(cache.get('key')).toBe('value');
  
  // Clear cache
  cache.clear();
  
  // Verify cleared state
  expect(cache.get('key')).toBeUndefined();
});
```

## Prevention

1. **Code Review Checklist**
   - [ ] All async operations properly handled
   - [ ] Timers properly managed
   - [ ] Mocks properly implemented
   - [ ] Cleanup properly performed

2. **Test Design Guidelines**
   - Keep tests focused and atomic
   - Minimize dependencies
   - Use proper setup and teardown
   - Document complex test scenarios

3. **Monitoring**
   - Track test execution times
   - Monitor for flaky tests
   - Review timeout configurations
   - Analyze test patterns 

test('should keep persistent assets in cache', async () => {
  console.log('Test started');
  // 1. Setup with minimal mocks
  const key = 'persistent-asset';
  
  // 2. Register asset
  assetService.registerAsset(key, 'assets/test.png', AssetType.IMAGE, {
    cachePolicy: CachePolicy.PERSISTENT
  });

  // 3. Mock load completion
  mockScene.load.once.mockImplementation((event, callback) => {
    if (event === 'filecomplete') {
      callback(key);
    } else if (event === 'complete') {
      callback();
    }
  });

  // 4. Load asset and wait for completion
  const loadPromise = assetService.loadAsset(key);
  jest.advanceTimersByTime(0); // Advance timers to trigger callbacks
  await loadPromise;

  // 5. Verify initial state
  expect(assetService.isLoaded(key)).toBe(true);

  // 6. Clear assets
  assetService.clearAssets();

  // 7. Verify persistent asset remains
  expect(assetService.isLoaded(key)).toBe(true);
  expect(() => assetService.getTexture(key)).not.toThrow();
  console.log('Asset loaded');
  console.log('Test completed');
}); 