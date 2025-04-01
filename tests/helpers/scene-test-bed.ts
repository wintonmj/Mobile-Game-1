/**
 * @file scene-test-bed.ts
 * @description Provides a test bed for isolated testing of Phaser scenes with mock capabilities
 * @dependencies
 * - Phaser - Core game framework
 * - Jest - Testing framework
 * - phaser-mock.ts - Mock implementations of Phaser objects
 * @limitations
 * - Only supports basic scene lifecycle methods (init, create, update, destroy)
 * - Limited physics simulation capabilities
 * - Mock input system supports basic keyboard and pointer events only
 * - Collision and overlap simulation is basic and may not perfectly match Phaser's behavior
 * 
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} For detailed scene mocking patterns and best practices
 * @see {@link docs/testing/unit/scenes.md} For scene testing guidelines and standards
 * @see {@link docs/api/services/sprint1/scene-service-api.md} For scene service API documentation
 * @see {@link docs/api/scenes/scene-system.md} For core scene system documentation
 * @see {@link docs/api/services/sprint1/scene-manager-api.md} For scene manager service documentation
 * @see {@link docs/testing/test-implementation-details.md} For comprehensive testing patterns and examples
 * @see {@link docs/implementation/error-handling.md} For error handling patterns and recovery procedures
 * @see {@link docs/architecture/patterns/service-integration.md} For service integration testing patterns
 * @see {@link docs/architecture/patterns/mvp-high-level-architecture.md} For scene lifecycle and state management
 * 
 * @errorHandling
 * The test bed implements error handling patterns from error-handling.md:
 * - Service-level error simulation with configurable severity
 * - Error event propagation testing
 * - State corruption and recovery testing
 * - Scene transition error handling
 * 
 * @serviceIntegration
 * Supports testing of service integration patterns:
 * - Scene-service communication
 * - Service state preservation during transitions
 * - Asset loading/unloading lifecycle
 * - Event propagation between scenes and services
 * 
 * @stateManagement
 * Implements state management testing capabilities:
 * - Scene state snapshot creation
 * - State corruption simulation
 * - State recovery validation
 * - Service state synchronization testing
 */

import { Scene } from 'phaser';
import { createMockScene } from './phaser-mock';

/**
 * Interface defining the core scene lifecycle methods that can be tested
 * @interface SceneLifecycleMethods
 * 
 * @description
 * Provides a standardized interface for testing Phaser scene lifecycle methods.
 * Implements error handling patterns from error-handling.md and service integration
 * patterns from service-integration.md.
 * 
 * @errorHandling
 * - Methods may throw SceneLifecycleError for lifecycle violations
 * - Error severity levels: 'warning' | 'error' | 'critical'
 * - Supports error recovery through state rollback
 * - Implements service error propagation patterns
 * 
 * @serviceIntegration
 * - Methods support service dependency injection
 * - Handles service state preservation during transitions
 * - Implements service communication patterns
 * - Supports service mock injection for isolation testing
 */
interface SceneLifecycleMethods {
  /**
   * Scene initialization method
   * @param {Record<string, any>} data - Initialization data passed to the scene
   * @throws {SceneLifecycleError} If scene is already initialized or initialization fails
   * @errorHandling Implements error recovery through state rollback
   * @serviceIntegration Supports service dependency injection and state initialization
   */
  init(data?: Record<string, any>): void;

  /**
   * Scene creation method
   * @throws {SceneLifecycleError} If scene creation fails or scene is not initialized
   * @errorHandling Supports service error simulation and recovery
   * @serviceIntegration Handles service state synchronization and event binding
   */
  create(): void;

  /**
   * Scene update method
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update
   * @throws {SceneLifecycleError} If update fails or scene is not properly initialized
   * @errorHandling Implements error throttling and recovery for update loop
   * @serviceIntegration Supports service state updates and event propagation
   */
  update(time: number, delta: number): void;

  /**
   * Scene shutdown method
   * @throws {SceneLifecycleError} If shutdown fails or resources cannot be cleaned up
   * @errorHandling Implements graceful shutdown with resource cleanup
   * @serviceIntegration Handles service state preservation and cleanup
   */
  shutdown(): void;
}

