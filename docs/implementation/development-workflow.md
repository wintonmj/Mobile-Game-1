# Development Workflow Guide

## Overview
This document outlines the complete development workflow for the Phaser RPG project, including Git processes, Continuous Integration/Continuous Deployment (CI/CD) pipeline, and deployment strategies. It serves as a comprehensive guide for all developers contributing to the project.

## Related Documents
- [sprint1-implementation-plan.md](mdc:docs/architecture/decisions/sprint1-implementation-plan.md) - Implementation tasks and technical decisions for Sprint 1
- [mvp-high-level-architecture.md](mdc:docs/architecture/patterns/mvp-high-level-architecture.md) - Technical architecture and system design
- [TechnicalStack.md](mdc:docs/architecture/TechnicalStack.md) - Technical stack implementation details

## Git Workflow

### GitFlow Model
The project follows the GitFlow branching model to manage the codebase effectively:

1. **Main Branches**
   - `main`: Production-ready code only, always in a deployable state
   - `develop`: Integration branch for features, contains latest development changes

2. **Support Branches**
   - `feature/*`: For new features, branched from and merged back to `develop`
   - `bugfix/*`: For bug fixes in development, branched from and merged to `develop`
   - `release/*`: For release preparation, branched from `develop` and merged to both `develop` and `main`
   - `hotfix/*`: For critical production fixes, branched from `main` and merged to both `develop` and `main`

3. **Branch Naming Convention**
   - `feature/JIRA-ID-short-description` (e.g., `feature/GAME-123-player-movement`)
   - `bugfix/JIRA-ID-short-description` (e.g., `bugfix/GAME-456-collision-detection`)
   - `release/vX.Y.Z` (e.g., `release/v1.2.0`)
   - `hotfix/vX.Y.Z-short-description` (e.g., `hotfix/v1.2.1-login-issue`)

### Git Commit Standards

1. **Commit Message Format**
   ```
   type(scope): short description

   [optional longer description]

   [optional JIRA reference]
   ```

2. **Types**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style/formatting changes (no code change)
   - `refactor`: Code refactoring (no behavior change)
   - `perf`: Performance improvements
   - `test`: Adding/modifying tests
   - `chore`: Build process or auxiliary tool changes

3. **Example Commit Messages**
   ```
   feat(player): add movement animation system
   
   Implemented sprite-based animation system for player character
   that handles idle, walking, and running states.
   
   GAME-123
   ```

   ```
   fix(collision): resolve player clipping through walls
   
   GAME-456
   ```

### Pull Request Process

1. **Creation**
   - Create PR from feature branch to `develop` (for features/bugfixes)
   - Create PR from hotfix branch to both `main` and `develop` (for hotfixes)
   - Include JIRA ID in PR title
   - Fill out PR template with description, changes, and testing details

2. **Review Requirements**
   - At least two approvals required
   - All automated checks must pass
   - No unresolved comments

3. **Merging Strategy**
   - Squash and merge for feature branches
   - Create merge commit for release and hotfix branches

## Continuous Integration/Continuous Deployment (CI/CD)

### CI Pipeline

The CI pipeline automatically runs on every pull request and push to main branches:

1. **Setup and Installation**
   - Checkout code
   - Set up Node.js environment
   - Install dependencies

2. **Code Quality Checks**
   - TypeScript type checking
   - ESLint for static code analysis
   - Prettier for code formatting
   - Custom rules validation

3. **Test Suite Execution**
   - Unit tests
   - Integration tests
   - Performance tests (on scheduled runs)

4. **Build Process**
   - Create production build
   - Asset optimization
   - Bundle size analysis
   - Generate deployment artifacts

5. **Failure Handling**
   - Automated notifications via Slack/Email
   - Detailed error reporting in PR comments
   - Build logs retention

### CD Pipeline

The deployment pipeline varies based on the target environment:

1. **Development Environment**
   - Automatic deployment on each merge to `develop`
   - Quick build with minimal optimization
   - Feature flags enabled for testing
   - Debug tools and logging enabled

2. **Staging Environment**
   - Automatic deployment on each merge to `release/*`
   - Production-like build with optimization
   - Subset of feature flags enabled
   - Reduced debug information

