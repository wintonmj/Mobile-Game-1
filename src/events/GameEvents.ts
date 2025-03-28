/**
 * GameEvents.ts
 * Centralized catalog of all events used throughout the game.
 * 
 * This file defines all events as string constants, organized by category.
 * Use these constants for all event emissions and subscriptions to ensure
 * consistency and avoid typos.
 */

// Event data type definitions
// These interfaces define the expected data structure for different events

/**
 * Data for player movement events
 */
export interface PlayerMovedEventData {
  x: number;       // World X position
  y: number;       // World Y position
  tileX: number;   // Tile X coordinate
  tileY: number;   // Tile Y coordinate
}

/**
 * Data for player action events
 */
export interface PlayerActionEventData {
  action: string;
  isInterruptible: boolean;
}

/**
 * Data for direction change events
 */
export interface DirectionChangedEventData {
  direction: string;
}

/**
 * Data for game initialization events
 */
export interface GameInitializedEventData {
  playerPosition: { x: number; y: number };
  dungeonSize?: { width: number; height: number };
}

/**
 * Data for game update events
 */
export interface GameUpdatedEventData {
  deltaTime: number;
}

/**
 * Data for player collision events
 */
export interface PlayerCollisionEventData {
  direction: string;
  position: { x: number; y: number };
  tileX: number;
  tileY: number;
}

/**
 * Data for enemy spawn events
 */
export interface EnemySpawnedEventData {
  id: string;
  type: string;
  position: { x: number; y: number };
}

/**
 * Data for enemy damage events
 */
export interface EnemyDamagedEventData {
  id: string;
  damage: number;
  currentHealth: number;
  maxHealth: number;
}

/**
 * Data for item events
 */
export interface ItemEventData {
  id: string;
  type: string;
  position?: { x: number; y: number };
}

/**
 * Data for dialog events
 */
export interface DialogEventData {
  id: string;
  speakerName?: string;
  text: string;
  options?: Array<{ id: string; text: string }>;
}

/**
 * Data for notification events
 */
export interface NotificationEventData {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

/**
 * Data for audio events
 */
export interface AudioEventData {
  trackId: string;
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

/**
 * Data for camera events
 */
export interface CameraEventData {
  target?: { x: number; y: number } | { id: string };
  zoom?: number;
  duration?: number;
  easing?: string;
}

// Player related events
export const PLAYER_EVENTS = {
  // Movement & Position
  MOVED: 'player.moved',
  POSITION_CHANGED: 'player.position.changed',
  TELEPORTED: 'player.teleported',
  
  // Actions
  ACTION_CHANGED: 'player.action.changed',
  ACTION_STARTED: 'player.action.started',
  ACTION_COMPLETED: 'player.action.completed',
  ACTION_CANCELLED: 'player.action.cancelled',
  
  // Direction
  DIRECTION_CHANGED: 'player.direction.changed',
  
  // Collisions
  COLLISION: 'player.collision',
  
  // Status
  HEALTH_CHANGED: 'player.health.changed',
  ENERGY_CHANGED: 'player.energy.changed',
  INVENTORY_CHANGED: 'player.inventory.changed',
  LEVEL_UP: 'player.level.up',
  DIED: 'player.died',
  RESPAWNED: 'player.respawned'
};

// Game state events
export const GAME_EVENTS = {
  // Lifecycle
  INITIALIZED: 'game.initialized',
  UPDATED: 'game.updated',
  PAUSED: 'game.paused',
  RESUMED: 'game.resumed',
  
  // Levels
  LEVEL_LOADED: 'game.level.loaded',
  LEVEL_COMPLETED: 'game.level.completed',
  LEVEL_FAILED: 'game.level.failed',
  
  // Time
  DAY_STARTED: 'game.day.started',
  NIGHT_STARTED: 'game.night.started',
  TIME_CHANGED: 'game.time.changed',
  WEATHER_CHANGED: 'game.weather.changed'
};

// Input events
export const INPUT_EVENTS = {
  KEY_PRESSED: 'input.key.pressed',
  KEY_RELEASED: 'input.key.released',
  TOUCH_START: 'input.touch.start',
  TOUCH_END: 'input.touch.end',
  SWIPE: 'input.swipe',
  PINCH: 'input.pinch'
};

// UI events
export const UI_EVENTS = {
  MENU_OPENED: 'ui.menu.opened',
  MENU_CLOSED: 'ui.menu.closed',
  DIALOG_STARTED: 'ui.dialog.started',
  DIALOG_ENDED: 'ui.dialog.ended',
  NOTIFICATION_SHOWN: 'ui.notification.shown',
  NOTIFICATION_HIDDEN: 'ui.notification.hidden'
};

// Enemy events
export const ENEMY_EVENTS = {
  SPAWNED: 'enemy.spawned',
  DAMAGED: 'enemy.damaged',
  DIED: 'enemy.died',
  DETECTED_PLAYER: 'enemy.detected.player',
  LOST_PLAYER: 'enemy.lost.player',
  STATE_CHANGED: 'enemy.state.changed'
};

// Item events
export const ITEM_EVENTS = {
  DROPPED: 'item.dropped',
  PICKED_UP: 'item.picked.up',
  USED: 'item.used',
  EQUIPPED: 'item.equipped',
  UNEQUIPPED: 'item.unequipped',
  DESTROYED: 'item.destroyed'
};

// Achievement events
export const ACHIEVEMENT_EVENTS = {
  UNLOCKED: 'achievement.unlocked',
  PROGRESS_UPDATED: 'achievement.progress.updated'
};

// Audio events
export const AUDIO_EVENTS = {
  MUSIC_STARTED: 'audio.music.started',
  MUSIC_STOPPED: 'audio.music.stopped',
  MUSIC_VOLUME_CHANGED: 'audio.music.volume.changed',
  SFX_PLAYED: 'audio.sfx.played',
  SFX_VOLUME_CHANGED: 'audio.sfx.volume.changed'
};

// Camera events
export const CAMERA_EVENTS = {
  MOVED: 'camera.moved',
  ZOOMED: 'camera.zoomed',
  SHAKE_STARTED: 'camera.shake.started',
  SHAKE_STOPPED: 'camera.shake.stopped',
  FOLLOW_STARTED: 'camera.follow.started',
  FOLLOW_STOPPED: 'camera.follow.stopped'
};

// Network events
export const NETWORK_EVENTS = {
  CONNECTED: 'network.connected',
  DISCONNECTED: 'network.disconnected',
  DATA_RECEIVED: 'network.data.received',
  DATA_SENT: 'network.data.sent',
  ERROR: 'network.error'
};

// All events combined (for easier importing)
export const GameEvents = {
  PLAYER: PLAYER_EVENTS,
  GAME: GAME_EVENTS,
  INPUT: INPUT_EVENTS,
  UI: UI_EVENTS,
  ENEMY: ENEMY_EVENTS,
  ITEM: ITEM_EVENTS,
  ACHIEVEMENT: ACHIEVEMENT_EVENTS,
  AUDIO: AUDIO_EVENTS,
  CAMERA: CAMERA_EVENTS,
  NETWORK: NETWORK_EVENTS
};

export default GameEvents; 