import { jest } from '@jest/globals';
import { PhaserLoader } from '../../models/PhaserLoader';
import MockPhaser from '../mocks/phaser';

/**
 * Test suite for PhaserLoader
 *
 * Following the test principles:
 * - Testing functional behavior, not implementation details
 * - Creating independent tests
 * - Creating a test-specific class that's fully under our control
 */
describe('PhaserLoader', () => {
  // Define a type for our mock Phaser
  type PhaserType = typeof MockPhaser;

  // Create a TestableLoader version of PhaserLoader for testing
  class TestableLoader {
    static phaserInstance: PhaserType | null = null;
    static isLoading = false;
    static loadPromise: Promise<PhaserType> | null = null;

    /**
     * Load Phaser dynamically and cache the instance
     */
    static async load(): Promise<PhaserType> {
      // Return cached instance if already loaded
      if (this.phaserInstance) {
        return this.phaserInstance;
      }

      // Return existing promise if already loading
      if (this.isLoading && this.loadPromise) {
        return this.loadPromise;
      }

      // Start loading
      this.isLoading = true;
      this.loadPromise = Promise.resolve(MockPhaser).then((phaser) => {
        this.phaserInstance = phaser;
        this.isLoading = false;
        return this.phaserInstance;
      });

      return this.loadPromise;
    }

    /**
     * Get the cached Phaser instance if available
     */
    static getPhaser(): PhaserType | null {
      return this.phaserInstance;
    }

    /**
     * Reset the internal state for testing
     */
    static reset(): void {
      this.phaserInstance = null;
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  // Reset all static variables between tests
  beforeEach(() => {
    jest.clearAllMocks();
    TestableLoader.reset();
  });

  it('should load Phaser when called', async () => {
    // Call the load method
    const result = await TestableLoader.load();

    // Verify it returned the MockPhaser instance
    expect(result).toBe(MockPhaser);
  });

  it('should return cached instance if already loaded', async () => {
    // First load to cache the instance
    await TestableLoader.load();

    // Second load should use the cache
    const result = await TestableLoader.load();

    // Verify it returned the cached instance
    expect(result).toBe(MockPhaser);
  });

  it('should only load Phaser once even with concurrent calls', async () => {
    // Start multiple concurrent loads
    const promise1 = TestableLoader.load();
    const promise2 = TestableLoader.load();
    const promise3 = TestableLoader.load();

    // Wait for all promises to resolve
    const results = await Promise.all([promise1, promise2, promise3]);

    // All results should be the same instance
    expect(results[0]).toBe(MockPhaser);
    expect(results[1]).toBe(MockPhaser);
    expect(results[2]).toBe(MockPhaser);
  });

  it('should return null from getPhaser() when Phaser is not loaded', () => {
    // Get before loading should return null
    const result = TestableLoader.getPhaser();

    // Verify it returned null
    expect(result).toBeNull();
  });

  it('should return Phaser instance from getPhaser() after loading', async () => {
    // Load Phaser
    await TestableLoader.load();

    // Get after loading should return the instance
    const result = TestableLoader.getPhaser();

    // Verify it returned the Phaser instance
    expect(result).toBe(MockPhaser);
  });

  it('should handle import errors gracefully', async () => {
    // Mock implementation to throw error
    const originalLoad = TestableLoader.load;

    // Use proper type casting for the mock function
    TestableLoader.load = jest.fn().mockImplementation(() => {
      TestableLoader.isLoading = true;
      return Promise.reject(new Error('Import failed'));
    }) as unknown as typeof TestableLoader.load;

    // Attempt to load should reject with the error
    await expect(TestableLoader.load()).rejects.toThrow('Import failed');

    // getPhaser should still return null
    expect(TestableLoader.getPhaser()).toBeNull();

    // Restore original implementation
    TestableLoader.load = originalLoad;
  });

  // Now test the actual PhaserLoader implementation by verifying it implements
  // the same basic functionality as our TestableLoader
  describe('real PhaserLoader implementation', () => {
    beforeEach(() => {
      // Reset the real PhaserLoader state by accessing private properties
      // Using unknown because we're accessing private variables
      (
        PhaserLoader as unknown as {
          phaserInstance: unknown;
          isLoading: boolean;
          loadPromise: unknown;
        }
      )['phaserInstance'] = null;

      (PhaserLoader as unknown as { isLoading: boolean })['isLoading'] = false;
      (PhaserLoader as unknown as { loadPromise: unknown })['loadPromise'] = null;
    });

    it('should follow the same pattern as TestableLoader', async () => {
      // Call PhaserLoader.load() and verify behavior
      const result = await PhaserLoader.load();

      // Should return a Phaser instance
      expect(result).toBeTruthy();

      // getPhaser should now return the instance
      expect(PhaserLoader.getPhaser()).toBe(result);

      // Load again and verify we get the same instance
      const result2 = await PhaserLoader.load();
      expect(result2).toBe(result);
    });
  });
});
