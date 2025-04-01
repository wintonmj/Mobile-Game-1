# Entity Testing Guide

## Overview
This document provides comprehensive guidance for testing game entities in our TypeScript-based RPG project. It covers best practices, patterns, and examples for ensuring robust entity behavior.

## Contents
- [Entity Testing Principles](#entity-testing-principles)
- [Test Organization](#test-organization)
- [Common Testing Patterns](#common-testing-patterns)
- [State Testing](#state-testing)
- [Event Testing](#event-testing)
- [Examples](#examples)

## Entity Testing Principles

### Core Principles
1. Test entity creation and initialization
2. Verify state transitions
3. Validate event emissions
4. Test interactions with other entities
5. Verify property mutations

### Test Coverage Requirements
- Entity models require 85% line coverage
- Focus on business logic and state management
- Test both success and failure paths

## Test Organization

### File Structure
```
tests/unit/entities/
├── player.test.ts
├── enemy.test.ts
├── item.test.ts
└── helpers/
    ├── entity-test-utils.ts
    └── mock-factories.ts
```

### Test Suite Organization
```typescript
describe('PlayerEntity', () => {
  describe('initialization', () => {
    // Creation and setup tests
  });

  describe('state management', () => {
    // State transition tests
  });

  describe('interactions', () => {
    // Inter-entity interaction tests
  });

  describe('events', () => {
    // Event emission tests
  });
});
```

## Common Testing Patterns

### Entity Creation
```typescript
describe('Entity Creation', () => {
  test('should initialize with default values', () => {
    const entity = new GameEntity('test-id');
    
    expect(entity.id).toBe('test-id');
    expect(entity.health).toBe(100);
    expect(entity.position).toEqual({ x: 0, y: 0 });
  });

  test('should initialize with custom values', () => {
    const config = {
      id: 'custom-id',
      health: 150,
      position: { x: 10, y: 20 }
    };
    
    const entity = new GameEntity(config);
    
    expect(entity.id).toBe(config.id);
    expect(entity.health).toBe(config.health);
    expect(entity.position).toEqual(config.position);
  });
});
```

### Property Validation
```typescript
describe('Property Validation', () => {
  test('should enforce minimum health value', () => {
    const entity = new GameEntity('test-id');
    
    entity.takeDamage(150);
    
    expect(entity.health).toBe(0);
    expect(entity.isAlive).toBe(false);
  });

  test('should enforce maximum health value', () => {
    const entity = new GameEntity('test-id');
    
    entity.heal(50);
    
    expect(entity.health).toBeLessThanOrEqual(entity.maxHealth);
  });
});
```

## State Testing

### State Transitions
```typescript
describe('State Management', () => {
  test('should transition through damage states', () => {
    const entity = new GameEntity('test-id');
    
    // Full health
    expect(entity.healthState).toBe('healthy');
    
    // Take damage
    entity.takeDamage(60);
    expect(entity.healthState).toBe('injured');
    
    // Critical
    entity.takeDamage(30);
    expect(entity.healthState).toBe('critical');
    
    // Dead
    entity.takeDamage(20);
    expect(entity.healthState).toBe('dead');
  });

  test('should prevent invalid state transitions', () => {
    const entity = new GameEntity('test-id');
    entity.takeDamage(100); // Kill entity
    
    // Attempt to heal dead entity
    expect(() => entity.heal(50)).toThrow('Cannot heal dead entity');
  });
});
```

## Event Testing

### Event Emissions
```typescript
describe('Event Emissions', () => {
  test('should emit events on state changes', () => {
    const entity = new GameEntity('test-id');
    const eventSpy = jest.spyOn(entity.events, 'emit');
    
    entity.takeDamage(50);
    
    expect(eventSpy).toHaveBeenCalledWith('healthChanged', {
      entityId: 'test-id',
      previousHealth: 100,
      currentHealth: 50
    });
  });

  test('should emit death event when health reaches 0', () => {
    const entity = new GameEntity('test-id');
    const eventSpy = jest.spyOn(entity.events, 'emit');
    
    entity.takeDamage(100);
    
    expect(eventSpy).toHaveBeenCalledWith('entityDied', {
      entityId: 'test-id',
      cause: 'damage'
    });
  });
});
```

## Examples

### Complete Entity Test Suite
```typescript
import { PlayerEntity } from '../../../src/entities/player.entity';
import { ItemEntity } from '../../../src/entities/item.entity';

describe('PlayerEntity', () => {
  let player: PlayerEntity;
  
  beforeEach(() => {
    player = new PlayerEntity({
      id: 'player-1',
      name: 'Test Player'
    });
  });
  
  describe('inventory management', () => {
    test('should add items to inventory', () => {
      const item = new ItemEntity({
        id: 'item-1',
        type: 'weapon',
        stats: { damage: 10 }
      });
      
      player.addItem(item);
      
      expect(player.inventory.has(item.id)).toBe(true);
      expect(player.inventory.size).toBe(1);
    });
    
    test('should remove items from inventory', () => {
      const item = new ItemEntity({
        id: 'item-1',
        type: 'weapon'
      });
      
      player.addItem(item);
      player.removeItem(item.id);
      
      expect(player.inventory.has(item.id)).toBe(false);
      expect(player.inventory.size).toBe(0);
    });
    
    test('should throw error when inventory is full', () => {
      // Fill inventory to capacity
      for (let i = 0; i < player.inventoryCapacity; i++) {
        player.addItem(new ItemEntity({
          id: `item-${i}`,
          type: 'misc'
        }));
      }
      
      // Attempt to add one more item
      const extraItem = new ItemEntity({
        id: 'extra-item',
        type: 'misc'
      });
      
      expect(() => player.addItem(extraItem))
        .toThrow('Inventory is full');
    });
  });
  
  describe('equipment management', () => {
    test('should equip items in appropriate slots', () => {
      const weapon = new ItemEntity({
        id: 'weapon-1',
        type: 'weapon',
        slot: 'mainHand'
      });
      
      player.equipItem(weapon);
      
      expect(player.equipment.mainHand).toBe(weapon);
      expect(player.inventory.has(weapon.id)).toBe(false);
    });
    
    test('should update stats when equipping items', () => {
      const weapon = new ItemEntity({
        id: 'weapon-1',
        type: 'weapon',
        stats: { damage: 10, critChance: 5 }
      });
      
      const initialDamage = player.stats.damage;
      player.equipItem(weapon);
      
      expect(player.stats.damage).toBe(initialDamage + 10);
      expect(player.stats.critChance).toBe(5);
    });
  });
});
```

## Best Practices

1. **Test Setup**
   - Use factory functions for creating test entities
   - Reset entity state before each test
   - Mock dependencies and external systems

2. **State Verification**
   - Test all possible state transitions
   - Verify state consistency
   - Test boundary conditions

3. **Event Testing**
   - Use spies to verify event emissions
   - Test event payload contents
   - Verify event ordering when relevant

4. **Error Handling**
   - Test invalid operations
   - Verify error messages
   - Test error state recovery

## Version Control
- Version: 1.0.0
- Last Updated: [Current Date]
- Status: Active 