3. **Production Environment**
   - Manual approval required after successful staging deployment
   - Fully optimized production build
   - No development feature flags
   - Minimal debug information

### Deployment Strategy for Browser-Based Game

1. **Static Asset Hosting**
   - AWS S3 for static files
   - CloudFront CDN for global distribution
   - Cache control settings for optimal performance

2. **Progressive Loading**
   - Initial minimal game shell for fast loading
   - Progressive asset loading during gameplay
   - Background loading for upcoming game sections
   - Preloading critical assets during transitions

3. **Browser Storage Optimization**
   - IndexedDB for large game state
   - LocalStorage for critical user preferences
   - Memory management for long gameplay sessions
   - Clear strategy for clearing unused assets

4. **Versioning and Updates**
   - Semantic versioning for game releases
   - Cache busting using content hashing
   - Service worker for offline capabilities
   - Update notification system for players

5. **Rollback Capability**
   - Blue/Green deployment approach
   - Automatic rollback on critical errors
   - Phased rollout for major updates
   - Feature flags for controlled release

## Development Cycle

### Sprint Structure

The development follows a two-week sprint cycle:

1. **Sprint Planning (Day 1)**
   - Review backlog and prioritize issues
   - Assign story points and tasks
   - Set sprint goals and deliverables

2. **Daily Standups**
   - Brief status updates
   - Blockers discussion
   - Adjustment of daily goals

3. **Mid-Sprint Review (Day 5)**
   - Progress assessment
   - Scope adjustment if necessary
   - Technical debt evaluation

4. **Sprint Review (Final Day)**
   - Demo of completed features
   - Feedback collection
   - Acceptance criteria verification

5. **Sprint Retrospective**
   - Review what went well
   - Identify improvement areas
   - Action items for next sprint

### Task Management Workflow

1. **Task States**
   - Backlog
   - Ready for Development
   - In Progress
   - Code Review
   - QA Testing
   - Done

2. **Definition of Ready**
   - Clear acceptance criteria
   - Technical requirements documented
   - Dependencies identified
   - Design assets available (if applicable)
   - Story points estimated

3. **Definition of Done**
   - Code implemented and tested
   - Pull request approved and merged
   - Documentation updated
   - Acceptance criteria met
   - No new bugs introduced
   - Deployed to development environment

## Troubleshooting Common Issues

### Git Issues

1. **Merge Conflicts**
   - Pull latest from target branch before starting work
   - Resolve conflicts locally before pushing
   - For complex conflicts, collaborate with code owners

2. **Accidental Commits to Wrong Branch**
   - Use `git stash` to save changes
   - Switch to correct branch
   - Apply stashed changes with `git stash pop`

3. **Large Binary Files**
   - Avoid committing large binary files directly
   - Use Git LFS for necessary large assets
   - Consider external asset management for game resources

### Pipeline Issues

1. **Failed CI Checks**
   - Check console output for specific errors
   - Run tests locally before pushing
   - Verify linting rules compliance

2. **Deployment Failures**
   - Check for environment variables
   - Verify build produces valid artifacts
   - Check for external service dependencies

3. **Performance Degradation**
   - Review bundle size changes
   - Check for unoptimized assets
   - Profile JavaScript execution

## Best Practices

1. **Code Quality**
   - Follow the TypeScript standards in the project
   - Write tests for all new features
   - Maintain consistent code style
   - Use consistent architectural patterns

2. **Communication**
   - Update JIRA tickets with progress
   - Document architectural decisions
   - Communicate blocking issues early
   - Share knowledge and solutions

3. **Performance**
   - Monitor bundle sizes
   - Optimize asset loading
   - Use performance profiling tools
   - Consider mobile constraints

## Additional Resources

- [Environment Setup Guide](./environment-setup.md)
- [TypeScript Standards](../architecture/patterns/typescript-standards.md)
- [Testing Strategy](./testing/testing-strategy.md)
- [Game Architecture Overview](../architecture/MVPHighLevelArchitecture.md)

## Support

If you encounter any issues with the development workflow, contact the technical lead or create an issue in the JIRA project. 