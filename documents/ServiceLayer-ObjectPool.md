# Object Pool Service

## Problem Statement

Our mobile game architecture currently suffers from several performance issues related to object management:

1. **Frequent garbage collection pauses** - Creating and destroying game objects constantly leads to GC pauses that create frame drops and jank
2. **Memory fragmentation** - Repeated allocation and deallocation leads to memory fragmentation over time
3. **Inconsistent object lifecycle** - Different systems manage object creation/destruction differently
4. **Performance bottlenecks during intense gameplay** - Large numbers of objects (projectiles, particles, enemies) created during gameplay spikes cause performance drops
5. **Difficulty monitoring object usage** - No central system to track and monitor object usage patterns
6. **Redundant initialization code** - Object initialization logic is often duplicated across the codebase

## Role in Service Layer Architecture

The ObjectPoolService is a **performance optimization service** in our architecture that:

1. **Reduces garbage collection** - Reuses objects instead of creating/destroying them
2. **Centralizes object lifecycle** - Provides a consistent pattern for managing reusable objects
3. **Improves performance** - Minimizes allocation during gameplay by pre-allocating objects
4. **Enables monitoring** - Provides metrics on pool usage and object reuse
5. **Simplifies object management** - Removes redundant creation/reset logic from game components

The ObjectPoolService will be implemented during **Phase 2** as part of our core services group, focusing on performance improvements for commonly created objects like projectiles, particles, and UI elements.

## Interface Definition

```typescript
export interface IObjectPoolService {
  // Generic object pool management
  createPool<T>(poolId: string, factory: () => T, resetFn?: (obj: T) => void, initialSize?: number): void;
  getFromPool<T>(poolId: string): T;
  returnToPool<T>(poolId: string, object: T): void;
  clearPool(poolId: string): void;
  
  // Phaser-specific helpers
  createSpritePool(scene: Phaser.Scene, textureKey: string, poolId?: string, initialSize?: number): string;
  createParticlePool(scene: Phaser.Scene, textureKey: string, poolId?: string, initialSize?: number): string;
  
  // Monitoring
  getPoolSize(poolId: string): number;
  getActiveObjectCount(poolId: string): number;
}
```

## Test-Driven Development Approach

### 1. Test Plan

We'll implement the ObjectPoolService using TDD with these test categories:

1. **Pool Creation and Management**
   - Test creating pools with different configurations
   - Test creating custom pools with specific factory functions
   - Test clearing pools
   - Test error handling for invalid pool operations

2. **Object Lifecycle**
   - Test getting objects from pools
   - Test returning objects to pools
   - Test object reuse patterns
   - Test object reset functionality

3. **Performance**
   - Test allocation speed compared to direct creation
   - Test with large numbers of objects
   - Test memory usage patterns
   - Test under high-frequency get/return cycles

4. **Phaser Integration**
   - Test Phaser-specific object pools (sprites, particles)
   - Test integration with Phaser's scene lifecycle
   - Test compatibility with Phaser's object methods

5. **Monitoring**
   - Test pool size reporting
   - Test active object counting
   - Test pool statistics

### 2. Sample Test Cases