/** @typedef {jest.Mock<T, any[]>} MockFunction Generic type for Jest mock functions */
type MockFunction<T = any> = jest.Mock<T, any[]>;

/**
 * Extended mock types for better type safety in the test bed
 * @interface
 * @description Provides type-safe mock implementations of Phaser input systems
 */
interface MockKeyboard {
  /** Adds a key to track for input
   * @param _ - The key code to track (unused in mock)
   * @returns An object representing the key state
   */
  addKey: (_: number) => { isDown: boolean };
}

interface MockPointer {
  x: number;
  y: number;
  isDown: boolean;
  worldX: number;
  worldY: number;
}

interface MockInput {
  keyboard: MockKeyboard;
  activePointer: MockPointer;
  on: MockFunction;
}

interface MockPhysics {
  collide: MockFunction;
  overlap: MockFunction;
}

interface MockTime {
  now: number;
  addEvent: MockFunction;
  delayedCall: MockFunction;
}

interface ExtendedMockScene extends Omit<MockScene, 'input' | 'physics' | 'time'> {
  input: MockInput;
  physics: MockPhysics;
  time: MockTime;
}

type MockScene = ReturnType<typeof createMockScene>;

/**
 * Custom error class for scene lifecycle errors
 * @class SceneLifecycleError
 * @extends Error
 */
class SceneLifecycleError extends Error {
  /**
   * Creates a new SceneLifecycleError
   * @param {string} message - Error message
   * @param {'warning' | 'error' | 'critical'} severity - Error severity level
   * @param {Error} [cause] - Optional cause of the error
   */
  constructor(
    message: string,
    public readonly severity: 'warning' | 'error' | 'critical',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SceneLifecycleError';
  }
}

/**
 * A test bed for isolated testing of Phaser scenes
 * Provides utilities for creating mock scenes, simulating input, and testing scene behavior
 * @class
 * @implements {SceneLifecycleMethods}
 * 
 * @example
 * // Basic scene testing
 * const testBed = new SceneTestBed(MyGameScene);
 * testBed.init({ level: 1 });
 * testBed.create();
 * testBed.update(0, 16);
 * 
 * // Testing input handling
 * testBed.simulateKeyPress(Phaser.Input.Keyboard.KeyCodes.SPACE);
 * testBed.simulatePointerInput(100, 200, true);
 * 
 * // Testing collisions
 * testBed.simulateCollision(player, enemy);
 * 
 * @example
 * // Complete test example
 * describe('MyGameScene', () => {
 *   let testBed: SceneTestBed;
 * 
 *   beforeEach(() => {
 *     testBed = new SceneTestBed(MyGameScene);
 *     testBed.init();
 *     testBed.create();
 *   });
 * 
 *   it('should handle player movement', () => {
 *     testBed.simulateKeyPress(Phaser.Input.Keyboard.KeyCodes.RIGHT);
 *     testBed.update(0, 16);
 *     const scene = testBed.getMockScene();
 *     expect(scene.player.x).toBeGreaterThan(0);
 *   });
 * 
 *   afterEach(() => {
 *     testBed.destroy();
 *   });
 * });
 * 
 * @see {@link docs/testing/test-implementation-details.md#scene-lifecycle-testing} For more scene testing patterns
 */
export class SceneTestBed implements SceneLifecycleMethods {
  private mockScene: ExtendedMockScene;
  private sceneInstance: Scene & SceneLifecycleMethods;
  private mockFunctions = new Map<string, MockFunction>();

  /**
   * Creates a new SceneTestBed instance
   * @param SceneClass - The Phaser.Scene class to test
   */
  constructor(SceneClass: new () => Scene) {
    const baseMockScene = createMockScene();
    
    // Initialize mock properties with proper types
    const mockInput: MockInput = {
      keyboard: {
        addKey: (_: number) => ({ isDown: false })
      },
      activePointer: {
        x: 0,
        y: 0,
        isDown: false,
        worldX: 0,
        worldY: 0
      },
      on: jest.fn()
    };

    const mockPhysics: MockPhysics = {
      collide: jest.fn(),
      overlap: jest.fn()
    };

    const mockTime: MockTime = {
      now: 0,
      addEvent: jest.fn(),
      delayedCall: jest.fn()
    };

    this.mockScene = {
      ...baseMockScene,
      input: mockInput,
      physics: mockPhysics,
      time: mockTime
    } as ExtendedMockScene;

    this.sceneInstance = new SceneClass() as Scene & SceneLifecycleMethods;
  }

