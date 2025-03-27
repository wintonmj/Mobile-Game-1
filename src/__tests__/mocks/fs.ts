import { jest } from '@jest/globals';

/**
 * This is a simple file system mock for testing
 * It explicitly mocks fs.promises.readFile and fs.promises.writeFile
 * 
 * Usage:
 * - Use setFileContent(path, content) to set content for a specific file
 * - Use clearFiles() to clear all mocked files
 * - If a file is not found, a proper ENOENT error will be thrown
 */

// Store file contents in memory
const fileMap = new Map<string, string>();

export const fsMock = {
  /**
   * Sets content for a specific file in the mock filesystem
   */
  setFileContent: (filePath: string, content: string): void => {
    fileMap.set(filePath, content);
  },
  
  /**
   * Clears all mocked files
   */
  clearFiles: (): void => {
    fileMap.clear();
  },
  
  /**
   * Mock function implementations
   */
  mockFunctions: {
    readFile: jest.fn().mockImplementation((path: unknown) => {
      const pathString = String(path);
      const content = fileMap.get(pathString);
      
      if (content === undefined) {
        const error = new Error(`ENOENT: no such file or directory, open '${pathString}'`);
        // Add code property to make it look like a real fs error
        Object.defineProperty(error, 'code', { value: 'ENOENT' });
        return Promise.reject(error);
      }
      
      return Promise.resolve(content);
    }),
    
    writeFile: jest.fn().mockImplementation((path: unknown, content: unknown) => {
      const pathString = String(path);
      const contentString = content instanceof Buffer ? content.toString() : String(content);
      fileMap.set(pathString, contentString);
      return Promise.resolve();
    })
  }
};

// Directly mock the fs module's promise methods
jest.mock('fs', () => {
  return {
    promises: {
      readFile: fsMock.mockFunctions.readFile,
      writeFile: fsMock.mockFunctions.writeFile
    }
  };
});