```typescript
// __tests__/services/ObjectPoolService.test.ts
import { ObjectPoolService } from '../../services/ObjectPoolService';

describe('ObjectPoolService', () => {
  let poolService: ObjectPoolService;
  
  beforeEach(() => {
    poolService = new ObjectPoolService();
  });
  
  describe('Pool Creation and Management', () => {
    test('should create a pool with factory function', () => {
      // Arrange
      const factory = jest.fn(() => ({ value: 42 }));
      
      // Act
      poolService.createPool('test.pool', factory, undefined, 5);
      
      // Assert
      expect(poolService.getPoolSize('test.pool')).toBe(5);
      expect(factory).toHaveBeenCalledTimes(5);
    });
    
    test('should create empty pool if initialSize is 0', () => {
      // Arrange
      const factory = jest.fn(() => ({ value: 42 }));
      
      // Act
      poolService.createPool('test.pool', factory, undefined, 0);
      
      // Assert
      expect(poolService.getPoolSize('test.pool')).toBe(0);
      expect(factory).not.toHaveBeenCalled();
    });
    
    test('should clear pool correctly', () => {
      // Arrange
      poolService.createPool('test.pool', () => ({ value: 42 }), undefined, 5);
      
      // Act
      poolService.clearPool('test.pool');
      
      // Assert
      expect(poolService.getPoolSize('test.pool')).toBe(0);
    });
    
    test('should throw error when accessing non-existent pool', () => {
      // Act & Assert
      expect(() => {
        poolService.getFromPool('nonexistent.pool');
      }).toThrow();
    });
  });
  
  describe('Object Lifecycle', () => {
    test('should get object from pool', () => {
      // Arrange
      const factory = () => ({ value: 42 });
      poolService.createPool('test.pool', factory, undefined, 5);
      
      // Act
      const obj = poolService.getFromPool('test.pool');
      
      // Assert
      expect(obj).toEqual({ value: 42 });
      expect(poolService.getPoolSize('test.pool')).toBe(4);
      expect(poolService.getActiveObjectCount('test.pool')).toBe(1);
    });
    
    test('should create new object if pool is empty', () => {
      // Arrange
      const factory = jest.fn(() => ({ value: 42 }));
      poolService.createPool('test.pool', factory, undefined, 0);
      
      // Reset mock counts
      factory.mockClear();
      
      // Act
      const obj = poolService.getFromPool('test.pool');
      
      // Assert
      expect(obj).toEqual({ value: 42 });
      expect(factory).toHaveBeenCalledTimes(1);
    });
    
    test('should return object to pool', () => {
      // Arrange
      poolService.createPool('test.pool', () => ({ value: 42 }), undefined, 1);
      const obj = poolService.getFromPool('test.pool');
      
      // Act
      poolService.returnToPool('test.pool', obj);
      
      // Assert
      expect(poolService.getPoolSize('test.pool')).toBe(1);
      expect(poolService.getActiveObjectCount('test.pool')).toBe(0);
    });
    
    test('should reset object when returned to pool', () => {
      // Arrange
      const resetFn = jest.fn((obj) => { obj.value = 0; });
      poolService.createPool('test.pool', () => ({ value: 42 }), resetFn, 1);
      
      const obj = poolService.getFromPool('test.pool');
      obj.value = 100; // Modify the object
      
      // Act
      poolService.returnToPool('test.pool', obj);
      const newObj = poolService.getFromPool('test.pool');
      
      // Assert
      expect(resetFn).toHaveBeenCalled();
      expect(newObj.value).toBe(0); // Should be reset value, not 100
    });
  });
  
  describe('Performance', () => {
    test('should reuse objects instead of creating new ones', () => {
      // Arrange
      const factory = jest.fn(() => ({ value: 42 }));
      poolService.createPool('test.pool', factory, undefined, 1);
      
      // Act - get and return the same object multiple times
      const obj1 = poolService.getFromPool('test.pool');
      poolService.returnToPool('test.pool', obj1);
      
      const obj2 = poolService.getFromPool('test.pool');
      poolService.returnToPool('test.pool', obj2);
      
      const obj3 = poolService.getFromPool('test.pool');
      
      // Assert - factory should only be called once for initial creation
      expect(factory).toHaveBeenCalledTimes(1);
      
      // All objects should be the same instance
      expect(obj1).toBe(obj2);
      expect(obj2).toBe(obj3);
    });
    
    test('should handle high volume of get/return operations', () => {
      // Arrange
      const factory = jest.fn(() => ({ value: 42 }));
      poolService.createPool('test.pool', factory, undefined, 10);
      
      // Act - simulate intense usage pattern
      const objects = [];
      for (let i = 0; i < 100; i++) {
        objects.push(poolService.getFromPool('test.pool'));
      }
      
      // Return all objects
      objects.forEach(obj => poolService.returnToPool('test.pool', obj));
      
      // Assert - should have created exactly 100 objects
      expect(factory).toHaveBeenCalledTimes(100);
      expect(poolService.getPoolSize('test.pool')).toBe(100);
      expect(poolService.getActiveObjectCount('test.pool')).toBe(0);
    });
  });
  
  describe('Phaser Integration', () => {
    // Mock Phaser scene and objects for testing
    const mockScene = {
      add: {
        sprite: jest.fn(() => mockSprite),
        particles: jest.fn(() => mockParticle)
      }
    };
    
    const mockSprite = {
      setActive: jest.fn(),
      setVisible: jest.fn(),
      setPosition: jest.fn(),
      setRotation: jest.fn(),
      disableBody: jest.fn()
    };
    
    const mockParticle = {
      setActive: jest.fn(),
      setVisible: jest.fn()
    };
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
    });
    
    test('should create sprite pool', () => {
      // Act
      const poolId = poolService.createSpritePool(mockScene as any, 'player', undefined, 5);
      
      // Assert
      expect(poolId).toBeDefined();
      expect(mockScene.add.sprite).toHaveBeenCalledTimes(5);
      expect(poolService.getPoolSize(poolId)).toBe(5);
    });
    
    test('should create particle pool', () => {
      // Act
      const poolId = poolService.createParticlePool(mockScene as any, 'explosion', undefined, 10);
      
      // Assert
      expect(poolId).toBeDefined();
      expect(mockScene.add.particles).toHaveBeenCalledTimes(10);
      expect(poolService.getPoolSize(poolId)).toBe(10);
    });
    
    test('should properly reset sprite when returned to pool', () => {
      // Arrange
      const poolId = poolService.createSpritePool(mockScene as any, 'player', undefined, 1);
      const sprite = poolService.getFromPool(poolId);
      
      // Act
      poolService.returnToPool(poolId, sprite);
      
      // Assert
      expect(sprite.setActive).toHaveBeenCalledWith(false);
      expect(sprite.setVisible).toHaveBeenCalledWith(false);
      expect(sprite.disableBody).toHaveBeenCalled();
    });
  });
  
  describe('Monitoring', () => {
    test('should report correct pool size', () => {
      // Arrange
      poolService.createPool('test.pool', () => ({}), undefined, 10);
      
      // Get some objects
      poolService.getFromPool('test.pool');
      poolService.getFromPool('test.pool');
      
      // Act & Assert
      expect(poolService.getPoolSize('test.pool')).toBe(8);
    });
    
    test('should report correct active object count', () => {
      // Arrange
      poolService.createPool('test.pool', () => ({}), undefined, 10);
      
      // Get some objects
      const obj1 = poolService.getFromPool('test.pool');
      const obj2 = poolService.getFromPool('test.pool');
      const obj3 = poolService.getFromPool('test.pool');
      
      // Return one
      poolService.returnToPool('test.pool', obj2);
      
      // Act & Assert
      expect(poolService.getActiveObjectCount('test.pool')).toBe(2);
    });
  });
});
```

