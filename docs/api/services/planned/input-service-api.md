# Input Service API Documentation (Planned - Post Sprint 1)

## Version Information
- **Version**: v2.0.0-planned
- **Last Updated**: 2024-03-31
- **Status**: Planned
- **Authors**: Development Team
- **Target Implementation**: Post Sprint 1

## Overview
The `InputService` is planned to be responsible for managing user input across different devices and input methods. It will provide a unified, action-based input system that abstracts the complexities of handling keyboard, gamepad, and touch inputs behind a consistent interface.

## Implementation Timeline
This service is planned for implementation after Sprint 1. The current documentation serves as a design specification for future implementation.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [TypeScript Standards](../standards/typescript.mdc)

## Core Interface

```typescript
import { 
  IGameService,
  IUpdatableService,
  ServiceError,
  ServiceThreadError,
  ServiceStateError,
  IEventBus,
  GameEventMap
} from './types';

/**
 * Service responsible for input handling
 * @implements IGameService, IUpdatableService
 */
interface IInputService extends IGameService, IUpdatableService {
  /**
   * Register input actions for a specific context
   * @param context Context identifier (e.g., "gameplay", "menu")
   * @param actions Mapping of action names to input configurations
   */
  registerActions(context: string, actions: Record<string, InputAction>): void;
  
  /**
   * Activate a specific input context
   * @param context Context identifier to activate
   * @throws InputError if context doesn't exist
   */
  activateContext(context: string): void;
  
  /**
   * Check if an action is currently active
   * @param action Action name to check
   * @returns True if action is active, false otherwise
   */
  isActionActive(action: string): boolean;
  
  /**
   * Check if an action was just triggered this frame
   * @param action Action name to check
   * @returns True if action was just triggered, false otherwise
   */
  isActionJustTriggered(action: string): boolean;
  
  /**
   * Add a listener for an input action
   * @param action Action name to listen for
   * @param callback Function to call when action is triggered
   * @returns Listener ID for removal
   */
  addActionListener(action: string, callback: (value: number) => void): string;
  
  /**
   * Remove an action listener
   * @param id Listener ID to remove
   */
  removeActionListener(id: string): void;
}

/**
 * Input action configuration
 */
interface InputAction {
  /** Keyboard keys that trigger this action */
  keys?: InputKey[];
  
  /** Gamepad buttons that trigger this action */
  gamepadButtons?: GamepadButton[];
  
  /** Mouse buttons that trigger this action */
  mouseButtons?: MouseButton[];
  
  /** Whether action is continuous or triggered once per press */
  continuous?: boolean;
  
  /** For analog inputs, threshold to consider active (0-1) */
  threshold?: number;
}

type InputKey = string | Phaser.Input.Keyboard.Key;
type GamepadButton = number;
type MouseButton = number;
```

## Usage Examples

### Basic Input Setup with Events
```typescript
class GameplayScene extends Phaser.Scene {
  private inputService: IInputService;
  private eventBus: IEventBus;
  
  constructor() {
    super({ key: 'GameplayScene' });
    const registry = ServiceRegistry.getInstance();
    this.inputService = registry.get<IInputService>('input');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  create(): void {
    try {
      // Register gameplay actions
      this.inputService.registerActions('gameplay', {
        jump: {
          keys: ['SPACE', 'W', 'UP'],
          gamepadButtons: [0], // A/X button
          continuous: false
        },
        moveLeft: {
          keys: ['A', 'LEFT'],
          gamepadButtons: [14], // D-pad left
          continuous: true
        },
        moveRight: {
          keys: ['D', 'RIGHT'],
          gamepadButtons: [15], // D-pad right
          continuous: true
        }
      });
      
      // Activate the gameplay context
      this.inputService.activateContext('gameplay');
      
      // Emit context changed event
      this.eventBus.emit('input.context.changed', {
        context: 'gameplay',
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof InputError) {
        console.error('Input system error:', error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
  
  update(): void {
    // Check continuous actions and emit events
    if (this.inputService.isActionActive('moveLeft')) {
      this.eventBus.emit('player.movement', {
        direction: 'left',
        value: 1,
        timestamp: Date.now()
      });
    }
    
    // Check one-time triggers
    if (this.inputService.isActionJustTriggered('jump')) {
      this.eventBus.emit('player.action', {
        action: 'jump',
        timestamp: Date.now()
      });
    }
  }
}
```

### Event-Based Input Handling with Error Handling
```typescript
class PlayerController {
  private inputService: IInputService;
  private eventBus: IEventBus;
  private listenerIds: string[] = [];
  
  constructor() {
    const registry = ServiceRegistry.getInstance();
    this.inputService = registry.get<IInputService>('input');
    this.eventBus = registry.get<IEventBus>('eventBus');
    
    try {
      // Add action listeners
      this.listenerIds.push(
        this.inputService.addActionListener('jump', () => {
          this.handleJump();
        }),
        this.inputService.addActionListener('attack', (value) => {
          this.handleAttack(value);
        })
      );
    } catch (error) {
      if (error instanceof InputListenerError) {
        console.error('Failed to register input listener:', error.message);
        this.eventBus.emit('error', error);
      }
    }
  }
  
  destroy(): void {
    // Clean up listeners
    this.listenerIds.forEach(id => {
      try {
        this.inputService.removeActionListener(id);
      } catch (error) {
        console.error('Failed to remove input listener:', error);
      }
    });
  }
}
```

## Error Types

```typescript
/**
 * Base error class for input-related errors
 */
class InputError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}

/**
 * Error thrown when input context operations fail
 */
class InputContextError extends InputError {
  constructor(context: string, operation: string, cause?: Error) {
    super(`Input context error: ${operation} failed for context "${context}"`);
    this.name = 'InputContextError';
    this.context = context;
    this.operation = operation;
    this.cause = cause;
  }
  
  context: string;
  operation: string;
  cause?: Error;
}

/**
 * Error thrown when input listener operations fail
 */
class InputListenerError extends InputError {
  constructor(action: string, operation: string) {
    super(`Input listener error: ${operation} failed for action "${action}"`);
    this.name = 'InputListenerError';
    this.action = action;
    this.operation = operation;
  }
  
  action: string;
  operation: string;
}
```

## Implementation Checklist
1. **Input Management**
   - [ ] Implement multi-device input handling
   - [ ] Support context switching
   - [ ] Handle concurrent inputs
   - [ ] Manage input state properly

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Handle device failures gracefully
   - [ ] Emit error events when appropriate
   - [ ] Validate input configurations

3. **Event Communication**
   - [ ] Emit input state events
   - [ ] Emit context change events
   - [ ] Handle error events
   - [ ] Clean up event listeners

4. **Device Support**
   - [ ] Handle keyboard input
   - [ ] Support gamepad input
   - [ ] Implement touch controls
   - [ ] Handle device hot-plugging

## Change History
- v2.0.0 (2024-03-31)
  - Added type-safe input configurations
  - Improved error handling
  - Added event system integration
  - Enhanced device support
- v1.0.0 (2024-03-01)
  - Initial implementation 