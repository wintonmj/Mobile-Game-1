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
├── controllers/        # Controllers for handling game logic and input
├── models/             # Data models and business logic
├── views/              # UI components and Phaser scenes
├── assets/             # Game assets (sprites, audio, etc.)
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Development Workflow

This project follows a test-driven development approach. See [WORKFLOW.md](WORKFLOW.md) for detailed guidelines.

### Project Goals

For a detailed description of project goals and roadmap, see [GOALS.md](GOALS.md).

### Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build the project for production
- `npm run start` - Preview the production build
- `npm run lint` - Run ESLint for code linting
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run check` - Run all checks (lint, test, build)
- `./run.sh` - Watch for changes and run comprehensive checks
- `./run.sh check` - Run checks once
- `./run.sh watch` - Watch for changes and run checks
- `./run.sh run` - Run both game server and MCP server

### Running Specific Tests

To run a specific test or set of tests, use the following syntax:

```bash
# Run a specific test
npm test -- path/to/test/file.test.ts --testNamePattern="test name"

# Run tests with increased timeout
npm test -- path/to/test/file.test.ts --testNamePattern="test name" --testTimeout=15000

# Run tests matching a pattern
npm test -- path/to/test/file.test.ts --testNamePattern="pattern"
```

For example, to run a specific test in the AssetService:
```bash
npm test -- src/__tests__/services/AssetService.test.ts --testNamePattern="should keep persistent assets in cache"
```

Note: The `--` after `npm test` is required to pass arguments to Jest.

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

## Architecture

This project follows the MVC (Model-View-Controller) architecture:

- **Models**: Data structures and business logic
- **Views**: Phaser scenes and UI components
- **Controllers**: Game logic and input handling

## Technologies

- **Phaser 3**: HTML5 game framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast development server and bundler
- **Jest**: Testing framework
- **ESLint & Prettier**: Code quality tools

## Debugging with MCP

This project includes a Model Context Protocol (MCP) server for advanced debugging of game components.

### MCP Server

The MCP server provides a set of tools that can be used with Cursor AI to debug game issues:

- **optimizeAnimations**: Suggests optimizations for animation loading
- **validateGameAssets**: Validates game assets and ensures proper loading
- **debugAnimationLoader**: Checks animation loading issues and suggests fixes
- **analyzePerformance**: Identifies performance bottlenecks
- **logGameState**: Logs the current game state for debugging

### Using the MCP Server

1. Start the MCP server:
   ```
   ./run.sh run
   ```
   This will start both the game server and MCP server. The MCP server runs on port 5174 by default.

2. The MCP configuration is located in `.cursor/mcp.json` and is automatically loaded by Cursor.

3. Use Cursor AI to access MCP tools by asking questions about debugging animation loading or analyzing performance.

4. You can also directly query the MCP server:
   ```
   curl -X POST http://localhost:5174/api/mcp -H "Content-Type: application/json" -d '{"tool":"logGameState"}'
   ```


create more sprites with https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/#?body=Body_color_blue&head=Human_male_blue&sex=muscular&shadow=none_Shadow&shoulders=Legion_gold 