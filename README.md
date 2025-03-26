# Mobile Game 1

A 2D game built with Phaser.js featuring a player character with various actions and animations.

## Features

- Player movement with WASD/arrow keys
- Various player actions (collecting, cutting, mining, fishing, etc.)
- Carrying mechanic (toggle with 'C' key)
- Collision detection
- Action cooldowns

## Project Structure

```
src/
├── controllers/
│   ├── GameController.js    # Main game logic
│   └── InputController.js   # Input handling
├── models/
│   ├── Actions.js          # Game actions definitions
│   ├── Player.js           # Player model
│   └── Dungeon.js         # Dungeon/level management
```

## Development

1. Clone the repository
2. Install dependencies
3. Run the development server

## Controls

- WASD / Arrow Keys: Movement
- C: Toggle carrying
- E: Collect
- 1: Cut
- 2: Mine
- 3: Fish
- 4: Water
- 5: Pierce
- H: Hit
- X: Death 