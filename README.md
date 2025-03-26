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
- `./check.sh` - Run comprehensive code quality checks

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