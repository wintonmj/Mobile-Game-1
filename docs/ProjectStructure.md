# Project Structure

## Overview
This document defines the project structure for our browser-based RPG game. It aligns with the implementation plan defined in [Sprint 1 Implementation Plan](architecture/decisions/sprint1-implementation-plan.md) and the architectural patterns outlined in [MVP High-Level Architecture](architecture/patterns/mvp-high-level-architecture.md).

## Related Documents
- [Sprint 1 Implementation Plan](architecture/decisions/sprint1-implementation-plan.md) - Detailed implementation tasks and timeline
- [MVP High-Level Architecture](architecture/patterns/mvp-high-level-architecture.md) - Technical architecture overview
- [Service Implementation Patterns](architecture/patterns/service-implementation-patterns.md) - Service design patterns
- [Technical Stack](architecture/technical-stack.md) - Technical stack details

## Implementation Phases

### Phase 1 - Core Implementation
This is the recommended starting structure for new game projects. Start with this simplified structure and expand based on your game's needs and chosen library's patterns.

#### Core Architectural Patterns in Phase 1

1. **Service Registry Pattern**
```
src/
├── services/      # Core services and registry
│   ├── base/      # Base service interfaces and types
│   │   ├── IGameService.ts     # Core service interface
│   │   └── ServiceTypes.ts     # Service type definitions
│   ├── registry/  # Service registry implementation
│   │   ├── ServiceRegistry.ts  # Main registry implementation
│   │   ├── lifecycle.ts        # Service lifecycle management
│   │   └── dependencies.ts     # Service dependency handling
│   ├── core/      # Essential game services
│   │   ├── game/              # Game state service
│   │   │   ├── GameService.ts    # Game service implementation
│   │   │   └── GameState.ts      # Game state management
│   │   ├── input/             # Input handling service
│   │   │   ├── InputService.ts   # Input service implementation
│   │   │   └── InputMap.ts       # Input mapping configuration
│   │   ├── audio/             # Audio management service
│   │   │   ├── AudioService.ts   # Audio service implementation
│   │   │   └── SoundManager.ts   # Sound resource management
│   │   ├── save/              # Save/load functionality
│   │   │   ├── SaveService.ts    # Save service implementation
│   │   │   └── StateManager.ts   # State persistence
│   │   └── debug/             # Debugging service
│   │       ├── DebugService.ts   # Debug service implementation
│   │       └── Logger.ts         # Logging functionality
│   ├── character/          # Character system services (MVP Feature)
│   │   ├── progression/    # Level-based advancement
│   │   │   ├── LevelService.ts   # Level progression
│   │   │   └── StatsService.ts   # Character stats
│   │   └── customization/  # Appearance customization
│   │       ├── AppearanceService.ts  # Character appearance
│   │       └── CustomizationState.ts # Customization state
│   ├── world/     # World-related services
│   │   ├── time/              # Time management
│   │   │   ├── TimeService.ts    # Day/night cycle
│   │   │   └── TimeState.ts      # Time state management
│   │   ├── weather/           # Weather system
│   │   │   ├── WeatherService.ts # Weather management
│   │   │   └── WeatherState.ts   # Weather state
│   │   └── spawn/             # Entity spawning
│   │       ├── SpawnService.ts   # Entity spawning
│   │       └── SpawnState.ts     # Spawn state management
│   └── utils/     # Utility services
│       ├── logger/            # Logging utilities
│       ├── storage/           # Storage utilities
│       └── math/              # Mathematical utilities
```

2. **Event-Driven Architecture**
```
src/
├── events/       # Basic event system
│   ├── types.ts  # Event type definitions
│   └── bus.ts    # Event bus implementation
```

3. **MVC-like Pattern**
```
src/
├── scenes/        # View layer - Game scenes/levels
├── entities/      # Model layer - Game objects/sprites
│   ├── base/      # Base entity classes and interfaces
│   │   ├── Entity.ts           # Base entity class
│   │   └── IGameEntity.ts      # Core entity interface
│   ├── characters/             # Character entities
│   │   ├── base/              # Base character classes
│   │   ├── player/            # Player character implementation
│   │   │   ├── classes/       # Character class implementations
│   │   │   └── stats/         # Character statistics
│   │   └── npc/              # NPC implementations
│   ├── world/                 # World entities
│   │   ├── resources/        # Resource nodes
│   │   └── encounters/       # Combat encounters
│   └── components/            # Reusable entity components
│       ├── physics/          # Physics components
│       ├── combat/           # Combat components
│       ├── interaction/      # Interaction components
│       └── state/            # State management components
├── controllers/   # Controller layer - Game logic
```

