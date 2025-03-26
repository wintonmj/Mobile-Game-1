import { jest } from '@jest/globals';

describe('Sample Test', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should demonstrate how to mock dependencies', () => {
    // Example of mocking
    const mockFn = jest.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalled();
  });
});
