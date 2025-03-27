/**
 * A utility for lazily loading the Phaser library
 * This follows our MVC pattern by centralizing the Phaser import logic
 */

// Import types only
import type Phaser from 'phaser';

let phaserInstance: typeof Phaser | null = null;
let isLoading = false;
let loadPromise: Promise<typeof Phaser> | null = null;

export class PhaserLoader {
  /**
   * Load Phaser dynamically and cache the instance
   * @returns Promise that resolves to the Phaser instance
   */
  public static async load(): Promise<typeof Phaser> {
    // Return cached instance if already loaded
    if (phaserInstance) {
      return phaserInstance;
    }

    // Return existing promise if already loading
    if (isLoading && loadPromise) {
      return loadPromise;
    }

    // Start loading
    isLoading = true;
    loadPromise = import('phaser').then((module) => {
      phaserInstance = module.default;
      isLoading = false;
      return phaserInstance;
    });

    return loadPromise;
  }

  /**
   * Get the cached Phaser instance if available
   * @returns The Phaser instance or null if not yet loaded
   */
  public static getPhaser(): typeof Phaser | null {
    return phaserInstance;
  }
}
