# Code Style Guide

## Overview
This document outlines the comprehensive code style guidelines for the project, covering TypeScript best practices, naming conventions, code organization, and Phaser-specific patterns. It serves as a reference for maintaining consistent, high-quality, and maintainable code throughout the codebase.

## Related Documents
- [TypeScript Standards](../architecture/patterns/typescript-standards.md)
- [MVPHighLevelArchitecture](../architecture/MVPHighLevelArchitecture.md)
- [TechnicalStack](../architecture/TechnicalStack.md)
- [Sprint1ImplementationPlan](../architecture/decisions/sprint1-implementation-plan.md)
- [DevelopmentWorkflow](../implementation/development-workflow.md)

## TypeScript Standards

### Type Safety and Definitions
1. **Strong Typing**
   - Always use explicit types for variables, parameters, and return values
   - Avoid using implicit `any` type
   - Use interfaces for complex object shapes that will be implemented/extended
   - Use type aliases for unions, intersections, and simple object types
   - Define clear return types for all functions
   - Use generic types when appropriate for reusable components
   - Export types that are used across multiple files

2. **Avoiding `any`**
   - Use `unknown` instead of `any` when type is uncertain
   - Create proper interfaces/types instead of resorting to `any`
   - Use type guards for narrowing types
   - Document thoroughly if `any` must be used (with justification)
   - Utilize TypeScript utility types (`Partial<T>`, `Readonly<T>`, `Record<K,T>`, etc.)

3. **Type Declarations and Organization**
   - Keep interface definitions focused and cohesive
   - Group related types together in dedicated type files
   - Use descriptive names that reflect the purpose
   - Add JSDoc comments for complex types
   - Consider breaking large interfaces into smaller, composable ones

## Naming Conventions

### Classes, Interfaces, Types, and Enums
- Use PascalCase for classes, interfaces, types, and enums
- Prefix interfaces with 'I' only if they're used for implementation inheritance
- Use nouns or noun phrases for entity types
- Be descriptive and specific

### Functions, Methods, Properties, and Variables
- Use camelCase for functions, methods, properties, and variables
- Use descriptive verb phrases for functions that indicate purpose
- Prefix boolean getters with 'is', 'has', 'can', etc. (e.g., `isValid`)
- Use UPPER_SNAKE_CASE for constants
- Use descriptive nouns or noun phrases for variables

### Phaser-Specific Naming
- Scene classes should end with "Scene" (e.g., `MainMenuScene`)
- Game objects should use descriptive names that indicate their purpose
- Component classes should end with "Component" when implemented as composable elements
- Service classes should end with "Service" (e.g., `AudioService`)

## Code Organization

### File and Directory Structure
- Use kebab-case for file names (e.g., `user-service.ts`)
- Group related functionality into appropriate directories
- Follow a consistent pattern for similar files
- Keep filenames consistent with their primary export
- Maximum file length: 300 lines (refactor if longer)
- Follow the structure outlined in MVPHighLevelArchitecture.md for organizing code into layers

### Function and Class Organization
- Keep functions small and focused on a single task
- Maximum function length: 30 lines (refactor if longer)
- Use arrow functions for anonymous functions and callbacks
- Prefer function parameters with default values over conditionals
- Prefer named parameters for complex function signatures
- Document complex functions with JSDoc

### Class Design
- Use access modifiers for all class members (`public`, `private`, `protected`)
- Initialize class properties either in declaration or constructor
- Use `readonly` for properties that won't change after initialization
- Use getters/setters for properties that need controlled access
- Follow single responsibility principle for classes
- Consider composition over inheritance

## Formatting Rules

### General Formatting
- Use 2 spaces for indentation
- Use single quotes for strings
- Always end statements with semicolons
- Maximum line length: 100 characters
- Use trailing commas in multi-line object and array literals
- Place opening braces on the same line as their statement
- Add space before opening parenthesis in control statements
- No space between function name and parentheses for function calls

### Comments and Documentation
- Use JSDoc comments for public APIs and complex functions
- Keep comments focused on why, not what
- Update comments when code changes
- Document complex algorithms and business logic
- Avoid commented-out code

### Import and Export Rules
- Group imports by source (external, then internal)
- Sort imports alphabetically within each group
- Use named exports rather than default exports
- Use explicit import statements rather than wildcard imports
- Avoid circular dependencies

## Architecture Patterns

### Service Registry Pattern
- Use the Service Registry pattern as defined in MVPImplementationPlanOverview.md
- Register services with the registry
- Access services through the registry
- Implement the singleton pattern for services
- Follow proper service lifecycle management (init/destroy)

### Event Bus Pattern
- Use the Event Bus pattern for communication between components
- Emit events with specific names and payloads
- Subscribe to events with appropriate handlers
- Unsubscribe from events when components are destroyed
- Use typed event payloads for better type safety

## Phaser-Specific Patterns

