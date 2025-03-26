export enum Actions {
  // Basic movement
  IDLE = 'idle',
  WALKING = 'walking',
  MOVING = 'moving',

  // Interaction actions
  COLLECTING = 'collecting',
  CUTTING = 'cutting',
  MINING = 'mining',
  FISHING = 'fishing',
  WATERING = 'watering',
  PIERCING = 'piercing',

  // Carrying states
  CARRY_IDLE = 'carry_idle',
  CARRY_WALK = 'carry_walk',
  CARRY_RUN = 'carry_run',

  // Combat/damage states
  HIT = 'hit',
  DEATH = 'death',
}

// Define animation configuration interface
export interface AnimationConfig {
  spriteBase: string;
  animBase: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
  yoyo: boolean;
}

// Map each action to its animation configuration
export const ActionAnimations: Record<Actions, AnimationConfig> = {
  // Basic movement animations
  [Actions.IDLE]: {
    spriteBase: 'Idle_Base',
    animBase: 'idle',
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    yoyo: true,
  },
  [Actions.WALKING]: {
    spriteBase: 'Walk_Base',
    animBase: 'walk',
    frameCount: 6,
    frameRate: 8,
    repeat: -1,
    yoyo: true,
  },
  [Actions.MOVING]: {
    spriteBase: 'Run_Base',
    animBase: 'run',
    frameCount: 6,
    frameRate: 10,
    repeat: -1,
    yoyo: true,
  },

  // Interaction animations
  [Actions.COLLECTING]: {
    spriteBase: 'Collect_Base',
    animBase: 'collect',
    frameCount: 6,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },
  [Actions.CUTTING]: {
    spriteBase: 'Slice_Base',
    animBase: 'cut',
    frameCount: 6,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },
  [Actions.MINING]: {
    spriteBase: 'Crush_Base',
    animBase: 'mine',
    frameCount: 6,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },
  [Actions.FISHING]: {
    spriteBase: 'Fishing_Base',
    animBase: 'fish',
    frameCount: 6,
    frameRate: 8,
    repeat: 0,
    yoyo: false,
  },
  [Actions.WATERING]: {
    spriteBase: 'Watering_Base',
    animBase: 'water',
    frameCount: 6,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },
  [Actions.PIERCING]: {
    spriteBase: 'Pierce_Base',
    animBase: 'pierce',
    frameCount: 6,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },

  // Carrying state animations
  [Actions.CARRY_IDLE]: {
    spriteBase: 'CarryIdle_Base',
    animBase: 'carry-idle',
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    yoyo: true,
  },
  [Actions.CARRY_WALK]: {
    spriteBase: 'CarryWalk_Base',
    animBase: 'carry-walk',
    frameCount: 6,
    frameRate: 8,
    repeat: -1,
    yoyo: true,
  },
  [Actions.CARRY_RUN]: {
    spriteBase: 'CarryRun_Base',
    animBase: 'carry-run',
    frameCount: 6,
    frameRate: 10,
    repeat: -1,
    yoyo: true,
  },

  // Combat/damage animations
  [Actions.HIT]: {
    spriteBase: 'Hit_Base',
    animBase: 'hit',
    frameCount: 4,
    frameRate: 10,
    repeat: 0,
    yoyo: false,
  },
  [Actions.DEATH]: {
    spriteBase: 'Death_Base',
    animBase: 'death',
    frameCount: 6,
    frameRate: 8,
    repeat: 0,
    yoyo: false,
  },
};
