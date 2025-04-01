# Audio Service API Documentation (Planned - Post Sprint 1)

## Version Information
- **Version**: v2.0.0-planned
- **Last Updated**: 2024-03-31
- **Status**: Planned
- **Authors**: Development Team
- **Target Implementation**: Post Sprint 1

## Overview
The `AudioService` is planned to be responsible for managing all audio playback in the game, including sound effects and background music. It will provide a centralized system for controlling audio playback, volume levels, and audio state management.

## Implementation Timeline
This service is planned for implementation after Sprint 1. The current documentation serves as a design specification for future implementation.

## Related Documentation
- [Core Services API](./core-services-api.md)
- [Service Registry API](./service-registry-api.md)
- [Event Bus API](./event-bus-api.md)
- [Asset Service API](./asset-service-api.md)
- [TypeScript Standards](../standards/typescript.mdc)

## Core Interface

```typescript
import { 
  IGameService,
  IPausableService,
  ServiceError,
  ServiceThreadError,
  ServiceStateError,
  IEventBus,
  GameEventMap
} from './types';

/**
 * Service responsible for audio playback
 * @implements IGameService, IPausableService
 */
interface IAudioService extends IGameService, IPausableService {
  /**
   * Play a sound effect
   * @param key Asset key of the sound to play
   * @param config Optional configuration for sound playback
   * @returns Sound instance for further control
   * @throws AudioError if sound not found or cannot be played
   */
  playSound(key: string, config?: AudioConfig): Phaser.Sound.BaseSound;
  
  /**
   * Play background music
   * @param key Asset key of the music to play
   * @param config Optional configuration for music playback
   * @returns Music instance for further control
   * @throws AudioError if music not found or cannot be played
   */
  playMusic(key: string, config?: AudioConfig): Phaser.Sound.BaseSound;
  
  /**
   * Stop all audio or specific sound/music
   * @param key Optional asset key to stop specific sound/music
   */
  stop(key?: string): void;
  
  /**
   * Set global volume levels
   * @param type Type of audio to adjust (master, sfx, music)
   * @param level Volume level (0-1)
   */
  setVolume(type: AudioVolumeType, level: number): void;
}

/**
 * Configuration for audio playback
 */
interface AudioConfig {
  /** Volume level from 0 to 1 */
  volume?: number;
  
  /** Playback rate (1 = normal speed) */
  rate?: number;
  
  /** Whether to loop the audio */
  loop?: boolean;
  
  /** Audio panning from -1 (left) to 1 (right) */
  pan?: number;
}

type AudioVolumeType = 'master' | 'sfx' | 'music';
```

## Usage Examples

### Basic Audio Playback with Events
```typescript
class GameScene extends Phaser.Scene {
  private audioService: IAudioService;
  private eventBus: IEventBus;
  
  constructor() {
    super({ key: 'GameScene' });
    const registry = ServiceRegistry.getInstance();
    this.audioService = registry.get<IAudioService>('audio');
    this.eventBus = registry.get<IEventBus>('eventBus');
  }
  
  create(): void {
    // Subscribe to audio events
    this.eventBus.on('audio.stateChanged', (data: GameEventMap['audio.stateChanged']) => {
      console.log(`Audio state changed: ${data.state}`);
    });
    
    try {
      // Play background music
      this.audioService.playMusic('background_theme', {
        loop: true,
        volume: 0.6
      });
      
      // Emit music started event
      this.eventBus.emit('audio.music.started', {
        key: 'background_theme',
        timestamp: Date.now()
      });
    } catch (error) {
      if (error instanceof AudioPlaybackError) {
        console.error(`Failed to play music: ${error.key}`);
        this.eventBus.emit('error', error);
      }
    }
  }
  
  destroy(): void {
    // Clean up event listeners
    this.eventBus.off('audio.stateChanged', this.handleAudioStateChange);
  }
}
```

### Volume Control with Error Handling
```typescript
try {
  // Adjust volume levels
  this.audioService.setVolume('master', 0.8);
  this.audioService.setVolume('music', 0.6);
  this.audioService.setVolume('sfx', 0.7);
  
  // Emit volume changed event
  this.eventBus.emit('audio.volume.changed', {
    type: 'master',
    level: 0.8,
    timestamp: Date.now()
  });
} catch (error) {
  if (error instanceof AudioError) {
    console.error('Audio system error:', error.message);
    this.eventBus.emit('error', error);
  }
}
```

## Error Types

```typescript
/**
 * Base error class for audio-related errors
 */
class AudioError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'AudioError';
  }
}

/**
 * Error thrown when audio playback fails
 */
class AudioPlaybackError extends AudioError {
  constructor(key: string, cause?: Error) {
    super(`Failed to play audio: ${key}${cause ? ` - ${cause.message}` : ''}`);
    this.name = 'AudioPlaybackError';
    this.cause = cause;
    this.key = key;
  }
  
  cause?: Error;
  key: string;
}

/**
 * Error thrown when audio is not found
 */
class AudioNotFoundError extends AudioError {
  constructor(key: string) {
    super(`Audio not found: ${key}`);
    this.name = 'AudioNotFoundError';
    this.key = key;
  }
  
  key: string;
}
```

## Implementation Checklist
1. **Audio Management**
   - [ ] Implement efficient audio loading
   - [ ] Handle audio state changes
   - [ ] Manage audio resources properly
   - [ ] Support all required audio formats

2. **Error Handling**
   - [ ] Use standard error hierarchy
   - [ ] Handle playback failures gracefully
   - [ ] Emit error events when appropriate
   - [ ] Validate audio configurations

3. **Event Communication**
   - [ ] Emit state change events
   - [ ] Emit volume change events
   - [ ] Handle error events
   - [ ] Clean up event listeners

4. **Mobile Support**
   - [ ] Handle audio context initialization
   - [ ] Respect device silent mode
   - [ ] Manage audio focus changes
   - [ ] Implement audio pooling

## Change History
- v2.0.0 (2024-03-31)
  - Added type-safe audio configurations
  - Improved error handling
  - Added event system integration
  - Enhanced mobile support
- v1.0.0 (2024-03-01)
  - Initial implementation 