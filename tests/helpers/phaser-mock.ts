/**
 * Helper utilities for creating Phaser mocks in tests.
 * These helpers provide configurable, type-safe mock instances for testing.
 * They complement the basic mocks in __mocks__/phaser.js.
 * 
 * @module phaser-mock-helpers
 * 
 * @see {@link docs/testing/mocking/mock-vs-helpers.md} for understanding the distinction between mocks and helpers
 * @see {@link docs/testing/helpers/phaser-mock.md} for comprehensive documentation of these utilities
 * @see {@link docs/testing/mocking/phaser-scene-mocking.md} for scene-specific mocking patterns
 * 
 * Key Features:
 * - Type-safe mock creation
 * - Configurable mock behavior
 * - Chainable mock methods
 * - Pre-configured common game objects
 * 
 * Limitations:
 * - Does not simulate actual game logic
 * - Physics calculations are not performed
 * - Event handlers must be manually triggered
 * - WebGL/Canvas operations are not simulated
 * 
 * @example
 * ```typescript
 * import { createMockScene, createMockGameObject } from './phaser-mock';
 * 
 * describe('Player', () => {
 *   it('should handle movement', () => {
 *     // Create a mock scene with custom configuration
 *     const scene = createMockScene({
 *       physics: {
 *         add: {
 *           sprite: jest.fn().mockReturnValue({
 *             setVelocity: jest.fn().mockReturnThis()
 *           })
 *         }
 *       }
 *     });
 * 
 *     // Test player movement
 *     const player = new Player(scene);
 *     player.moveRight();
 * 
 *     expect(scene.physics.add.sprite).toHaveBeenCalled();
 *   });
 * });
 * ```
 */

import { Scene, GameObjects } from 'phaser';

/**
 * Configuration options for mock game objects.
 * Allows customizing position and additional properties.
 */
interface MockGameObjectConfig {
  /** X position of the game object */
  x?: number;
  /** Y position of the game object */
  y?: number;
  /** Additional custom properties */
  [key: string]: any;
}

/**
 * Configuration options for mock scenes.
 * Allows customizing various scene systems.
 */
interface MockSceneConfig {
  /** Custom game object factory methods */
  add?: Partial<Scene['add']>;
  /** Custom physics system methods */
  physics?: Partial<Scene['physics']>;
  /** Custom input handling methods */
  input?: Partial<Scene['input']>;
  /** Additional custom properties */
  [key: string]: any;
}

/**
 * Creates a mock game object with chainable methods.
 * All methods return the object instance for method chaining.
 * 
 * @param config - Configuration options for the game object
 * @returns A mock game object with common Phaser methods
 * 
 * @example
 * ```typescript
 * const sprite = createMockGameObject({
 *   x: 100,
 *   y: 200,
 *   customProperty: 'value'
 * });
 * 
 * sprite.setPosition(150, 250)
 *      .setScale(2)
 *      .setDepth(1);
 * ```
 */
export function createMockGameObject(config: MockGameObjectConfig = {}) {
  return {
    x: config.x ?? 0,
    y: config.y ?? 0,
    setPosition: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    ...config
  };
}

/**
 * Creates a mock scene with configurable behavior.
 * Provides pre-configured mock implementations of common scene systems.
 * 
 * @param config - Configuration options for the scene
 * @returns A mock scene with common Phaser systems and methods
 * 
 * @example
 * ```typescript
 * const scene = createMockScene({
 *   // Custom sprite factory
 *   add: {
 *     sprite: jest.fn().mockReturnValue({
 *       setPosition: jest.fn().mockReturnThis()
 *     })
 *   },
 *   // Custom physics configuration
 *   physics: {
 *     add: {
 *       collider: jest.fn()
 *     }
 *   }
 * });
 * 
 * // Use the scene in tests
 * const sprite = scene.add.sprite(0, 0, 'player');
 * expect(sprite.setPosition).toHaveBeenCalled();
 * ```
 */
export function createMockScene(config: MockSceneConfig = {}) {
  return {
    add: {
      sprite: jest.fn().mockReturnValue(createMockGameObject({
        play: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis()
      })),
      image: jest.fn().mockReturnValue(createMockGameObject()),
      text: jest.fn().mockReturnValue(createMockGameObject({
        setText: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis()
      })),
      container: jest.fn().mockReturnValue(createMockGameObject({
        add: jest.fn().mockReturnThis()
      })),
      ...config.add
    },
    physics: {
      add: {
        sprite: jest.fn().mockReturnValue(createMockGameObject({
          setVelocity: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setImmovable: jest.fn().mockReturnThis(),
          setDrag: jest.fn().mockReturnThis(),
          body: {
            setSize: jest.fn().mockReturnThis(),
            setOffset: jest.fn().mockReturnThis()
          }
        })),
        group: jest.fn().mockReturnValue({
          add: jest.fn().mockReturnThis(),
          setVelocity: jest.fn().mockReturnThis()
        })
      },
      world: {
        setBounds: jest.fn(),
        on: jest.fn()
      },
      overlap: jest.fn(),
      collide: jest.fn(),
      ...config.physics
    },
    input: {
      keyboard: {
        addKey: jest.fn().mockReturnValue({
          on: jest.fn(),
          isDown: false
        }),
        createCursorKeys: jest.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false }
        }),
        on: jest.fn()
      },
      on: jest.fn(),
      ...config.input
    },
    cameras: {
      main: {
        setBackgroundColor: jest.fn(),
        startFollow: jest.fn(),
        setBounds: jest.fn()
      }
    },
    events: {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn()
    },
    scene: {
      start: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      restart: jest.fn(),
      launch: jest.fn()
    },
    data: {
      set: jest.fn(),
      get: jest.fn(),
      values: {}
    },
    time: {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn(),
        paused: false
      }),
      delayedCall: jest.fn()
    },
    ...config
  };
}

/**
 * Creates a mock sound with configurable behavior.
 * Provides common sound control methods.
 * 
 * @param config - Configuration options for the sound object
 * @returns A mock sound object with common Phaser sound methods
 * 
 * @example
 * ```typescript
 * const sound = createMockSound({
 *   isPlaying: true,
 *   volume: 0.5
 * });
 * 
 * sound.play();
 * expect(sound.isPlaying).toBe(true);
 * ```
 */
export function createMockSound(config: Partial<GameObjects.GameObject> = {}) {
  return {
    play: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    setVolume: jest.fn(),
    setLoop: jest.fn(),
    isPlaying: false,
    ...config
  };
}

/**
 * Creates a mock animation with chainable methods.
 * All methods return the animation instance for method chaining.
 * 
 * @param config - Configuration options for the animation object
 * @returns A mock animation object with common Phaser animation methods
 * 
 * @example
 * ```typescript
 * const anim = createMockAnimation({
 *   key: 'walk',
 *   frameRate: 24
 * });
 * 
 * anim.play()
 *     .pause()
 *     .resume();
 * ```
 */
export function createMockAnimation(config: Partial<GameObjects.GameObject> = {}) {
  return {
    play: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    resume: jest.fn().mockReturnThis(),
    restart: jest.fn().mockReturnThis(),
    complete: jest.fn().mockReturnThis(),
    ...config
  };
} 