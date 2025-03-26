# Dungeon Crawler Game

A simple 2D dungeon crawler game built with Phaser.js using MVC architecture.

## Features

- Tile-based movement
- Dynamic dungeon generation
- Player animations
- Collision detection with walls

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:8080`

## Controls

- Use arrow keys to move the player
- Navigate through the dungeon while avoiding walls

## Architecture

The game follows MVC (Model-View-Controller) architecture:

- **Models**: Handle game state and logic (Player, Dungeon)
- **Views**: Handle rendering and animations (GameScene)
- **Controllers**: Handle user input and game flow (GameController)

## Project Structure

```
src/
├── assets/
│   └── images/
├── models/
│   ├── Player.js
│   └── Dungeon.js
├── views/
│   └── GameScene.js
├── controllers/
│   └── GameController.js
└── main.js
``` 