### 3. Implementation Strategy

1. **Start with core functionality**
   - Implement basic pool creation and management
   - Add object retrieval and return
   - Make tests pass with minimal implementation

2. **Add object lifecycle management**
   - Implement object reset functionality
   - Add tracking of active vs. pooled objects
   - Ensure proper error handling for edge cases

3. **Optimize for performance**
   - Implement efficient data structures for pools
   - Add pre-allocation capabilities
   - Optimize get/return operations for speed

4. **Add Phaser integration**
   - Create Phaser-specific pool types
   - Implement proper reset for Phaser objects
   - Add integration with Phaser scene lifecycle

5. **Add monitoring capabilities**
   - Implement pool statistics tracking
   - Add performance metrics
   - Create debugging helpers

### 4. Acceptance Criteria

The ObjectPoolService implementation will be considered complete when:

1. All tests pass consistently
2. The interface is fully implemented
3. Performance testing shows significant improvement over direct object creation
4. Memory profiling shows reduced GC pauses
5. It properly integrates with Phaser's object lifecycle
6. It provides useful monitoring data
7. Documentation is complete with usage examples

## Integration with Game Systems

The ObjectPoolService will be used throughout our game for managing frequently created objects:

### 1. Projectile System

```typescript
export class ProjectileSystem {
  private objectPoolService: IObjectPoolService;
  private scene: Phaser.Scene;
  private projectilePools: Map<string, string> = new Map();
  
  constructor(scene: Phaser.Scene, registry: IRegistry) {
    this.scene = scene;
    this.objectPoolService = registry.getService<IObjectPoolService>('objectPool');
    
    // Create pools for different projectile types
    this.initializeProjectilePools();
  }
  
  private initializeProjectilePools(): void {
    // Create pools for common projectile types
    const arrowPoolId = this.objectPoolService.createSpritePool(
      this.scene, 'arrow', 'projectile.arrow', 20
    );
    this.projectilePools.set('arrow', arrowPoolId);
    
    const fireballPoolId = this.objectPoolService.createSpritePool(
      this.scene, 'fireball', 'projectile.fireball', 10
    );
    this.projectilePools.set('fireball', fireballPoolId);
  }
  
  public fireProjectile(type: string, x: number, y: number, angle: number): Phaser.GameObjects.Sprite {
    const poolId = this.projectilePools.get(type);
    if (!poolId) {
      throw new Error(`Unknown projectile type: ${type}`);
    }
    
    const projectile = this.objectPoolService.getFromPool<Phaser.GameObjects.Sprite>(poolId);
    
    // Configure the projectile
    projectile.setPosition(x, y);
    projectile.setRotation(angle);
    projectile.setActive(true);
    projectile.setVisible(true);
    
    // Add physics if needed
    // this.scene.physics.world.enable(projectile);
    
    return projectile;
  }
  
  public returnProjectile(type: string, projectile: Phaser.GameObjects.Sprite): void {
    const poolId = this.projectilePools.get(type);
    if (!poolId) {
      throw new Error(`Unknown projectile type: ${type}`);
    }
    
    this.objectPoolService.returnToPool(poolId, projectile);
  }
}
```

