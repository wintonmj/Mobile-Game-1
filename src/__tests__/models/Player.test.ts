import { Player, Direction } from '../../models/Player';
import { Actions } from '../../models/Actions';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player();
    player.setPosition(100, 100);
  });

  it('should initialize with default properties', () => {
    const position = player.getPosition();
    expect(position.x).toBe(100);
    expect(position.y).toBe(100);
    expect(player.getDirection()).toBe('down');
    expect(player.getCurrentAction()).toBe(Actions.IDLE);
  });

  it('should update position correctly', () => {
    player.setPosition(150, 200);
    const position = player.getPosition();
    expect(position.x).toBe(150);
    expect(position.y).toBe(200);
  });

  it('should update direction correctly', () => {
    player.setDirection('left' as Direction);
    expect(player.getDirection()).toBe('left');
  });

  it('should toggle walking mode correctly', () => {
    const initialSpeed = player.getSpeed();
    player.toggleWalking();
    expect(player.isWalkingMode()).toBe(true);
    expect(player.getSpeed()).toBeLessThan(initialSpeed);

    player.toggleWalking();
    expect(player.isWalkingMode()).toBe(false);
    expect(player.getSpeed()).toBe(initialSpeed);
  });

  it('should set actions correctly', () => {
    player.setAction(Actions.MOVING);
    expect(player.getCurrentAction()).toBe(Actions.MOVING);
  });

  it('should get player status', () => {
    const status = player.getStatus();
    expect(status.position.x).toBe(100);
    expect(status.position.y).toBe(100);
    expect(status.direction).toBe('down');
    expect(status.action).toBe(Actions.IDLE);
  });

  it('should toggle carrying state correctly', () => {
    // Test switching to carrying state from idle
    player.setAction(Actions.IDLE);
    player.toggleCarrying();
    expect(player.getCurrentAction()).toBe(Actions.CARRY_IDLE);

    // Test switching back from carrying
    player.toggleCarrying();
    expect(player.getCurrentAction()).toBe(Actions.IDLE);
  });

  it('should set correct carry action when transitioning from movement to idle', () => {
    // Set carrying state
    player.toggleCarrying();

    // Set to carrying movement
    player.setAction(Actions.MOVING); // This should translate to CARRY_RUN
    expect(player.getCurrentAction()).toBe(Actions.CARRY_RUN);

    // Now transition to idle
    player.setAction(Actions.IDLE);
    expect(player.getCurrentAction()).toBe(Actions.CARRY_IDLE);
  });

  it('should transition between carrying movement states when walking is toggled', () => {
    // First enable carrying
    player.toggleCarrying();

    // Set to MOVING which should translate to CARRY_RUN due to carrying state
    player.setAction(Actions.MOVING);
    expect(player.getCurrentAction()).toBe(Actions.CARRY_RUN);

    // Need to explicitly call updateMovementAction via setAction
    // since toggleWalking only updates action when current action is MOVING or CARRY_WALK
    player.toggleWalking();
    // After toggling walking, we need to set action again to trigger the state change
    player.setAction(Actions.MOVING); // This should translate to CARRY_WALK now
    expect(player.getCurrentAction()).toBe(Actions.CARRY_WALK);

    // Toggle back to running
    player.toggleWalking();
    // After toggling walking, set action again to trigger the update
    player.setAction(Actions.MOVING); // This should translate to CARRY_RUN now
    expect(player.getCurrentAction()).toBe(Actions.CARRY_RUN);
  });
});
