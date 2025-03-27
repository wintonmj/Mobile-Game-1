import { jest } from '@jest/globals';

const fileMap = new Map<string, string>();

export const fsMock = {
  setFileContent: (filePath: string, content: string): void => {
    fileMap.set(filePath, content);
  },
  
  clearFiles: (): void => {
    fileMap.clear();
  },
  
  mockFunctions: {
    readFile: jest.fn().mockImplementation((path: unknown, options?: unknown) => {
      const pathString = String(path);
      const content = fileMap.get(pathString);
      if (content === undefined) {
        const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      }
      return Promise.resolve(content);
    }),
    
    writeFile: jest.fn().mockImplementation((path: unknown, content: unknown) => {
      const pathString = String(path);
      const contentString = String(content);
      fileMap.set(pathString, contentString);
      return Promise.resolve();
    })
  }
};

jest.mock('fs', () => ({
  promises: {
    readFile: fsMock.mockFunctions.readFile,
    writeFile: fsMock.mockFunctions.writeFile,
  },
}));