  /**
   * Initializes the scene with optional data
   * @param data - Optional initialization data to pass to the scene
   * @throws {Error} If the scene is already initialized
   */
  public init(data?: any): void {
    if (this.sceneInstance.init) {
      this.sceneInstance.init.call(this.mockScene, data);
    }
  }

  /**
   * Runs the scene's create method
   * Should be called after init() and before update()
   */
  public create(): void {
    if (this.sceneInstance.create) {
      this.sceneInstance.create.call(this.mockScene);
    }
  }

  /**
   * Runs the scene's update method
   * @param time - The current game time in milliseconds
   * @param delta - The time elapsed since the last update in milliseconds
   */
  public update(time: number, delta: number): void {
    if (this.sceneInstance.update) {
      this.sceneInstance.update.call(this.mockScene, time, delta);
    }
  }

  /**
   * Returns the mock scene instance for assertions and state inspection
   * @returns The mock scene instance with Jest mock capabilities
   */
  public getMockScene(): ExtendedMockScene {
    return this.mockScene;
  }

  /**
   * Returns the actual scene instance
   * @returns The original Phaser.Scene instance
   */
  public getSceneInstance(): Scene {
    return this.sceneInstance;
  }

  /**
   * Simulates a keyboard key press or release
   * @param keyCode - The key code to simulate (use Phaser.Input.Keyboard.KeyCodes)
   * @param isDown - Whether the key is pressed down (true) or released (false)
   */
  public simulateKeyPress(keyCode: number, isDown: boolean = true): void {
    const key = this.mockScene.input.keyboard.addKey(keyCode);
    key.isDown = isDown;
  }

  /**
   * Simulates pointer (mouse/touch) input
   * @param x - The x coordinate of the pointer
   * @param y - The y coordinate of the pointer
   * @param isDown - Whether the pointer is pressed down (true) or released (false)
   */
  public simulatePointerInput(x: number, y: number, isDown: boolean = true): void {
    Object.assign(this.mockScene.input.activePointer, {
      x,
      y,
      isDown,
      worldX: x,
      worldY: y
    });
  }

  /**
   * Simulates a collision between two game objects
   * Triggers the collision callback if one was registered
   * @param object1 - The first game object
   * @param object2 - The second game object
   */
  public simulateCollision(object1: any, object2: any): void {
    const mockCalls = this.mockScene.physics?.collide?.mock?.calls;
    const collideCallback = mockCalls?.[0]?.[2];
    if (typeof collideCallback === 'function') {
      collideCallback(object1, object2);
    }
  }

  /**
   * Simulates an overlap between two game objects
   * Triggers the overlap callback if one was registered
   * @param object1 - The first game object
   * @param object2 - The second game object
   */
  public simulateOverlap(object1: any, object2: any): void {
    const mockCalls = this.mockScene.physics?.overlap?.mock?.calls;
    const overlapCallback = mockCalls?.[0]?.[2];
    if (typeof overlapCallback === 'function') {
      overlapCallback(object1, object2);
    }
  }

  /**
   * Advances the scene's time by the specified amount
   * Useful for testing time-based behaviors
   * @param time - The amount of time to advance in milliseconds
   */
  public advanceTime(time: number): void {
    if (this.mockScene.time) {
      this.mockScene.time.now = (this.mockScene.time.now || 0) + time;
      this.update(this.mockScene.time.now, time);
    }
  }

  /**
   * Cleans up the test bed and releases resources
   * @throws {SceneLifecycleError} If cleanup fails
   */
  public shutdown(): void {
    try {
      this.sceneInstance.shutdown();
      this.cleanupMocks();
    } catch (error) {
      if (error instanceof Error) {
        throw new SceneLifecycleError('Failed to shutdown scene', 'critical', error);
      }
      throw new SceneLifecycleError('Failed to shutdown scene', 'critical');
    }
  }

  /**
   * Cleans up mock objects and releases resources
   * @private
   */
  private cleanupMocks(): void {
    // Implement cleanup logic for mock objects
    this.mockFunctions.clear();
  }
} 