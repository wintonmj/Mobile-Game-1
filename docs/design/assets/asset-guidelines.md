# Asset Guidelines

## Overview
This document provides comprehensive guidelines for managing game assets, including standards for organization, naming conventions, and optimization requirements. These guidelines are implemented as detailed in [Asset Management Implementation](../../implementation/asset-management.md).

## Asset Organization

### Directory Structure
```
assets/
├── sprites/
│   ├── characters/    # Character sprites and animations
│   ├── environment/   # World and level assets
│   └── ui/           # User interface elements
├── audio/
│   ├── music/        # Background music tracks
│   └── sfx/          # Sound effects
├── fonts/            # Game fonts and typography
├── shaders/          # Custom shader effects
└── textures/
    ├── backgrounds/  # Level backgrounds
    └── particles/    # Particle system textures
```

### Naming Conventions
- Use lowercase letters and hyphens
- Include asset type prefix:
  - `spr-` for sprites
  - `sfx-` for sound effects
  - `bg-` for backgrounds
  - `ui-` for interface elements
- Include size/resolution suffix when applicable
- Examples:
  - `spr-player-idle-32x32.png`
  - `sfx-jump-stereo.mp3`
  - `bg-level1-hd.jpg`
  - `ui-button-default-64x32.png`

## Asset Types and Requirements

### Sprite Requirements
- Format: PNG with transparency
- Maximum size: 2048x2048 pixels
- Optimize for texture atlases
- Include sprite sheets for animations
- Maintain consistent pixel density
- Implementation details: See [Asset Management - Sprite Loading](../../implementation/asset-management.md#preloading-implementation)

### Audio Requirements
- Background music: 
  - Format: MP3 (128kbps)
  - Maximum size: 3MB per track
  - Implementation: See [Asset Management - Audio Loading](../../implementation/asset-management.md#dynamic-loading-patterns)
- Sound effects:
  - Format: MP3 or OGG
  - Maximum size: 200KB per effect
  - Sample rate: 44.1kHz
  - Implementation: Use audio sprite pooling as detailed in implementation guide

### Font Requirements
- Provide both TTF and WOFF2 formats
- Include fallback system fonts
- Maximum file size: 250KB per font
- Support multiple weights when needed
- Implementation: Follow font loading patterns in asset management guide

### Texture Requirements
- Use power-of-two dimensions
- Format: PNG or JPEG (based on needs)
- Maximum resolution: 4096x4096
- Support multiple resolutions
- Include mipmaps when necessary
- Implementation: See texture management in asset implementation guide

## Optimization Guidelines

### Image Optimization
- Compress all images appropriately
- Remove unnecessary metadata
- Use texture atlases for related sprites
- Implement sprite sheets for animations
- Consider WebP format for modern browsers
- Implementation: Follow optimization patterns in asset management guide

### Audio Optimization
- Balance quality vs file size
- Use appropriate compression levels
- Consider streaming for large audio files
- Implement audio sprites for small SFX
- Support progressive loading
- Implementation: See audio management section in implementation guide

### Memory Management
- Group related assets in atlases
- Implement asset unloading strategies
- Use appropriate compression formats
- Consider memory constraints
- Plan for different device capabilities
- Implementation: See [Asset Management - Memory Management](../../implementation/asset-management.md#memory-management-approach)

## Asset Loading Strategies

### Preloading Requirements
- Define essential assets for preload
- Group assets by loading priority
- Implement progress tracking
- Handle loading errors gracefully
- Support background loading
- Implementation: Follow preloader implementation in asset management guide

### Dynamic Loading
- Implement lazy loading patterns
- Load assets based on game state
- Support asynchronous loading
- Handle loading dependencies
- Manage loading queues
- Implementation: See dynamic loading patterns in asset management guide

## Version Control Guidelines

### Asset Versioning
- Use semantic versioning
- Track asset dependencies
- Implement hash-based caching
- Support atomic updates
- Handle version conflicts
- Implementation: Follow versioning system in asset management guide

### Source Control
- Store source files separately
- Use LFS for large assets
- Maintain asset history
- Document asset changes
- Include asset metadata
- Implementation: See version tracking approach in implementation guide

## Quality Assurance

### Testing Requirements
- Verify asset loading
- Check rendering quality
- Test audio playback
- Validate optimization levels
- Ensure cross-platform compatibility
- Implementation: Follow testing patterns in asset management guide

### Performance Metrics
- Loading time targets: < 2s for essential assets
- Memory usage limits: < 100MB for active assets
- Rendering performance goals: 60 FPS
- Audio latency requirements: < 100ms
- Storage size constraints: < 50MB total
- Implementation: See performance monitoring integration in asset management guide

## Related Documentation
- [Asset Management Implementation](../../implementation/asset-management.md) - Detailed implementation of these guidelines
- [Sprint 1 Implementation Plan](../../architecture/decisions/sprint1-implementation-plan.md) - Implementation timeline and technical decisions
- [Technical Stack](../../architecture/technical-stack.md) - Technology stack details
- [Performance Monitoring](../../implementation/performance-monitoring.md) - Performance tracking implementation 