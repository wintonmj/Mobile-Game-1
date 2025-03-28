# Event Catalog

This directory contains a standardized event catalog for the game, providing a centralized place to define all events used throughout the codebase.

## Purpose

The event catalog helps:

1. **Maintain consistency**: By using predefined event names, we avoid typos and ensure consistent event naming.
2. **Improve discoverability**: Developers can easily find all available events in one place.
3. **Enforce naming conventions**: All events follow the same dot-notation structure (e.g., `player.moved`).
4. **Provide structure**: Events are categorized by domain/feature for better organization.
5. **Enable type checking**: Using constants instead of string literals helps catch errors at compile time.

## Usage

Always import event names from this catalog rather than defining them inline:

```typescript
// Good
import { GameEvents } from '../events/GameEvents';

eventBus.emit(GameEvents.PLAYER.MOVED, { x: 10, y: 20 });
eventBus.on(GameEvents.PLAYER.COLLISION, handleCollision);

// Avoid
eventBus.emit('player.moved', { x: 10, y: 20 }); // Using string literals
eventBus.on('player.collision', handleCollision); // Prone to typos
```

For more specific imports, you can import just the event category you need:

```typescript
import { PLAYER_EVENTS } from '../events/GameEvents';

eventBus.emit(PLAYER_EVENTS.MOVED, { x: 10, y: 20 });
```

## Event Naming Conventions

Events follow a hierarchical dot-notation format:

```
domain.action
domain.entity.action
domain.entity.state.action
```

Examples:
- `player.moved`
- `game.initialized`
- `enemy.detected.player`
- `ui.dialog.started`

## Adding New Events

When adding new events:

1. Find the appropriate category in `GameEvents.ts`
2. Add your event following the naming conventions
3. Add appropriate comments if the event's purpose isn't obvious
4. If your event doesn't fit in any existing category, consider adding a new category

## Event Data

When emitting events, always provide consistent data objects. Document the expected data structure in the component that emits the event.

Example:

```typescript
// Player movement event data structure
interface PlayerMovedEventData {
  x: number;       // World X position
  y: number;       // World Y position
  tileX: number;   // Tile X coordinate
  tileY: number;   // Tile Y coordinate
}

eventBus.emit(GameEvents.PLAYER.MOVED, playerMovedData);
``` 