### 2. Particle Effect System

```typescript
export class ParticleEffectSystem {
  private objectPoolService: IObjectPoolService;
  private scene: Phaser.Scene;
  private effectPools: Map<string, string> = new Map();
  
  constructor(scene: Phaser.Scene, registry: IRegistry) {
    this.scene = scene;
    this.objectPoolService = registry.getService<IObjectPoolService>('objectPool');
    
    // Create pools for different effect types
    this.initializeEffectPools();
  }
  
  private initializeEffectPools(): void {
    // Create pools for common effects
    const explosionPoolId = this.objectPoolService.createParticlePool(
      this.scene, 'explosion', 'effect.explosion', 5
    );
    this.effectPools.set('explosion', explosionPoolId);
    
    const sparkPoolId = this.objectPoolService.createParticlePool(
      this.scene, 'spark', 'effect.spark', 10
    );
    this.effectPools.set('spark', sparkPoolId);
  }
  
  public playEffect(type: string, x: number, y: number, duration: number = 1000): void {
    const poolId = this.effectPools.get(type);
    if (!poolId) {
      throw new Error(`Unknown effect type: ${type}`);
    }
    
    const effect = this.objectPoolService.getFromPool<Phaser.GameObjects.Particles.ParticleEmitter>(poolId);
    
    // Configure the effect
    effect.setPosition(x, y);
    effect.setActive(true);
    effect.setVisible(true);
    
    // Start the effect
    effect.start();
    
    // Schedule return to pool
    this.scene.time.delayedCall(duration, () => {
      effect.stop();
      this.objectPoolService.returnToPool(poolId, effect);
    });
  }
}
```

