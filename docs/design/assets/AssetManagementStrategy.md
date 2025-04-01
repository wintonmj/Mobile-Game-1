# Asset Management Strategy

## Overview
This document outlines the comprehensive strategy for managing game assets in our Phaser.js browser-based RPG. It covers organization structure, loading patterns, optimization techniques, and handling of different asset types to ensure optimal performance and maintainability.

## Asset Organization Structure

### Directory Structure
```
src/assets/
├── images/
│   ├── characters/         # Character sprites and animations
│   │   ├── races/          # Race-specific base models and animations
│   │   ├── classes/        # Class-specific gear and animations
│   │   ├── armors/         # Layerable armor pieces
│   │   ├── weapons/        # Weapon models and animations
│   │   └── customization/  # Hair, face, body modifications
│   ├── ui/                 # UI elements and icons
│   ├── environment/        # Environment textures and tiles
│   │   ├── biomes/         # Biome-specific textures
│   │   ├── weather/        # Weather effect overlays
│   │   ├── time/           # Day/night lighting variations
│   │   └── procedural/     # Tilesets for procedural generation
│   ├── items/              # Item sprites
│   ├── effects/            # Visual effects
│   └── factions/           # Faction-specific assets (banners, symbols, etc.)
├── audio/
│   ├── music/              # Background music tracks
│   ├── sfx/                # Sound effects
│   └── voice/              # Voice acting/dialog
├── fonts/                  # Custom fonts
├── maps/                   # Tiled map files
│   ├── static/             # Pre-designed map sections
│   └── templates/          # Templates for procedural generation
├── data/                   # JSON data files
└── spritesheets/           # Generated spritesheets
```

### Naming Conventions
- Use kebab-case for all asset filenames
- Include dimensions in spritesheet names (e.g., `character-walking-64x64.png`)
- Use prefixes to indicate asset type when necessary (e.g., `ui-button-blue.png`)
- Version assets with suffixes when needed (e.g., `background-forest-v2.png`)

## Asset Loading Patterns

### Progressive Loading
- Implement a multi-stage loading approach:
  1. **Critical Assets**: Load before game starts (UI, basic player character)
  2. **Scene-Specific Assets**: Load when entering a new scene
  3. **Optional Assets**: Load during gameplay or idle time

### Asset Preloading
- Preload assets for the next expected scene during gameplay
- Implement a loading screen with progress indicator
- Use Phaser's built-in preloading mechanism:

```typescript
preload(): void {
  // Display loading progress
  this.createLoadingBar();
  
  // Preload assets with proper key naming
  this.load.image('player', 'assets/images/characters/player.png');
  this.load.spritesheet('player-walk', 'assets/images/characters/player-walk.png', { 
    frameWidth: 64, 
    frameHeight: 64 
  });
  this.load.audio('background-music', ['assets/audio/music/background.mp3', 'assets/audio/music/background.ogg']);
  
  // Handle loading events
  this.load.on('progress', this.updateLoadingBar, this);
  this.load.on('complete', this.onLoadComplete, this);
}
```

### Asset Registry
- Implement a centralized asset registry service to track loaded assets
- Use TypeScript interfaces to ensure type safety:

```typescript
interface AssetInfo {
  key: string;
  path: string;
  type: 'image' | 'spritesheet' | 'audio' | 'map' | 'json';
  loaded: boolean;
  metadata?: Record<string, any>;
}

class AssetRegistry {
  private assets: Map<string, AssetInfo> = new Map();
  
  register(assetInfo: AssetInfo): void {
    this.assets.set(assetInfo.key, assetInfo);
  }
  
  markLoaded(key: string): void {
    const asset = this.assets.get(key);
    if (asset) {
      asset.loaded = true;
    }
  }
  
  isLoaded(key: string): boolean {
    return this.assets.get(key)?.loaded || false;
  }
}
```

## Asset Optimization Techniques

### Texture Atlases
- Use texture atlases (spritesheets) for related images
- Generate atlases with TexturePacker
- Organize atlases by game section (UI, characters, environments)
- Balance atlas size with loading efficiency

### Image Optimization
- Use appropriate formats:
  - PNG for graphics requiring transparency
  - WebP with PNG fallback for better compression
  - JPEG for photographic textures without transparency
- Optimize all images before inclusion:
  - Compress PNGs with tools like ImageOptim
  - Use appropriate dimensions based on display size
  - Implement multiple resolutions for responsive design

### Audio Optimization
- Use appropriate formats:
  - MP3 as primary format (good compression, wide support)
  - OGG as alternative for better quality/size ratio
- Optimize audio files:
  - Use appropriate bitrates (128kbps for music, 96kbps for effects)
  - Convert stereo to mono for positional audio
  - Trim silence from beginning/end of audio files

### Memory Management
- Implement asset unloading for unused scenes
- Cache commonly used assets
- Monitor memory usage and implement cleanup strategies

## Handling Different Asset Types

### Sprites and Images
- Standard images for static elements
- Spritesheets for animations with proper frame definitions
- Atlas for related UI elements
- Support for retina/high-DPI displays

