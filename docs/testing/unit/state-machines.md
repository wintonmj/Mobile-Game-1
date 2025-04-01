# State Machine Testing Guide

## Overview
This document provides detailed guidance for testing state machines in our game architecture. It focuses on verifying state transitions, validations, and side effects in state-driven components.

## Related Documentation
- [Jest Testing Strategy](../jest-testing-strategy.md)
- [Service Testing Guide](./services.md) - For testing services that use state machines
- [Event Testing Guide](./events.md) - For testing state change events and event-driven transitions
- [Service Registry API](../../api/services/sprint1/service-registry-api.md)
- [State Machine Implementation Guide](../../architecture/patterns/state-machine-pattern.md)

## Integration Points
- **Services**: State machines are often part of services. See [Service Testing Guide](./services.md#state-management-testing) for service-specific state management testing.
- **Events**: State changes typically emit events. See [Event Testing Guide](./events.md#event-sequence-testing) for testing state change event sequences.
- **Performance**: State machine transitions should be performant. See [Service Performance Testing](./services.md#performance-testing) for performance testing patterns.

## Contents
1. [Test Organization](#test-organization)
2. [Coverage Requirements](#coverage-requirements)
3. [State Machine Testing Patterns](#state-machine-testing-patterns)
4. [State Transition Testing](#state-transition-testing)
5. [Side Effect Testing](#side-effect-testing)
6. [Documentation Standards](#documentation-standards)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

## Coverage Requirements

### State Machine Coverage Targets
- Core State Machine: 95% line coverage
- State Implementations: 90% line coverage
- Transition Logic: 90% line coverage
- Side Effects: 85% line coverage

### Critical Areas Requiring 100% Coverage
- State transitions
- Guard conditions
- Entry/exit actions
- Error handling
- State validation
- Event emissions

### Coverage Configuration
```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    'src/core/state-machine/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    'src/state-machines/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
};
```

## Test Organization

### Directory Structure
```
tests/
├── unit/
│   ├── state-machines/
│   │   ├── player/
│   │   │   ├── PlayerStateMachine.test.ts
│   │   │   └── CombatStateMachine.test.ts
│   │   ├── game/
│   │   │   ├── GameStateMachine.test.ts
│   │   │   └── SceneStateMachine.test.ts
│   │   └── ui/
│   │       ├── DialogStateMachine.test.ts
│   │       └── MenuStateMachine.test.ts
│   └── helpers/
│       ├── state-machine-test-utils.ts
│       └── state-transition-recorder.ts
```

### Test File Structure
```typescript
/**
 * Tests for PlayerStateMachine
 * 
 * @group unit
 * @group state-machines
 * @coverage-target 90%
 */
import { PlayerStateMachine } from '../../../src/state-machines/PlayerStateMachine';
import { createMockEventBus } from '../../helpers/mock-factories';
import { StateTransitionRecorder } from '../../helpers/state-transition-recorder';
import type { IEventBus } from '../../../src/interfaces/IEventBus';
import type { PlayerState } from '../../../src/types/PlayerState';

describe('PlayerStateMachine', () => {
  let stateMachine: PlayerStateMachine;
  let mockEventBus: jest.Mocked<IEventBus>;
  let transitionRecorder: StateTransitionRecorder<PlayerState>;
  
  beforeEach(async () => {
    mockEventBus = createMockEventBus();
    stateMachine = new PlayerStateMachine(mockEventBus);
    transitionRecorder = new StateTransitionRecorder(stateMachine);
    await stateMachine.init();
  });
  
  afterEach(async () => {
    transitionRecorder.stop();
    await stateMachine.destroy();
    jest.clearAllMocks();
  });
  
  describe('state transitions', () => {
    // State transition tests
  });
  
  describe('side effects', () => {
    // Side effect tests
  });
  
  describe('error handling', () => {
    // Error case tests
  });
});
```

## Documentation Standards

### Test Documentation
Each test file should include:

1. **File Header**
```typescript
/**
 * Tests for PlayerStateMachine
 * 
 * @group unit
 * @group state-machines
 * @coverage-target 90%
 * @author Your Name
 * @lastModified 2024-04-01
 */
```

2. **Test Group Documentation**
```typescript
describe('PlayerStateMachine', () => {
  /**
   * Tests for state transition logic
   * 
   * Critical paths:
   * 1. Valid state transitions
   * 2. Invalid state transitions
   * 3. Guard conditions
   * 4. Entry/exit actions
   */
  describe('state transitions', () => {
    // Tests
  });
});
```

3. **Individual Test Documentation**
```typescript
/**
 * Verifies that state transitions:
 * 1. Update current state correctly
 * 2. Execute entry/exit actions
 * 3. Emit appropriate events
 * 4. Handle guard conditions
 * 
 * @event state.changed
 * @error InvalidStateTransitionError
 */
test('should transition through valid states', () => {
  // Test implementation
});
```

## State Machine Testing Patterns

### 1. State Transition Testing
Test valid and invalid state transitions:

```typescript
describe('state transitions', () => {
  /**
   * Tests basic state transition flow
   */
  test('should transition through valid states', () => {
    // Initial state
    expect(stateMachine.getCurrentState()).toBe(PlayerState.IDLE);
    
    // Transition to walking
    stateMachine.handleInput('move');
    expect(stateMachine.getCurrentState()).toBe(PlayerState.WALKING);
    
    // Transition to jumping
    stateMachine.handleInput('jump');
    expect(stateMachine.getCurrentState()).toBe(PlayerState.JUMPING);
  });
  
  /**
   * Tests invalid state transition handling
   * 
   * @error InvalidStateTransitionError
   */
  test('should prevent invalid transitions', () => {
    // Can't jump while stunned
    stateMachine.setState(PlayerState.STUNNED);
    
    expect(() => stateMachine.handleInput('jump'))
      .toThrow(InvalidStateTransitionError);
  });
  
  /**
   * Tests transition history recording
   */
  test('should track transition history', () => {
    stateMachine.handleInput('move');
    stateMachine.handleInput('jump');
    stateMachine.handleInput('land');
    
    const history = transitionRecorder.getHistory();
    expect(history).toEqual([
      { from: PlayerState.IDLE, to: PlayerState.WALKING, trigger: 'move' },
      { from: PlayerState.WALKING, to: PlayerState.JUMPING, trigger: 'jump' },
      { from: PlayerState.JUMPING, to: PlayerState.IDLE, trigger: 'land' }
    ]);
  });
});
```

### 2. State Entry/Exit Testing
Test state entry and exit actions:

```typescript
describe('state lifecycle', () => {
  test('should execute entry actions', () => {
    const onEnterSpy = jest.spyOn(stateMachine, 'onEnterCombat');
    
    stateMachine.handleInput('engage');
    
    expect(onEnterSpy).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'combat.entered',
      expect.any(Object)
    );
  });
  
  test('should execute exit actions', () => {
    const onExitSpy = jest.spyOn(stateMachine, 'onExitCombat');
    
    stateMachine.setState('combat');
    stateMachine.handleInput('disengage');
    
    expect(onExitSpy).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'combat.exited',
      expect.any(Object)
    );
  });
  
  test('should clean up state resources', () => {
    const cleanupSpy = jest.spyOn(stateMachine, 'cleanupCombatResources');
    
    stateMachine.setState('combat');
    stateMachine.handleInput('disengage');
    
    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```

### 3. Guard Condition Testing
Test transition guard conditions:

```typescript
describe('guard conditions', () => {
  test('should check conditions before transitions', () => {
    // Set up preconditions
    stateMachine.setStamina(0);
    
    // Attempt transition
    expect(() => stateMachine.handleInput('sprint'))
      .toThrow('Insufficient stamina to sprint');
    
    expect(stateMachine.getCurrentState()).toBe('idle');
  });
  
  test('should allow transitions when conditions are met', () => {
    // Set up preconditions
    stateMachine.setStamina(100);
    
    // Attempt transition
    stateMachine.handleInput('sprint');
    
    expect(stateMachine.getCurrentState()).toBe('sprinting');
  });
});
```

### 3. Game-Specific State Machine Testing

#### Scene State Transitions
Test scene state transitions and validations:

```typescript
describe('scene state transitions', () => {
  test('should handle scene loading states correctly', () => {
    // Test scene boot -> preload -> create -> ready sequence
    expect(sceneStateMachine.getCurrentState()).toBe(SceneState.BOOT);
    
    sceneStateMachine.handleSceneEvent('assetsLoaded');
    expect(sceneStateMachine.getCurrentState()).toBe(SceneState.PRELOAD);
    
    sceneStateMachine.handleSceneEvent('preloadComplete');
    expect(sceneStateMachine.getCurrentState()).toBe(SceneState.CREATE);
    
    sceneStateMachine.handleSceneEvent('createComplete');
    expect(sceneStateMachine.getCurrentState()).toBe(SceneState.READY);
  });

  test('should validate scene dependencies before transitions', () => {
    // Test scene transition validation
    const mockDependencies = {
      requiredService: null,
      requiredAssets: ['texture1', 'sound1']
    };

    expect(() => sceneStateMachine.validateTransition(SceneState.CREATE, mockDependencies))
      .toThrow(SceneDependencyError);
  });
});
```

#### Game Loop State Management
Test game loop state transitions and management:

```typescript
describe('game loop state management', () => {
  test('should handle pause and resume correctly', () => {
    // Test game loop pause/resume
    expect(gameLoopStateMachine.getCurrentState()).toBe(GameLoopState.RUNNING);
    
    gameLoopStateMachine.handleInput('pause');
    expect(gameLoopStateMachine.getCurrentState()).toBe(GameLoopState.PAUSED);
    expect(mockGameLoop.update).not.toHaveBeenCalled();
    
    gameLoopStateMachine.handleInput('resume');
    expect(gameLoopStateMachine.getCurrentState()).toBe(GameLoopState.RUNNING);
    expect(mockGameLoop.update).toHaveBeenCalled();
  });

  test('should maintain state during scene transitions', () => {
    // Test state preservation during scene changes
    gameLoopStateMachine.handleInput('pause');
    sceneManager.changeScene('NewScene');
    
    expect(gameLoopStateMachine.getCurrentState()).toBe(GameLoopState.PAUSED);
  });
});
```

#### Asset Loading State Management
Test asset loading states and transitions:

```typescript
describe('asset loading state management', () => {
  test('should handle progressive loading states', () => {
    // Test asset loading state progression
    expect(assetLoaderStateMachine.getCurrentState()).toBe(AssetLoadState.IDLE);
    
    assetLoaderStateMachine.startLoading(['texture1', 'sound1']);
    expect(assetLoaderStateMachine.getCurrentState()).toBe(AssetLoadState.LOADING);
    
    assetLoaderStateMachine.handleProgress(50);
    expect(assetLoaderStateMachine.getProgress()).toBe(50);
    
    assetLoaderStateMachine.handleAssetLoaded('texture1');
    assetLoaderStateMachine.handleAssetLoaded('sound1');
    expect(assetLoaderStateMachine.getCurrentState()).toBe(AssetLoadState.COMPLETE);
  });

  test('should handle loading errors gracefully', () => {
    // Test error handling during asset loading
    assetLoaderStateMachine.startLoading(['invalid-asset']);
    
    assetLoaderStateMachine.handleError('invalid-asset', new Error('Asset not found'));
    expect(assetLoaderStateMachine.getCurrentState()).toBe(AssetLoadState.ERROR);
    expect(assetLoaderStateMachine.getErrors()).toContainEqual({
      asset: 'invalid-asset',
      error: expect.any(Error)
    });
  });
});
```

## Side Effect Testing

### 1. State-Dependent Behavior
Test behavior that depends on current state:

```typescript
describe('state-dependent behavior', () => {
  test('should modify damage based on state', () => {
    // Base damage in idle state
    expect(stateMachine.calculateDamage(10)).toBe(10);
    
    // Enhanced damage in berserk state
    stateMachine.setState('berserk');
    expect(stateMachine.calculateDamage(10)).toBe(20);
  });
  
  test('should modify movement speed based on state', () => {
    // Base speed in walking state
    stateMachine.setState('walking');
    expect(stateMachine.getMovementSpeed()).toBe(5);
    
    // Enhanced speed in sprinting state
    stateMachine.setState('sprinting');
    expect(stateMachine.getMovementSpeed()).toBe(10);
  });
});
```

### 2. Event Emission Testing
Test events emitted during state changes:

```typescript
describe('state change events', () => {
  test('should emit events on state change', () => {
    stateMachine.handleInput('startCombat');
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'state.changed',
      {
        entity: 'player',
        from: 'idle',
        to: 'combat',
        timestamp: expect.any(Number)
      }
    );
  });
  
  test('should emit state-specific events', () => {
    stateMachine.setState('vulnerable');
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'player.vulnerable',
      expect.any(Object)
    );
  });
});
```

## Error Handling

### 1. Invalid State Transitions

```typescript
describe('error handling', () => {
  test('should throw on invalid state transitions', () => {
    stateMachine.setState('dead');
    
    expect(() => stateMachine.handleInput('move'))
      .toThrow('Invalid transition: Cannot move while dead');
  });
  
  test('should throw on undefined states', () => {
    expect(() => stateMachine.setState('invalidState'))
      .toThrow('Invalid state: invalidState');
  });
  
  test('should handle concurrent transitions', async () => {
    const transitions = [
      stateMachine.handleInput('move'),
      stateMachine.handleInput('jump')
    ];
    
    await expect(Promise.all(transitions))
      .rejects.toThrow('State transition already in progress');
  });
});
```

### 2. Guard Condition Failures

```typescript
describe('guard conditions', () => {
  test('should provide detailed guard failure messages', () => {
    stateMachine.setHealth(0);
    
    expect(() => stateMachine.handleInput('attack'))
      .toThrow('Guard condition failed: Cannot attack with 0 health');
  });
  
  test('should handle multiple guard conditions', () => {
    stateMachine.setHealth(100);
    stateMachine.setStamina(0);
    
    expect(() => stateMachine.handleInput('specialAttack'))
      .toThrow('Guard condition failed: Insufficient stamina');
  });
});
```

## Examples

### Complete State Machine Test Example

```typescript
describe('CombatStateMachine', () => {
  let stateMachine: CombatStateMachine;
  let mockEventBus: jest.Mocked<IEventBus>;
  let transitionRecorder: StateTransitionRecorder;
  
  beforeEach(() => {
    mockEventBus = createMockEventBus();
    stateMachine = new CombatStateMachine(mockEventBus);
    transitionRecorder = new StateTransitionRecorder(stateMachine);
  });
  
  afterEach(() => {
    transitionRecorder.stop();
    jest.clearAllMocks();
  });
  
  describe('combat flow', () => {
    test('should follow complete combat sequence', () => {
      // Start in idle state
      expect(stateMachine.getCurrentState()).toBe('idle');
      
      // Initiate combat
      stateMachine.handleInput('engage');
      expect(stateMachine.getCurrentState()).toBe('combat');
      
      // Player turn
      stateMachine.handleInput('startTurn');
      expect(stateMachine.getCurrentState()).toBe('playerTurn');
      
      // Execute attack
      stateMachine.handleInput('attack');
      expect(stateMachine.getCurrentState()).toBe('attacking');
      
      // Complete attack
      stateMachine.handleInput('attackComplete');
      expect(stateMachine.getCurrentState()).toBe('enemyTurn');
      
      // End combat
      stateMachine.handleInput('victory');
      expect(stateMachine.getCurrentState()).toBe('victory');
      
      // Verify transition history
      const history = transitionRecorder.getHistory();
      expect(history).toHaveLength(6);
      expect(history.map(h => h.to)).toEqual([
        'combat',
        'playerTurn',
        'attacking',
        'enemyTurn',
        'victory',
        'idle'
      ]);
    });
    
    test('should handle interruptions', () => {
      // Set up combat sequence
      stateMachine.handleInput('engage');
      stateMachine.handleInput('startTurn');
      
      // Interrupt with stun
      stateMachine.handleInput('stunned');
      expect(stateMachine.getCurrentState()).toBe('stunned');
      
      // Verify can't take actions while stunned
      expect(() => stateMachine.handleInput('attack'))
        .toThrow('Invalid transition: Cannot attack while stunned');
      
      // Recover from stun
      stateMachine.handleInput('recover');
      expect(stateMachine.getCurrentState()).toBe('playerTurn');
    });
  });
  
  describe('state-specific behavior', () => {
    test('should modify damage based on combat state', () => {
      const baseDamage = 10;
      
      // Normal damage in combat state
      stateMachine.setState('combat');
      expect(stateMachine.calculateDamage(baseDamage)).toBe(10);
      
      // Enhanced damage in rage state
      stateMachine.setState('rage');
      expect(stateMachine.calculateDamage(baseDamage)).toBe(20);
      
      // Reduced damage in weakened state
      stateMachine.setState('weakened');
      expect(stateMachine.calculateDamage(baseDamage)).toBe(5);
    });
    
    test('should track combat statistics', () => {
      stateMachine.handleInput('engage');
      
      // Record attacks
      stateMachine.recordAttack({ damage: 10, type: 'physical' });
      stateMachine.recordAttack({ damage: 15, type: 'magical' });
      
      const stats = stateMachine.getCombatStats();
      expect(stats.totalDamage).toBe(25);
      expect(stats.attacks).toHaveLength(2);
    });
  });
  
  describe('error handling', () => {
    test('should validate state-specific actions', () => {
      // Can't use special moves outside of combat
      expect(() => stateMachine.useSpecialMove('powerAttack'))
        .toThrow('Special moves only available in combat');
      
      // Enter combat and verify special moves work
      stateMachine.handleInput('engage');
      expect(() => stateMachine.useSpecialMove('powerAttack'))
        .not.toThrow();
    });
    
    test('should handle invalid state combinations', () => {
      // Can't be in multiple exclusive states
      stateMachine.setState('attacking');
      
      expect(() => stateMachine.setState('defending'))
        .toThrow('Cannot be attacking and defending simultaneously');
    });
  });
});
```

## Version History
- v1.0.0 (2024-03-31)
  - Initial documentation
  - Added comprehensive test patterns and examples
  - Aligned with service and event testing strategies