4. **Type-Safe Architecture**
```
src/
├── types/        # TypeScript type definitions
│   ├── core/     # Core type definitions
│   │   ├── game/     # Game-specific core types
│   │   │   ├── GameState.types.ts    # Game state types
│   │   │   └── GameConfig.types.ts   # Game configuration types
│   │   ├── events/   # Event system types
│   │   │   ├── EventBus.types.ts     # Event bus types
│   │   │   └── EventPayload.types.ts # Event payload types
│   │   └── services/ # Service-related types
│   │       ├── ServiceRegistry.types.ts # Service registry types
│   │       └── ServiceConfig.types.ts   # Service configuration types
│   ├── entities/  # Entity-related types
│   │   ├── base/     # Base entity types
│   │   │   ├── Entity.types.ts       # Core entity types
│   │   │   └── Component.types.ts    # Component system types
│   │   ├── character/ # Character-related types
│   │   │   ├── Player.types.ts       # Player types
│   │   │   └── NPC.types.ts         # NPC types
│   │   └── world/    # World entity types
│   │       ├── Resource.types.ts     # Resource types
│   │       └── Encounter.types.ts    # Encounter types
│   ├── common/   # Shared utility types
│   │   ├── Math.types.ts      # Mathematical utility types
│   │   ├── Vector.types.ts    # Vector and position types
│   │   └── Utils.types.ts     # General utility types
│   ├── api/      # API and network types
│   │   ├── Requests.types.ts  # API request types
│   │   └── Response.types.ts  # API response types
│   └── config/   # Configuration types
│       ├── Assets.types.ts    # Asset configuration types
│       ├── Physics.types.ts   # Physics configuration types
│       └── Scene.types.ts     # Scene configuration types
```

