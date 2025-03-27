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
});
