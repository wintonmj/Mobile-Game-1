# Debugging Guide

## Overview
This document outlines common debugging procedures, tools, and strategies for the project.

## Debug Utilities

### Browser Developer Tools
- **Console**: Use `console.log()`, `console.warn()`, and `console.error()` for basic debugging
- **Network Panel**: Monitor asset loading, API calls, and network performance
- **Performance Tab**: Record and analyze runtime performance
- **Memory Tab**: Identify memory issues and leaks
- **Application Tab**: Inspect local storage, session storage, and IndexedDB

### Phaser-Specific Utilities
- **Debug Mode**: Enable with `game.config.physics.arcade.debug = true`
- **Display List**: Access via `scene.children.list` to inspect all game objects
- **FPS Display**: Add with `scene.add.fps(x, y)` to monitor performance
- **Camera Debug**: Use `camera.renderDebug()` to visualize camera bounds

### Custom Debug Tools
- **State Inspector**: Access game state with `window.DEBUG_STATE = gameState`
- **Service Logger**: Enable with `ServiceRegistry.enableDebugLogging()`
- **Event Monitor**: Track events with `EventSystem.enableVerboseLogging()`
- **Performance Metrics**: Toggle with `PerformanceMonitor.startTracking()`

## Common Debugging Scenarios and Solutions

### Input Not Responding
1. Check if input is enabled: `scene.input.enabled`
2. Verify input zones are correctly positioned
3. Ensure event listeners are properly attached
4. Check for overlapping interactive objects

### Assets Not Loading
1. Verify file paths in asset manifest
2. Check browser console for 404 errors
3. Ensure preload function calls `this.load.start()`
4. Validate asset keys for duplicates

### Game Objects Not Appearing
1. Check if objects are within camera bounds
2. Verify z-index and depth values
3. Ensure alpha value isn't set to 0
4. Check if objects are added to the correct scene

### Physics Issues
1. Validate collision groups and categories
2. Check body sizes and offsets
3. Ensure physics system is enabled
4. Debug colliders with `physics.world.createDebugGraphic()`

## Performance Profiling Procedures

### Frame Rate Analysis
1. Add FPS counter: `scene.add.fps(10, 10, 0xffffff)`
2. Monitor during resource-intensive scenes
3. Identify patterns in frame drops
4. Use Chrome DevTools Performance tab to capture detailed frame data

### CPU Profiling
1. Open Chrome DevTools and navigate to Performance tab
2. Click "Record" button before triggering problematic scenario
3. Perform actions that cause performance issues
4. Stop recording and analyze call stack
5. Look for functions consuming excessive time

### GPU Profiling
1. Enable GPU profiling in Chrome DevTools (Performance tab)
2. Focus on render times and GPU tasks
3. Check for excessive draw calls
4. Identify shader compilation issues

### Asset Loading Optimization
1. Monitor Network tab during game initialization
2. Check for large assets causing delays
3. Verify proper use of texture atlases
4. Implement progressive loading for large assets

## Memory Leak Detection

### Chrome Memory Tools
1. Take heap snapshot before gameplay (DevTools Memory tab)
2. Perform actions suspected to cause leaks
3. Take another snapshot
4. Compare snapshots to identify retained objects

### Common Memory Leak Sources
1. **Event Listeners**: Ensure all listeners are removed when scenes change
2. **DOM Elements**: Check for references to removed DOM elements
3. **Texture Cache**: Verify textures are being properly destroyed
4. **Scene Objects**: Ensure all objects are destroyed when scenes are shut down

### Implementing Memory Monitoring
1. Add periodic memory logging:
   ```typescript
   setInterval(() => {
     if (window.performance && window.performance.memory) {
       console.log('Memory usage:', Math.round(window.performance.memory.usedJSHeapSize / 1048576), 'MB');
     }
   }, 5000);
   ```

2. Track object counts:
   ```typescript
   function logObjectCounts(scene) {
     console.log('Game Objects:', scene.children.length);
     console.log('Physics Bodies:', scene.physics.world.bodies.size);
     console.log('Tweens:', scene.tweens.getAllTweens().length);
   }
   ```

### Preventing Memory Leaks
1. Implement proper destroy methods for all custom classes
2. Use weak references for caching objects
3. Create memory cleanup routines for scene transitions
4. Implement resource pooling for frequently created/destroyed objects

## Debugging Workflow
1. Reproduce the issue
2. Gather relevant logs
3. Isolate the problem
4. Apply fixes
5. Test thoroughly
6. Document the solution

## Best Practices
- Use meaningful log messages
- Implement proper error handling
- Keep debugging code separate
- Document known issues and their solutions
- Create debug configuration flags to enable/disable debug features 