#### Complete Phase 1 Structure
```
src/
├── assets/        # Static assets (images, sounds, sprites)
│   ├── images/    # Image assets
│   │   ├── backgrounds/  # Background images
│   │   ├── characters/   # Character sprites and animations
│   │   │   ├── player/  # Player character assets
│   │   │   └── npc/     # NPC character assets
│   │   ├── items/       # Item and collectible sprites
│   │   ├── tiles/       # Tile-based assets
│   │   └── ui/          # UI elements and icons
│   ├── audio/     # Sound effects and music
│   │   ├── sfx/         # Sound effects
│   │   │   ├── combat/  # Combat-related sounds
│   │   │   ├── ui/      # UI interaction sounds
│   │   │   └── ambient/ # Environmental sounds
│   │   └── music/       # Background music tracks
│   └── sprites/   # Sprite sheets and animations
│       ├── characters/  # Character animation sheets
│       ├── effects/     # Visual effects sprites
│       └── particles/   # Particle system assets
├── services/      # Core services and registry
├── events/        # Event system
├── scenes/        # Game scenes/levels (View layer)
├── entities/      # Game objects/sprites (Model layer)
│   ├── base/      # Base entity classes and interfaces
│   │   ├── Entity.ts           # Base entity class
│   │   └── IGameEntity.ts      # Core entity interface
│   ├── characters/             # Character entities
│   │   ├── base/              # Base character classes
│   │   ├── player/            # Player character implementation
│   │   │   ├── classes/       # Character class implementations
│   │   │   └── stats/         # Character statistics
│   │   └── npc/              # NPC implementations
│   ├── world/                 # World entities
│   │   ├── resources/        # Resource nodes
│   │   └── encounters/       # Combat encounters
│   └── components/            # Reusable entity components
│       ├── physics/          # Physics components
│       ├── combat/           # Combat components
│       ├── interaction/      # Interaction components
│       └── state/            # State management components
├── controllers/   # Game logic (Controller layer)
├── types/         # TypeScript type definitions
├── config/        # Game configuration files
│   ├── game/     # Core game configuration
│   │   ├── settings.config.ts     # Global game settings
│   │   ├── constants.config.ts    # Game constants
│   │   └── features.config.ts     # Feature flags and toggles
│   ├── scenes/   # Scene-specific configurations
│   │   ├── base.scene.config.ts   # Base scene configuration
│   │   └── scenes.config.ts       # Scene registry and transitions
│   ├── assets/   # Asset management configuration
│   │   ├── preload.config.ts      # Asset preloading settings
│   │   ├── lazy-load.config.ts    # Dynamic loading settings
│   │   └── cache.config.ts        # Asset caching strategy
│   ├── services/ # Service configuration
│   │   ├── registry.config.ts     # Service registry settings
│   │   └── dependencies.config.ts # Service dependencies
│   ├── physics/  # Physics engine configuration
│   │   ├── engine.config.ts       # Physics engine settings
│   │   └── collision.config.ts    # Collision detection config
│   └── env/      # Environment-specific settings
│       ├── development.config.ts  # Development environment
│       ├── production.config.ts   # Production environment
│       └── testing.config.ts      # Testing environment
└── utils/         # Helper functions

tests/             # Test files
├── unit/        # Isolated component tests
│   ├── services/    # Service unit tests
│   │   ├── core/       # Core service tests
│   │   ├── world/      # World service tests
│   │   └── utils/      # Utility service tests
│   ├── entities/    # Entity unit tests
│   │   ├── base/       # Base entity tests
│   │   ├── characters/ # Character tests
│   │   └── world/      # World entity tests
│   └── controllers/ # Controller unit tests
│       ├── game/       # Game controller tests
│       └── ui/         # UI controller tests
├── integration/   # Component interaction tests
│   ├── services/    # Service integration tests
│   ├── game/        # Game system tests
│   │   ├── combat/     # Combat system tests
│   │   ├── quests/     # Quest system tests
│   │   └── inventory/  # Inventory system tests
│   └── scenes/      # Scene transition tests
├── performance/  # Performance-focused tests
│   ├── rendering/   # Rendering performance tests
│   ├── memory/      # Memory usage tests
│   └── loading/     # Asset loading tests
├── visual/      # Visual regression tests
│   ├── ui/         # UI component tests
│   ├── scenes/     # Scene visual tests
│   └── animations/ # Animation tests
└── helpers/     # Test helpers and mocks
    ├── phaser-mock.ts     # Phaser.js mocking utilities
    ├── scene-test-bed.ts  # Scene testing utilities
    ├── factories/         # Test data factories
    │   ├── entity.factory.ts    # Entity test factories
    │   └── service.factory.ts   # Service test factories
    ├── matchers/          # Custom test matchers
    └── test-utils.ts      # General test utilities

docs/               # Project documentation
├── architecture/   # Architecture documentation
│   ├── decisions/     # Architecture decisions
│   │   └── sprint1-implementation-plan.md  # Sprint 1 implementation details
│   ├── patterns/      # Architectural patterns
│   │   └── mvp-high-level-architecture.md  # MVP architecture overview
│   └── technical-stack.md  # Technical stack details
├── design/        # Design documentation
│   ├── mvp-design.md      # MVP design specifications
│   ├── assets/           # Asset design guidelines
│   │   └── asset-guidelines.md  # Asset creation and management
│   ├── ui/              # UI/UX design docs
│   └── game-mechanics/  # Game mechanics design
├── implementation/  # Implementation guides
│   ├── game-loop.md     # Game loop implementation
│   ├── asset-management.md  # Asset management
│   ├── error-handling.md   # Error handling
│   └── development-workflow.md  # Development process
├── testing/       # Testing documentation
│   ├── jest-testing-strategy.md    # Testing strategy
│   ├── test-implementation-details.md  # Test implementation
│   └── coverage-requirements.md    # Coverage requirements
├── maintenance/   # Maintenance guides
│   ├── code-style-guide.md     # Code style guide
│   ├── troubleshooting.md      # Troubleshooting guide
│   └── performance-tuning.md   # Performance optimization
├── api/          # API documentation
│   ├── services/     # Service API docs
│   ├── events/       # Event system docs
│   └── components/   # Component API docs
└── guides/       # User guides
    ├── getting-started.md     # Getting started guide
    ├── environment-setup.md   # Environment setup
    └── contribution.md        # Contribution guidelines
```

#### Phase 1 Directory Descriptions

##### Source Code (`src/`)
- `assets/`: Organized storage for all game assets
- `services/`: Implementation of service registry pattern and core services
- `events/`: Event bus and event type definitions
- `scenes/`: Game levels and menu screens (View layer)
- `entities/`: Game objects and data models (Model layer)
- `controllers/`: Game logic and state management (Controller layer)
- `types/`: TypeScript type definitions for type safety
- `config/`: Essential game settings and configurations
- `utils/`: Helper functions and utilities

