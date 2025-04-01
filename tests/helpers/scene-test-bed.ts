import { Scene } from 'phaser';
import { createMockScene } from './phaser-mock';
import { Mock } from 'jest-mock';

type MockScene = ReturnType<typeof createMockScene>;
type TestScene = Scene & MockScene;

/**
 * A test bed for testing Phaser scenes
 * Provides utilities for creating and testing scenes in isolation
 */
export class SceneTestBed {
  private scene: TestScene;
  private mockScene: MockScene;

  constructor(SceneClass: new () => Scene) {
    this.mockScene = createMockScene();
    this.scene = new SceneClass() as TestScene;
    
    // Copy mock methods to the scene instance
    Object.assign(this.scene, this.mockScene);
  }

  /**
   * Runs the scene's lifecycle methods in order
   * @param data Optional data to pass to the scene
   */
  public async runSceneLifecycle(data?: any): Promise<void> {
    // Run scene lifecycle methods
    await this.scene.init(data);
    await this.scene.preload();
    await this.scene.create();
  }

  /**
   * Updates the scene with a given time and delta
   * @param time Current game time
   * @param delta Time since last update
   */
  public update(time: number = 0, delta: number = 16.67): void {
    this.scene.update(time, delta);
  }

  /**
   * Gets the scene instance
   * @returns The scene instance being tested
   */
  public getScene(): TestScene {
    return this.scene;
  }

  /**
   * Gets a mock object from the scene
   * @param path Path to the mock object (e.g., 'add.sprite')
   * @returns The mock function or object
   */
  public getMock(path: string): Mock | any {
    return path.split('.').reduce((obj, key) => obj[key], this.scene);
  }

  /**
   * Simulates a keyboard event
   * @param keyCode The key code to simulate
   * @param isDown Whether the key is pressed down
   */
  public simulateKeyEvent(keyCode: number, isDown: boolean = true): void {
    const key = this.scene.input.keyboard.addKey(keyCode) as any;
    key.isDown = isDown;
    if (key.on && Array.isArray(key.on.mock?.calls)) {
      key.on.mock.calls.forEach(([event, callback]: [string, () => void]) => {
        if ((event === 'down' && isDown) || (event === 'up' && !isDown)) {
          callback();
        }
      });
    }
  }

  /**
   * Simulates a pointer event
   * @param x X coordinate
   * @param y Y coordinate
   * @param eventType Type of event ('down', 'up', 'move')
   */
  public simulatePointerEvent(x: number, y: number, eventType: 'down' | 'up' | 'move'): void {
    const event = { x, y, type: eventType };
    const input = this.scene.input as any;
    if (input.on && Array.isArray(input.on.mock?.calls)) {
      input.on.mock.calls.forEach(([type, callback]: [string, (event: any) => void]) => {
        if (type === `pointer${eventType}`) {
          callback(event);
        }
      });
    }
  }

  /**
   * Simulates an event emission
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to the event handlers
   */
  public emitEvent(eventName: string, ...args: any[]): void {
    this.scene.events.emit(eventName, ...args);
  }

  /**
   * Cleans up the test bed
   */
  public destroy(): void {
    // Clean up any resources
    Object.keys(this.mockScene).forEach(key => {
      (this.scene as any)[key] = undefined;
    });
    this.mockScene = undefined as any;
  }
} 