### Audio Assets
- Implement audio pooling for frequently used sound effects
- Use spatial audio for positional sound effects
- Implement audio categories (music, sfx, ambient, voice) with separate volume controls

### Font Assets
- Use Web Fonts when possible
- Include fallback fonts
- Preload custom fonts to avoid FOIT (Flash of Invisible Text)

### Map Assets
- Use Tiled JSON format for map data
- Split large maps into chunks for lazy loading
- Implement map caching for revisited areas

### JSON Data
- Minimize size through compression
- Validate against schemas
- Version data files to handle updates

### Character Customization Assets
- Implement a modular character rendering system:
  - Base character models by race
  - Separate layerable equipment slots (head, chest, legs, feet, hands)
  - Class-specific animation sets
  - Customization options (hair, skin, facial features)

```typescript
// Example character assembly system
class CharacterRenderer {
  private baseSprite: Phaser.GameObjects.Sprite;
  private equipmentLayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  
  constructor(scene: Phaser.Scene, race: string, x: number, y: number) {
    // Load base character model by race
    this.baseSprite = scene.add.sprite(x, y, `character-${race}-base`);
    
    // Initialize empty equipment slots
    const slots = ['head', 'chest', 'legs', 'feet', 'hands', 'weapon'];
    slots.forEach(slot => {
      const sprite = scene.add.sprite(x, y, 'empty');
      sprite.setVisible(false);
      this.equipmentLayers.set(slot, sprite);
    });
  }
  
  equipItem(slot: string, itemKey: string): void {
    const layer = this.equipmentLayers.get(slot);
    if (layer) {
      layer.setTexture(itemKey);
      layer.setVisible(true);
    }
  }
  
  applyCustomization(feature: string, option: string): void {
    // Apply customization like hair style, skin color, etc.
    // This could involve texture swaps or shader effects
  }
  
  playAnimation(animKey: string): void {
    // Play animation on base and sync with all equipment layers
    this.baseSprite.play(`${this.baseSprite.texture.key}-${animKey}`);
    this.equipmentLayers.forEach(layer => {
      if (layer.visible) {
        layer.play(`${layer.texture.key}-${animKey}`);
      }
    });
  }
}
```

### Procedural Content Assets
- Implement a template-based approach for procedural dungeons and world content:
  - Tileset organization by dungeon/area theme
  - Modular room templates with connection points
  - Decoration asset pools by theme and rarity
  - Procedural rule definitions in JSON format

```typescript
// Example procedural dungeon generation asset loading
class DungeonAssetLoader {
  private static themeAssets: Map<string, ThemeAssetPool> = new Map();
  
  static preloadThemeAssets(scene: Phaser.Scene, theme: string): void {
    // Load tileset for the theme
    scene.load.image(`dungeon-${theme}-tileset`, `assets/images/environment/procedural/${theme}-tileset.png`);
    
    // Load room templates
    scene.load.json(`${theme}-templates`, `assets/maps/templates/${theme}-rooms.json`);
    
    // Load decoration asset pools
    scene.load.atlas(`${theme}-decorations`, 
      `assets/images/environment/procedural/${theme}-decorations.png`,
      `assets/images/environment/procedural/${theme}-decorations.json`);
      
    // Load generation rules
    scene.load.json(`${theme}-rules`, `assets/data/procedural/${theme}-generation-rules.json`);
  }
  
  static getAssetPool(theme: string, difficulty: number): ThemeAssetPool {
    if (!this.themeAssets.has(theme)) {
      // Initialize and build asset pool based on theme and difficulty
      const pool = new ThemeAssetPool(theme, difficulty);
      this.themeAssets.set(theme, pool);
    }
    return this.themeAssets.get(theme);
  }
}

interface ThemeAssetPool {
  getTilesets(): string[];
  getRoomTemplate(roomType: string): any;
  getRandomDecoration(category: string, rarity: number): string;
  getEnemyPool(): string[];
}
```

### Weather and Day/Night Systems
- Implement efficient asset handling for dynamic environmental systems:
  - Time-based texture swapping for day/night transitions
  - Layered weather effect sprites (rain, snow, fog)
  - Global shader effects for lighting changes
  - Environment sound management for weather conditions

