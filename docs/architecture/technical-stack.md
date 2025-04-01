# Technical Stack Documentation

## Document Purpose
This technical stack documentation represents the final implementation choices for our browser-based RPG. It provides a comprehensive overview of all technologies, tools, and practices used in the project's development, ensuring consistent implementation and maintenance of the game's technical infrastructure.

## Related Documents
- [Technical Stack Proposals](./TechStackProposals.md) - Comprehensive analysis of technical stack options and selection rationale
- [MVPDesign.md](mdc:docs/design/MVPDesign.md) - Core game features and requirements that influenced technical decisions
- [MVPHighLevelArchitecture.md](mdc:docs/architecture/patterns/MVPHighLevelArchitecture.md) - Technical architecture for implementing the MVP features
- [High-Level Vision Design](../design/VisionDesign.md) - Core game features and requirements that influenced technical decisions
- [High-Level Architecture](./patterns/HighLevelArchitecture.md) - Detailed technical architecture
- [Development Guidelines](../development/Guidelines.md) - Standards for development
- [Testing Strategy](../testing/TestingStrategy.md) - Approach to quality assurance

## Contents
1. [Document Context](#document-context)
2. [Core Technologies](#core-technologies)
   - [Game Engine](#game-engine)
   - [Programming Language](#programming-language)
   - [Build System](#build-system)
3. [Quality Assurance](#quality-assurance)
   - [Testing Framework](#testing-framework)
   - [Code Quality Tools](#code-quality-tools)
4. [Development Tools](#development-tools)
5. [Asset Pipeline](#asset-pipeline)
6. [Build and Deployment](#build-and-deployment)
7. [Version Management](#version-management)
8. [Setup Guide](#setup-guide)
9. [Best Practices](#best-practices)
10. [Future Considerations](#future-considerations)

## Document Context
This technical stack documentation represents the final implementation choices for our browser-based RPG, informed by:

1. [Technical Stack Proposals](./TechStackProposals.md): A comprehensive analysis of different technical stacks, including detailed evaluations of Phaser.js, PixiJS + React, Unity WebGL, and Three.js options. Our current stack (Phaser.js + TypeScript + Vite) was selected based on this analysis, particularly due to its optimal balance of development efficiency and feature support for solo development.

2. [High-Level Vision Design](../design/VisionDesign.md): The core game features and requirements outlined in the vision document directly influenced our technical choices, ensuring our stack could effectively support:
   - Complex character creation and progression systems
   - Rich world design with multiple towns and dynamic environments
   - Sophisticated NPC and quest systems
   - Flexible combat and interaction mechanics
   - Comprehensive resource and crafting systems

The technical decisions documented here reflect the best approach to implementing these features while maintaining performance and development efficiency in a browser environment.

## Core Technologies

### Game Engine
- **Technology**: Phaser.js
- **Version**: 3.60+
- **Purpose**: Primary game development framework for 2D RPG development
- **Key Features Used**:
  - WebGL/Canvas rendering with automatic fallback
  - Scene management for game state organization
  - Arcade physics engine for 2D interactions
  - Asset loading and management with caching
  - Multi-touch, keyboard, and gamepad input handling
  - Web Audio and HTML5 Audio support
  - Sprite-based animation system
  - Tile map support for world building

### Programming Language
- **Technology**: TypeScript
- **Version**: 5.0+
- **Purpose**: Development language providing type safety and modern JavaScript features
- **Key Benefits**:
  - Static typing for game objects and states
  - Enhanced IDE support in Cursor
  - Early error detection through type checking
  - Better code organization through interfaces and types
  - Modern JavaScript features
  - Custom type definitions for game states
- **Configuration**: 
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

### Build System
- **Technology**: Vite
- **Version**: 4.0+
- **Purpose**: Development server and build tooling
- **Features**:
  - Hot Module Replacement (HMR) for rapid development
  - Fast builds with esbuild
  - Optimized production builds with code splitting
  - Asset handling with automatic optimization
  - TypeScript integration with type checking
  - Environment variable management
- **Configuration**:
  ```javascript
  export default {
    plugins: [
      // Phaser-specific optimizations
      {
        name: 'phaser-assets',
        enforce: 'pre'
      }
    ],
    build: {
      target: 'es2015',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        // Optimal chunking for game assets
      }
    }
  }
  ```

## Quality Assurance

### Testing Framework
- **Technology**: Jest
- **Version**: 29.7+
- **Purpose**: Unit and integration testing
- **Features**:
  - TypeScript support
  - Snapshot testing for UI components
  - Code coverage reporting with Istanbul
  - Mocking capabilities for Phaser objects
  - Async testing support for game loops
  - WebGL context simulation
- **Configuration**: 
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock'],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts'
    ]
  };
  ```

### Code Quality Tools

#### Linting
- **Technology**: ESLint
- **Version**: 8.0+
- **Configuration**: Custom ruleset for game development
- **Key Rules**:
  ```json
  {
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended"
    ],
    "rules": {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
  ```

#### Code Formatting
- **Technology**: Prettier
- **Version**: 3.0+
- **Configuration**:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```
- **Integration**: 
  - Pre-commit hooks using husky
  - VS Code/Cursor extension
  - CI/CD pipeline integration

## Development Tools

### Version Control
- **System**: Git
- **Hosting**: GitHub/GitLab
- **Branch Strategy**: 
  - `main` for stable releases
  - `develop` for active development
  - Feature branches for new features
  - Release branches for version preparation
- **Commit Guidelines**: Following conventional commits with structured messages

### IDE Support
- **Primary IDE**: Cursor
- **Key Features**:
  - Native TypeScript integration
  - Direct code navigation for Phaser.js APIs
  - Strong component autocompletion
  - Built-in type checking and error detection
  - Seamless Vite integration
- **Essential Extensions**:
  - ESLint integration
  - Prettier integration
  - Git integration
  - Phaser.js snippets and tools

## Asset Pipeline

### Asset Management
- **Image Processing**: 
  - TexturePacker for sprite sheets
  - ImageOptim for optimization
  - Support for multiple resolutions
- **Audio Processing**:
  - Web Audio API compatible formats
  - Howler.js for advanced audio needs
- **Asset Optimization**:
  - Automatic texture compression
  - Sprite sheet packing
  - Lazy loading for large assets
- **Format Standards**:
  - Images: PNG, WebP with PNG fallback
  - Audio: MP3, OGG
  - Tile maps: Tiled JSON format
  - Sprite sheets: JSON Hash format

## Build and Deployment

### Development Environment
- **Node.js Version**: 18.0+ LTS or 20.0+ LTS
- **Package Manager Options**:
  **npm** (v8.0+)
     - Pros: Built-in with Node.js, familiar
     - Cons: Slower than alternatives
     
- **Required Global Dependencies**:
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

### Production Build
- **Build Process**: Vite production build
- **Optimization Features**:
  - Code splitting by route/scene
  - Asset optimization:
    - Image compression (imagemin)
    - Texture atlas generation
    - Audio compression
  - Tree shaking for unused code
  - Minification options:
    1. **esbuild** (default)
       - Pros: Fastest, good enough compression
       - Cons: Less aggressive optimization
    2. **terser**
       - Pros: Better compression
       - Cons: Slower build times
  - Chunk size analysis with `rollup-plugin-visualizer`

### Deployment Options
1. **Static Hosting**:
   - **Platforms**: 
     - Vercel
     - Netlify
     - GitHub Pages
   - **Pros**: Simple, free tier available, good CDN
   - **Cons**: Limited server-side features
   
2. **Cloud Platform**:
   - **Platforms**:
     - AWS (S3 + CloudFront)
     - Google Cloud (Cloud Storage + CDN)
     - Azure (Blob Storage + CDN)
   - **Pros**: Scalable, full control
   - **Cons**: More complex, cost management needed

3. **Traditional Hosting**:
   - **Platforms**:
     - DigitalOcean
     - Linode
     - Heroku
   - **Pros**: Full control, predictable costs
   - **Cons**: More maintenance, manual scaling

**Requirements**:
- HTTPS enabled
- CDN support
- CORS configuration
- Cache control headers
- Compression (gzip/brotli)
- Asset preloading support

## Version Management

### Dependencies
- Core dependencies managed in `package.json`:
  ```json
  {
    "dependencies": {
      "phaser": "^3.60.0",
      "howler": "^2.2.3"
    },
    "devDependencies": {
      "typescript": "^5.0.0",
      "vite": "^4.0.0",
      "jest": "^29.7.0",
      "eslint": "^8.0.0",
      "prettier": "^3.0.0"
    }
  }
  ```
- Version locking strategies:
  **Exact versions** (`"phaser": "3.60.0"`)
     - Pros: Most stable, reproducible builds
     - Cons: Manual updates needed
- Update policy:
  - Security updates: Immediate
  - Major versions: Quarterly review
  - Minor versions: Monthly review
  - Patch versions: Weekly review

### Updating Guide
1. Regular dependency audits
   ```bash
   # Security audit
   npm audit
   
   # Outdated packages
   npm outdated
   ```
2. Update process
   ```bash
   # Update single package
   npm update phaser
   
   # Update all within range
   npm update
   
   # Force latest
   npm install phaser@latest
   ```
3. Testing requirements
   - Unit tests pass
   - Integration tests pass
   - Performance benchmarks within 5%
   - Visual regression tests pass
4. Rollback procedures
   - Keep package-lock.json in version control
   - Document rollback commands
   - Maintain deployment history

## Setup Guide

### Prerequisites
- Required software
- Environment setup
- Configuration files

### Development Setup
```bash
# Installation steps
npm install

# Development server
npm run dev

# Testing
npm run test

# Production build
npm run build
```

## Best Practices

### Performance
- Asset loading strategies
- Memory management
- Render optimization
- State management

### Security
- Dependency scanning
- Code security practices
- Asset security

## Future Considerations

### Planned Upgrades
- Regular updates to Phaser.js as new versions are released
- Integration of WebGL 2.0 features when available
- Performance optimizations for large worlds
- Enhanced mobile support

### Technology Evaluation Criteria
- Development efficiency for solo development
- Browser compatibility and performance
- Community support and documentation
- Integration with existing tools
- Ease of implementing RPG features

### Migration Strategies
- Maintain modular architecture for easy updates
- Use feature flags for gradual rollouts
- Keep core game logic separate from engine-specific code
- Regular evaluation of alternative technologies
- Performance monitoring and optimization

