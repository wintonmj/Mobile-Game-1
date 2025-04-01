# Getting Started Guide

## Overview
This guide provides a quick but comprehensive starting point for developers new to the project. It will help you set up your development environment, understand the codebase structure, and begin contributing to the project.

## Quick Start Summary

1. **Setup Environment**
   ```bash
   # Clone the repository
   git clone [REPOSITORY_URL]
   cd [PROJECT_DIRECTORY]
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

2. **Access Development Server**
   - Open http://localhost:5173 in your browser

3. **Run Tests**
   ```bash
   npm run test
   ```

## Prerequisites

### Required Software
- **Node.js**: v18.0+ LTS or v20.0+ LTS 
- **npm**: v8.0+
- **Git**: v2.x or higher
- **Recommended IDE**: Cursor (or VS Code with appropriate extensions)
- **Browser**: Chrome, Firefox, or Edge (latest versions)
- **System Requirements**:
  - Memory: 8GB RAM recommended (4GB minimum)
  - Disk Space: At least 2GB of free disk space
  - Operating System: Windows 10/11, macOS 10.15+, or Linux

For detailed environment setup, see [Environment Setup Guide](./environment-setup.md).

### Global Dependencies
```bash
# Core development tools
npm install -g typescript@5.0.0
npm install -g vite@4.0.0

# Asset processing tools
npm install -g texture-packer
npm install -g imagemin-cli

# Development utilities
npm install -g concurrently
npm install -g cross-env
```

## Project Setup

1. **Clone Repository**
   ```bash
   git clone [REPOSITORY_URL]
   cd [PROJECT_DIRECTORY]
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure IDE**
   #### Cursor (Recommended)
   1. Open Cursor
   2. Open the project folder: File > Open Folder > [PROJECT_DIRECTORY]
   3. Install recommended extensions:
      - ESLint
      - Prettier
      - Git Integration
      - Phaser.js snippets (if available)

   #### VSCode Alternative
   1. Open VSCode
   2. Open the project folder: File > Open Folder > [PROJECT_DIRECTORY]
   3. Install recommended extensions:
      - ESLint
      - Prettier
      - Git Lens
      - TypeScript support

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access at http://localhost:5173

5. **Verify Setup**
   ```bash
   # Run tests
   npm run test
   
   # Check build process
   npm run build
   ```

## Project Structure
```
src/
├── controllers/        # Game logic and input handling
├── models/             # Data models and business logic
├── views/              # UI components and Phaser scenes
├── assets/             # Game assets (sprites, audio, etc.)
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

For a complete overview, see [Project Structure](../ProjectStructure.md).

## Technical Stack

- **Game Engine**: Phaser.js 3.60+
- **Language**: TypeScript 5.0+
- **Build Tool**: Vite 4.0+
- **Testing**: Jest 29.7+
- **Linting**: ESLint 8.0+ with Prettier 3.0+

For comprehensive details on our technical choices, see [Technical Stack Documentation](../architecture/technical-stack.md).

## Development Workflow

### Git Workflow
We follow the trunk-based development approach for faster iterations:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: For new features
- `bugfix/*`: For bug fixes
- `release/*`: For release preparation
- `hotfix/*`: For critical production fixes

#### Git Hooks
- Pre-commit: Runs linting and formatting
- Pre-push: Runs tests automatically

Commit messages follow the conventional format:
```
type(scope): short description

[optional longer description]

[optional JIRA reference]
```

For full workflow documentation, see [Development Workflow Guide](./development-workflow.md).

### Code Quality Tools

#### ESLint Configuration
- Enforces TypeScript best practices
- Prevents common errors
- Maintains consistent code style
- Detects potential problems

#### Prettier Configuration
- Semi: true (always use semicolons)
- Trailing Comma: es5
- Single Quote: true
- Print Width: 100
- Tab Width: 2
- End of Line: auto

#### TypeScript Configuration
Key compiler options:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true
  }
}
```

## Core Concepts

### MVC Architecture
The project follows Model-View-Controller architecture:
- **Models**: Data structures and business logic
- **Views**: Phaser scenes and UI components
- **Controllers**: Game logic and input handling

### Service Registry Pattern
Services are registered with a central registry for easy access throughout the application. See [Service Registry Documentation](../architecture/patterns/service-registry.md) for details.

### Event-Driven Communication
Components communicate through an event system, enabling loose coupling and scalability. See [Event System Documentation](../architecture/patterns/event-driven.md) for implementation details.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run check` - Run all checks (lint, test, build)
- `./run.sh` - Watch for changes and run comprehensive checks
- `./run.sh check` - Run checks once
- `./run.sh watch` - Watch for changes and run checks
- `./run.sh run` - Run both game server and MCP server

## Game Controls

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

## Documentation Structure

The project documentation is organized as follows:
```
docs/
├── README.md                    # Project overview
├── architecture/                # Architecture documentation
│   ├── decisions/               # Architecture Decision Records
│   ├── patterns/                # Design patterns documentation
│   └── diagrams/                # Architecture diagrams
├── implementation/              # Implementation guides
│   ├── getting-started.md       # This document
│   ├── development-workflow.md  # Development process
│   ├── testing-strategy.md      # Testing approach
│   └── environment-setup.md     # Environment setup details
├── api/                         # API documentation
├── design/                      # Game design documentation
├── testing/                     # Testing documentation
└── maintenance/                 # Maintenance guides
```

## Recommended Learning Path

For new developers, we recommend following this learning path:

1. Set up your development environment using this guide
2. Review the [Technical Stack Documentation](../architecture/technical-stack.md)
3. Understand the project structure in [Project Structure](../ProjectStructure.md)
4. Study the core architectural patterns in [High Level Architecture](../architecture/patterns/MVPHighLevelArchitecture.md)
5. Review the development workflow in [Development Workflow Guide](./development-workflow.md)
6. Understand the testing approach in [Testing Strategy](./testing-strategy.md)

## Contributing

Before contributing code, please read the [Contributing Guidelines](../CONTRIBUTING.md) to understand our coding standards and contribution process.

## Troubleshooting

### Common Issues

#### Node.js Version Issues
**Issue**: Incompatible Node.js version
**Solution**: Use nvm to install and use the correct version:
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Install and use the required Node.js version
nvm install 18
nvm use 18
```

#### Package Installation Errors
**Issue**: Errors during npm install
**Solution**: Clear npm cache and retry:
```bash
npm cache clean --force
npm install
```

#### TypeScript Compilation Errors
**Issue**: TypeScript compilation failures
**Solution**: Ensure TypeScript is properly installed:
```bash
# Verify TypeScript installation
npx tsc --version

# If necessary, install the specific version
npm install typescript@5.0.0 --save-dev
```

#### Vite Development Server Issues
**Issue**: Development server won't start
**Solution**: Check for port conflicts and try an alternative port:
```bash
npm run dev -- --port 3000
```

#### Phaser.js Loading Issues
**Issue**: Phaser.js not loading correctly in the browser
**Solution**: Ensure Phaser.js is properly installed:
```bash
# Reinstall Phaser
npm install phaser@3.60.0 --save
```

For additional troubleshooting, see [Environment Setup Guide](./environment-setup.md).

## Next Steps

After setting up your environment and understanding the basics:

1. Pick a simple task from the issue tracker
2. Create a feature branch following our naming convention
3. Implement the feature with tests
4. Submit a pull request following our PR template

## Support

If you encounter any issues not covered in this guide, please reach out to the project maintainers or create an issue in the project repository. 