```typescript
// Example implementation of day/night and weather system
class EnvironmentManager {
  private scene: Phaser.Scene;
  private timeOfDay: number = 0; // 0-1 representing full day cycle
  private currentWeather: string = 'clear';
  private weatherEffects: Phaser.GameObjects.Container;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.weatherEffects = scene.add.container(0, 0);
    
    // Preload all environment variants
    this.preloadTimeAssets();
    this.preloadWeatherAssets();
  }
  
  private preloadTimeAssets(): void {
    // Load lighting overlays for different times
    ['dawn', 'day', 'dusk', 'night'].forEach(time => {
      this.scene.load.image(`lighting-${time}`, `assets/images/environment/time/${time}-overlay.png`);
    });
  }
  
  private preloadWeatherAssets(): void {
    // Load weather effect sprites
    ['rain', 'snow', 'fog', 'storm'].forEach(weather => {
      this.scene.load.image(`weather-${weather}`, `assets/images/environment/weather/${weather}.png`);
      this.scene.load.audio(`weather-${weather}-sound`, `assets/audio/sfx/weather-${weather}.mp3`);
    });
  }
  
  updateTimeOfDay(newTime: number): void {
    this.timeOfDay = newTime;
    
    // Apply appropriate lighting overlay
    let lightingKey: string;
    if (newTime < 0.25) lightingKey = 'dawn';
    else if (newTime < 0.5) lightingKey = 'day';
    else if (newTime < 0.75) lightingKey = 'dusk';
    else lightingKey = 'night';
    
    // Apply lighting shader or overlay
    this.applyLightingEffect(lightingKey);
    
    // Update environment sounds based on time
    this.updateAmbientSounds();
  }
  
  setWeather(weather: string): void {
    this.currentWeather = weather;
    
    // Clear previous weather effects
    this.weatherEffects.removeAll();
    
    // Add new weather effect sprites
    if (weather !== 'clear') {
      const effect = this.scene.add.sprite(0, 0, `weather-${weather}`);
      effect.setOrigin(0, 0);
      effect.setDisplaySize(this.scene.sys.game.canvas.width, this.scene.sys.game.canvas.height);
      this.weatherEffects.add(effect);
      
      // Play weather sound
      this.scene.sound.play(`weather-${weather}-sound`, { loop: true });
    }
  }
  
  private applyLightingEffect(timeKey: string): void {
    // Apply lighting shader or overlay based on time of day
  }
  
  private updateAmbientSounds(): void {
    // Update ambient sound mix based on time of day
  }
}
```

### Faction-Specific Assets
- Implement a comprehensive faction asset system:
  - Unique visual identity for each faction
  - Faction-specific NPC variants
  - Equipment and architecture sets by faction
  - Organized directory structure for faction assets

```typescript
// Example faction asset management
class FactionAssetManager {
  private static factionData: Map<string, FactionAssetInfo> = new Map();
  
  static preloadFactionAssets(scene: Phaser.Scene, factionId: string): void {
    // Load faction emblems and UI elements
    scene.load.image(`faction-${factionId}-emblem`, `assets/images/factions/${factionId}/emblem.png`);
    scene.load.image(`faction-${factionId}-banner`, `assets/images/factions/${factionId}/banner.png`);
    
    // Load faction-specific NPC variants
    scene.load.spritesheet(`faction-${factionId}-guards`, 
      `assets/images/factions/${factionId}/guards.png`,
      { frameWidth: 64, frameHeight: 64 });
      
    // Load faction architecture set
    scene.load.image(`faction-${factionId}-buildings`, 
      `assets/images/factions/${factionId}/buildings.png`);
      
    // Load faction data
    scene.load.json(`faction-${factionId}-data`, 
      `assets/data/factions/${factionId}.json`);
  }
  
  static getFactionAssetInfo(factionId: string): FactionAssetInfo {
    if (!this.factionData.has(factionId)) {
      // Load faction data from cache
      const scene = Phaser.Scene.getActiveScene();
      const data = scene.cache.json.get(`faction-${factionId}-data`);
      this.factionData.set(factionId, {
        colors: data.colors,
        emblems: data.emblems,
        equipmentSets: data.equipmentSets,
        architectureSet: data.architectureSet
      });
    }
    return this.factionData.get(factionId);
  }
  
  static applyFactionAppearance(target: any, factionId: string): void {
    // Apply faction colors, emblems, etc. to the target object
    const factionInfo = this.getFactionAssetInfo(factionId);
    
    // Apply different logic based on target type (NPC, building, item)
    if (target.type === 'npc') {
      // Apply faction uniform to NPC
    } else if (target.type === 'building') {
      // Apply faction architecture style
    } else if (target.type === 'item') {
      // Apply faction emblems to item
    }
  }
}

interface FactionAssetInfo {
  colors: {primary: string, secondary: string, tertiary: string};
  emblems: string[];
  equipmentSets: Record<string, string[]>;
  architectureSet: string;
}

## Implementation Guidelines

### Asset Loading Service
- Create a dedicated service for asset loading and management
- Implement retry mechanisms for failed loads
- Track loading status and errors

### Asset Usage Patterns
- Access assets through the central registry
- Implement proper error handling for missing assets
- Use type-safe accessors:

```typescript
// Example of type-safe asset access
function getSprite(key: string): Phaser.GameObjects.Sprite | null {
  if (!this.assetRegistry.isLoaded(key)) {
    console.warn(`Attempted to access unloaded sprite: ${key}`);
    return null;
  }
  return this.add.sprite(0, 0, key);
}
```

## Monitoring and Performance

### Performance Metrics
- Track asset loading times
- Monitor memory usage
- Measure frame rate impact during asset loading

### Performance Budgets
- Establish size limits for different asset types
- Set maximum sizes for individual scenes
- Define loading time targets for different connection speeds

## Conclusion
This asset management strategy provides a comprehensive approach to organizing, loading, and optimizing game assets. By following these guidelines, we can ensure efficient asset usage, improved performance, and a better player experience. 