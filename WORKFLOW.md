# Development Workflow

## Planning Phase
1. Identify feature or bug to implement/fix
2. Break down the task into smaller, manageable subtasks
3. Determine acceptance criteria
4. Create a plan of implementation

## Development Phase
1. Write tests first (Test-Driven Development)
2. Implement code to make tests pass
3. Refactor code while ensuring tests continue to pass
4. Run the helper check script to verify linting, tests, and build
5. Commit changes with descriptive commit messages

## Feature Implementation Process
1. Start a new chat session for each significant feature or bug fix
2. First, describe the feature and ask for a plan
3. Review and refine the plan
4. Implement the plan step by step, testing as you go
5. Review the implementation and make adjustments as needed

## Best Practices
- Keep code clean and organized
- Follow MVC architecture
- Adhere to TypeScript guidelines
- Limit file sizes to 300 lines
- Write comprehensive tests
- Document code when necessary (public APIs, complex logic)
- Regularly run the check script to catch issues early

## Environments
- Development: Used for active development
- Test: Used for integration testing
- Production: Used for releases

## Example Workflow

### Starting a New Feature
```
User: I need to implement a new feature that allows the player to craft items.
AI: Let me help you plan this feature...
[AI suggests a plan with steps]
User: Looks good, let's implement it.
[AI helps implement each step, writing tests first]
```

### Fixing a Bug
```
User: There's a bug where the player can walk through walls occasionally.
AI: Let me help you diagnose and fix this issue...
[AI helps analyze the bug and suggests a fix]
User: Let's implement the fix.
[AI helps implement the fix with proper tests]
``` 