### Scene Management
- Implement the scene lifecycle methods correctly (init, preload, create, update)
- Use scene transitions for navigation between screens
- Manage scene dependencies appropriately
- Clean up resources when scenes are destroyed
- Use scene data for passing information between scenes

### Game Object Organization
- Create reusable components for common game objects
- Use proper inheritance for extending game objects
- Clean up game objects when no longer needed
- Use appropriate container hierarchy for related objects
- Implement proper event handling for game objects

### Asset Management
- Load assets in the preload method of scenes
- Use asset keys that clearly indicate the asset's purpose
- Group related assets in texture atlases when appropriate
- Implement progressive loading for large asset collections
- Release unused assets to manage memory usage

## Error Handling

### Null and Undefined Handling
- Use explicit null/undefined checking
- Prefer optional chaining (?.) and nullish coalescing (??)
- Use non-null assertion operator (!) only when absolutely certain
- Avoid returning undefined/null from functions when possible
- Handle potential null values early in functions

### Exception Management
- Implement proper error handling with try/catch blocks
- Create custom error types for different error categories
- Provide meaningful error messages
- Log errors appropriately
- Avoid swallowing errors without handling them

### Input Validation
- Validate function inputs at the start of functions
- Use guard clauses for early returns
- Consider using validation libraries for complex inputs
- Document validation requirements in function JSDoc
- Throw descriptive errors for invalid inputs

## Examples

### Service Implementation

```typescript
// Good example - following the service registry pattern
import { ServiceRegistry } from '../core/ServiceRegistry';

export class AudioService implements IGameService {
  private static instance: AudioService;
  private soundEffects: Map<string, Phaser.Sound.BaseSound>;
  
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  async init(): Promise<void> {
    this.soundEffects = new Map();
    // Initialize audio system
  }
  
  destroy(): void {
    // Clean up resources
    this.soundEffects.clear();
  }
  
  playSound(key: string, volume: number = 1.0): void {
    const sound = this.soundEffects.get(key);
    if (sound) {
      sound.play({ volume });
    }
  }
}

// Register with service registry
ServiceRegistry.getInstance().register('audio', AudioService.getInstance());
```

### Scene Implementation

```typescript
export class GameplayScene extends Phaser.Scene {
  private player: Player;
  private enemies: Enemy[];
  
  constructor() {
    super({ key: 'GameplayScene' });
  }
  
  init(data: { level: number }): void {
    // Initialize scene with data
    this.enemies = [];
  }
  
  preload(): void {
    // Load necessary assets
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
  }
  
  create(): void {
    // Create game objects
    this.player = new Player(this, 100, 100);
    this.createEnemies();
    
    // Set up collisions
    this.physics.add.collider(this.player, this.enemies);
  }
  
  update(time: number, delta: number): void {
    // Update game logic
    this.player.update(delta);
    this.enemies.forEach(enemy => enemy.update(delta));
  }
  
  private createEnemies(): void {
    // Implementation details
  }
}
```

## Tools and Configuration

### ESLint Configuration
We use ESLint for static code analysis with the following core rules:
- Enforce TypeScript best practices
- Prevent common errors
- Maintain consistent code style
- Detect potential problems

### Prettier Configuration
We use Prettier for code formatting with the following configuration:
- Semi: true (always use semicolons)
- Trailing Comma: es5 (use trailing commas where valid in ES5)
- Single Quote: true (use single quotes for strings)
- Print Width: 100 (maximum line length)
- Tab Width: 2 (use 2 spaces for indentation)
- End of Line: auto (maintain consistent line endings)

### TypeScript Configuration
The project uses strict TypeScript configuration with the following compiler options:
- strict: true (enable all strict type checking options)
- noImplicitAny: true (raise error on expressions and declarations with an implied 'any' type)
- strictNullChecks: true (enable strict null checks)
- strictFunctionTypes: true (enable strict checking of function types)
- strictBindCallApply: true (enable strict 'bind', 'call', and 'apply' methods on functions)
- noUnusedLocals: true (report errors on unused locals)
- noUnusedParameters: true (report errors on unused parameters)
- noImplicitReturns: true (report error when not all code paths in function return a value)
- noFallthroughCasesInSwitch: true (report errors for fallthrough cases in switch statement)

For full configuration details, refer to the tsconfig.json in the project root.

## Code Review Process
For detailed code review guidelines and PR process, refer to the [DevelopmentWorkflow](../implementation/development-workflow.md#pull-request-process) document.

## Maintenance

This document should be updated whenever:
- New coding patterns are established
- Tools or configurations change
- Best practices are updated
- Significant organizational patterns emerge

## Related Documentation
- [MVPHighLevelArchitecture](../architecture/MVPHighLevelArchitecture.md)
- [TechnicalStack](../architecture/TechnicalStack.md)
- [Sprint1ImplementationPlan](../Implementation/Sprint1ImplementationPlan.md) 