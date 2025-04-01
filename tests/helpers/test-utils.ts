/**
 * @file test-utils.ts
 * @description Provides utility functions for testing game components, including timing, event simulation, and mock objects.
 * @see {@link docs/testing/helpers/test-utils.md} - Detailed documentation of test utilities
 * @see {@link docs/testing/mocking/test-data-strategy.md} - Test data generation strategy
 * @see {@link docs/testing/test-implementation-details.md} - Implementation details and patterns
 */

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - The number of milliseconds to wait
 * @returns {Promise<void>} A promise that resolves after the specified delay
 * @see {@link docs/testing/test-implementation-details.md#time-management} - Time management patterns
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock function that resolves after a delay
 * @param {number} [delay=0] - The delay in milliseconds before the mock resolves
 * @param {any} [returnValue] - The value to return when the mock resolves
 * @returns {jest.Mock} A Jest mock function that resolves after the specified delay
 * @see {@link docs/testing/mocking/test-data-strategy.md#mock-objects-for-phaser-components} - Mock object strategy
 */
export function createDelayedMock(delay: number = 0, returnValue?: any): jest.Mock {
  return jest.fn().mockImplementation(() => 
    wait(delay).then(() => returnValue)
  );
}

/**
 * Create a mock event emitter for testing event-based systems
 * @returns {jest.Mocked<any>} A mocked event emitter with Jest spy functions
 * @see {@link docs/testing/test-implementation-details.md#event-based-system-testing} - Event system testing
 */
export function createMockEventEmitter(): jest.Mocked<any> {
  const listeners: { [key: string]: Function[] } = {};
  
  return {
    on: jest.fn().mockImplementation((event: string, callback: Function) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    off: jest.fn().mockImplementation((event: string, callback: Function) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    }),
    emit: jest.fn().mockImplementation((event: string, ...args: any[]) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(...args));
      }
    }),
    removeAllListeners: jest.fn().mockImplementation((event?: string) => {
      if (event) {
        delete listeners[event];
      } else {
        Object.keys(listeners).forEach(key => delete listeners[key]);
      }
    }),
    listenerCount: jest.fn().mockImplementation((event: string) => 
      listeners[event]?.length || 0
    )
  };
}

/**
 * Create a mock promise that can be resolved/rejected externally
 * @template T The type of the promise value
 * @returns {Object} An object containing the promise and its resolve/reject functions
 * @property {Promise<T>} promise - The controlled promise
 * @property {(value: T) => void} resolve - Function to resolve the promise
 * @property {(error: any) => void} reject - Function to reject the promise
 * @see {@link docs/testing/test-implementation-details.md#advanced-test-patterns} - Advanced testing patterns
 */
export function createControlledPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Create a mock timer that can be controlled in tests
 * @returns {Object} A mock timer object with control functions
 * @see {@link docs/testing/test-implementation-details.md#time-management} - Time management patterns
 */
export function createMockTimer() {
  let currentTime = 0;
  const callbacks: { time: number; callback: Function }[] = [];
  
  return {
    now: () => currentTime,
    advance: (ms: number) => {
      currentTime += ms;
      callbacks
        .filter(cb => cb.time <= currentTime)
        .forEach(cb => cb.callback());
      callbacks.splice(0, callbacks.length);
    },
    setTimeout: (callback: Function, delay: number) => {
      callbacks.push({
        time: currentTime + delay,
        callback
      });
    },
    reset: () => {
      currentTime = 0;
      callbacks.splice(0, callbacks.length);
    }
  };
}

/**
 * Create a mock canvas context for testing rendering
 * @returns {jest.Mocked<CanvasRenderingContext2D>} A mocked canvas context with Jest spy functions
 * @see {@link docs/testing/test-implementation-details.md#physics-and-collision-testing} - Rendering and physics testing
 */
export function createMockCanvasContext(): jest.Mocked<CanvasRenderingContext2D> {
  return {
    canvas: document.createElement('canvas'),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    createPattern: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    ellipse: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    drawImage: jest.fn(),
    createImageData: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    setLineDash: jest.fn(),
    getLineDash: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 0 }),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    drawFocusIfNeeded: jest.fn(),
  } as unknown as jest.Mocked<CanvasRenderingContext2D>;
}

/**
 * Helper to simulate RAF (RequestAnimationFrame) in tests
 * @returns {Object} A RAF manager with control functions
 * @see {@link docs/testing/test-implementation-details.md#game-loop-and-configuration-testing} - Game loop testing
 */
export function createRAFManager() {
  const callbacks: Function[] = [];
  let isRunning = false;
  let currentTime = 0;
  
  return {
    add: (callback: Function) => {
      callbacks.push(callback);
      return callbacks.length;
    },
    remove: (id: number) => {
      callbacks[id - 1] = () => {};
    },
    start: () => {
      isRunning = true;
    },
    stop: () => {
      isRunning = false;
    },
    tick: (delta: number = 16.67) => {
      if (!isRunning) return;
      currentTime += delta;
      callbacks.forEach(callback => callback(currentTime));
    },
    reset: () => {
      callbacks.length = 0;
      isRunning = false;
      currentTime = 0;
    }
  };
}

/**
 * Helper to simulate keyboard input in tests
 * @returns {Object} A keyboard simulator with control functions
 * @see {@link docs/testing/test-implementation-details.md#input-handling-tests} - Input handling testing
 */
export function createKeyboardSimulator() {
  const pressedKeys = new Set<string>();
  
  return {
    pressKey: (key: string) => {
      pressedKeys.add(key);
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    },
    releaseKey: (key: string) => {
      pressedKeys.delete(key);
      document.dispatchEvent(new KeyboardEvent('keyup', { key }));
    },
    isKeyPressed: (key: string) => pressedKeys.has(key),
    reset: () => {
      pressedKeys.clear();
    }
  };
}

/**
 * Helper to simulate touch/pointer input in tests
 * @param {HTMLCanvasElement} canvas - The canvas element to simulate events on
 * @returns {Object} A pointer simulator with control functions
 * @see {@link docs/testing/test-implementation-details.md#input-handling-tests} - Input handling testing
 */
export function createPointerSimulator(canvas: HTMLCanvasElement) {
  return {
    move: (x: number, y: number) => {
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      }));
    },
    down: (x: number, y: number) => {
      canvas.dispatchEvent(new MouseEvent('mousedown', {
        clientX: x,
        clientY: y,
        bubbles: true
      }));
    },
    up: (x: number, y: number) => {
      canvas.dispatchEvent(new MouseEvent('mouseup', {
        clientX: x,
        clientY: y,
        bubbles: true
      }));
    },
    click: (x: number, y: number) => {
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: x,
        clientY: y,
        bubbles: true
      }));
    }
  };
} 