import { jest } from '@jest/globals';
import { Actions } from '../../models/Actions';

const mockFunctions = {
  init: jest.fn(),
  update: jest.fn(),
  player: {
    getPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
    getDirection: jest.fn().mockReturnValue('down'),
    getCurrentAction: jest.fn().mockReturnValue(Actions.IDLE),
    setPosition: jest.fn(),
    setDirection: jest.fn(),
    setAction: jest.fn(),
    getSpeed: jest.fn().mockReturnValue(200),
  },
  dungeon: {
    getSize: jest.fn().mockReturnValue({ width: 1000, height: 1000 }),
    getTileAt: jest.fn().mockReturnValue(0),
    tileSize: 32,
    isWalkable: jest.fn().mockReturnValue(true),
  },
};

const GameController = jest.fn().mockImplementation(() => {
  return {
    init: mockFunctions.init,
    update: mockFunctions.update,
    player: mockFunctions.player,
    dungeon: mockFunctions.dungeon,
  };
});

export { GameController };
export default { mockFunctions };