##### Supporting Directories
- `tests/`: Essential test coverage
- `docs/`: Basic documentation
- `public/`: Static assets
- `dist/`: Build output

#### When to Expand Beyond Phase 1
Consider expanding the structure when:
1. Implementing multiplayer features
2. Adding complex AI systems
3. Requiring advanced state management
4. Implementing internationalization
5. Adding advanced debugging tools
6. Need for more sophisticated service management
7. Complex event handling requirements
8. Enhanced type safety needs

### Transitioning Between Phases
When your project needs to scale beyond Phase 1, follow these guidelines for smooth transitions:

1. **Architectural Pattern Evolution**
   - **Service Registry**:
     ```
     src/services/
     ├── registry/           # Enhanced registry features
     │   ├── lifecycle.ts    # Service lifecycle management
     │   └── dependencies.ts # Dependency tracking
     ```
   - **Event System**:
     ```
     src/events/
     ├── handlers/          # Specialized event handlers
     ├── middleware/        # Event processing middleware
     └── queues/           # Event queuing system
     ```
   - **MVC Enhancement**:
     ```
     src/
     ├── views/            # Enhanced view components
     ├── models/           # Advanced data models
     └── controllers/      # Specialized controllers
     ```

2. **Type Safety Expansion**
   ```
   src/types/
   ├── services/    # Service-specific types
   ├── events/      # Enhanced event types
   ├── models/      # Model type definitions
   └── api/         # API type definitions
   ```

3. **Testing Evolution**
   - Add pattern-specific test suites
   - Implement service registry tests
   - Add event system integration tests
   - Test type safety compliance

4. **Documentation Updates**
   - Document architectural patterns
   - Update pattern implementation guides
   - Maintain pattern compatibility notes

## Full Project Structure (Reference for Future Scaling)
The following structure represents a fully scaled implementation that can be gradually adopted as your project grows:

## Testing Documentation
For detailed testing guidelines and patterns, refer to:
- [Jest Testing Strategy](testing/jest-testing-strategy.md)
- [Test Implementation Details](testing/test-implementation-details.md)
- [Coverage Requirements](testing/coverage-requirements.md)

## Service Implementation
For detailed service implementation patterns and guidelines, refer to:
- [Service Implementation Patterns](architecture/patterns/service-implementation-patterns.md)
- [Service Registry API](api/services/sprint1/service-registry-api.md)
- [Core Services API](api/services/core-services-api.md)

## Asset Management
For asset management guidelines and patterns, refer to:
- [Asset Guidelines](design/assets/asset-guidelines.md)
- [Asset Management Implementation](implementation/asset-management.md)

## Development Workflow
For development process and workflow guidelines, refer to:
- [Development Workflow](implementation/development-workflow.md)
- [Code Style Guide](maintenance/code-style-guide.md)

## State Management and Data Flow

### State Organization
- Game state should be centralized in `src/models/state/`
- Use immutable state patterns where possible
- Implement state persistence in `src/services/core/save/`

### Data Flow Guidelines
1. **State Updates**
   - Use events for state changes
   - Implement state validation
   - Log state changes in development

2. **Data Models**
   - Keep models pure and focused
   - Implement type safety
   - Use interfaces for model contracts

## Asset Management and Optimization

### Asset Organization
- Follow the structure defined in `src/assets/`
- Implement texture atlases for sprites
- Use appropriate asset formats and compression

### Optimization Guidelines
1. **Asset Loading**
   - Implement progressive loading
   - Use asset preloading for critical resources
   - Implement asset caching strategies

2. **Performance**
   - Follow guidelines in `docs/design/Optimizations.md`
   - Implement texture atlas prioritization
   - Monitor asset memory usage

## Testing Organization

### Test Structure
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`
- Performance tests in `tests/performance/`

### Testing Guidelines
1. **Test Coverage**
   - Maintain high test coverage for core functionality
   - Include performance benchmarks
   - Test edge cases and error conditions

2. **Test Organization**
   - Mirror source directory structure in test directories
   - Use consistent naming conventions
   - Include test documentation

## Maintenance and Updates

### Regular Reviews
- Review and update documentation monthly
- Validate cross-references
- Update implementation guides with new patterns

### Change Management
1. **Documentation Updates**
   - Update all affected documents when making changes
   - Include change logs
   - Maintain backward compatibility notes

2. **Version Control**
   - Keep documentation in sync with code versions
   - Tag documentation with release versions
   - Maintain changelog for documentation 