### 3. UI Element Pooling

```typescript
export class UIElementFactory {
  private objectPoolService: IObjectPoolService;
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene, registry: IRegistry) {
    this.scene = scene;
    this.objectPoolService = registry.getService<IObjectPoolService>('objectPool');
    
    // Create pools for common UI elements
    this.initializeUIPools();
  }
  
  private initializeUIPools(): void {
    // Create a pool for damage text
    this.objectPoolService.createPool<Phaser.GameObjects.Text>(
      'ui.damageText',
      () => this.scene.add.text(0, 0, '', { fontSize: '16px', color: '#FF0000' }),
      (text) => {
        text.setActive(false);
        text.setVisible(false);
        text.setText('');
      },
      20
    );
    
    // Create a pool for item tooltips
    this.objectPoolService.createPool<Phaser.GameObjects.Container>(
      'ui.tooltip',
      () => this.createTooltipContainer(),
      (tooltip) => {
        tooltip.setActive(false);
        tooltip.setVisible(false);
      },
      5
    );
  }
  
  private createTooltipContainer(): Phaser.GameObjects.Container {
    // Create a complex UI component using multiple elements
    const container = this.scene.add.container(0, 0);
    const background = this.scene.add.rectangle(0, 0, 200, 100, 0x000000, 0.7);
    const text = this.scene.add.text(-90, -40, '', { fontSize: '12px', color: '#FFFFFF', wordWrap: { width: 180 } });
    
    container.add([background, text]);
    return container;
  }
  
  public showDamageText(x: number, y: number, value: number): void {
    const text = this.objectPoolService.getFromPool<Phaser.GameObjects.Text>('ui.damageText');
    
    text.setText(value.toString());
    text.setPosition(x, y);
    text.setActive(true);
    text.setVisible(true);
    
    // Animate the text
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.objectPoolService.returnToPool('ui.damageText', text);
      }
    });
  }
  
  public showTooltip(x: number, y: number, content: string): Phaser.GameObjects.Container {
    const tooltip = this.objectPoolService.getFromPool<Phaser.GameObjects.Container>('ui.tooltip');
    
    tooltip.setPosition(x, y);
    tooltip.setActive(true);
    tooltip.setVisible(true);
    
    // Update the tooltip text
    const text = tooltip.getByName('text') as Phaser.GameObjects.Text;
    text.setText(content);
    
    return tooltip;
  }
  
  public hideTooltip(tooltip: Phaser.GameObjects.Container): void {
    this.objectPoolService.returnToPool('ui.tooltip', tooltip);
  }
}
```

## Performance Considerations

1. **Initial allocation strategy**: Balance between pre-allocating objects and lazy creation
2. **Memory overhead**: Monitor the memory footprint of maintaining unused pools
3. **Pool sizing**: Develop guidelines for appropriate pool sizes based on object type
4. **Thread safety**: Ensure thread-safe operations for asynchronous object retrieval/return
5. **Pool growth policy**: Determine if pools should grow dynamically or maintain fixed size

## Key Benefits

1. **Reduced garbage collection**: Fewer object allocations leads to less GC activity
2. **Improved frame rates**: More consistent performance during intense gameplay
3. **Memory efficiency**: Better memory usage patterns and reduced fragmentation
4. **Simplified object management**: Consistent pattern for object reuse
5. **Better monitoring**: Centralized tracking of object creation and usage

## Migration Strategy

1. **Identify high-frequency objects**: Start with objects created most frequently
2. **Create specialized pools**: Implement pools for specific object types
3. **Refactor systems incrementally**: Update one system at a time to use object pooling
4. **Measure and adjust**: Monitor performance metrics and adjust pool sizes accordingly
5. **Document patterns**: Create clear documentation on pool usage patterns for developers 