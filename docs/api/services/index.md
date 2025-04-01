# Game Services API Documentation

## Overview
This section provides comprehensive documentation for all game services in the architecture. Services are organized by implementation status, with active services in the Sprint 1 directory and planned services in their own directory.

## Directory Structure

```
services/
├── sprint1/          # Core services implemented in Sprint 1
├── planned/          # Future services (post Sprint 1)
├── types.ts          # Shared type definitions
└── core-services-api.md  # Core service architecture docs
```

## Active Services (Sprint 1)
See [Sprint 1 Services](sprint1/index.md) for documentation on currently implemented services:

- Service Registry - Central service management
- Event Bus - Event management system
- Scene Service - Scene lifecycle management
- Storage Service - Data persistence
- Configuration Service - Game configuration

## Planned Services
See [Planned Services](planned/index.md) for documentation on future services:

- Asset Service - Resource management
- Audio Service - Sound and music
- Input Service - User input handling
- UI Service - Interface components
- Game State Service - Core game state
- Physics Service - Game physics
- AI Service - NPC behavior

## Core Documentation
- [Core Services API](core-services-api.md) - Core service architecture and patterns
- [Types](types.ts) - Shared TypeScript type definitions

## Implementation Guidelines
All services in the game architecture must:

1. Implement the appropriate service interfaces
2. Follow the singleton pattern
3. Register with the ServiceRegistry
4. Properly handle initialization and cleanup
5. Follow error handling patterns defined in [Game Service Interfaces](sprint1/service-registry-api.md)

## Version Information
- **Version**: v2.0.0
- **Last Updated**: 2024-03-31
- **Status**: Active
- **Authors**: Development Team 