import { jest } from '@jest/globals';
import { Environment } from '../../services/ConfigurationService';

/**
 * Enhanced filesystem mock for testing
 * 
 * This implementation uses a simple in-memory approach
 */

// Store file contents in memory
const fileMap = new Map<string, string>();

// Create a mock error constructor
function createFsError(code: string, path: string): Error {
  const error: any = new Error(
    code === 'ENOENT' 
      ? `ENOENT: no such file or directory, open '${path}'`
      : `${code}: error accessing file '${path}'`
  );
  error.code = code;
  error.errno = code === 'ENOENT' ? -2 : -13;
  error.syscall = 'open';
  error.path = path;
  return error;
}

// Mock read file implementation
const readFilePromise = jest.fn().mockImplementation((path: any, encoding?: any) => {
  const pathStr = String(path);
  console.log(`Mock fs.readFile called with path: ${pathStr}`);
  console.log(`Available files in mock: ${Array.from(fileMap.keys()).join(', ')}`);
  
  const content = fileMap.get(pathStr);
  
  if (content === undefined) {
    console.log(`File not found in mock: ${pathStr}`);
    return Promise.reject(createFsError('ENOENT', pathStr));
  }
  
  console.log(`File found in mock, content length: ${content.length}`);
  return Promise.resolve(content);
});

// Ensure the mock is properly set up
// Use resetModules to avoid issues with module caching
beforeEach(() => {
  jest.resetModules();
  // Ensure fs is mocked before any test runs
  jest.mock('fs', () => ({
    promises: {
      readFile: readFilePromise
    }
  }), { virtual: true });
});

export const fsMock = {
  /**
   * Sets content for a specific file in the mock filesystem
   * @param filePath Path to the file
   * @param content Content to write to the file
   */
  setFileContent: (filePath: string, content: string): void => {
    fileMap.set(filePath, content);
  },
  
  /**
   * Restores the mock filesystem state
   * Call this in afterEach to prevent test pollution
   */
  restore: (): void => {
    fileMap.clear();
    jest.clearAllMocks();
  },
  
  /**
   * Clears all mocked files
   */
  clearFiles: (): void => {
    fileMap.clear();
  },

  /**
   * Creates a mock configuration file for a specific environment
   * @param env Environment (dev, test, prod)
   * @param config Configuration object
   */
  createConfigFile: (env: Environment, config: Record<string, any>): void => {
    fsMock.setFileContent(`config.${env}.json`, JSON.stringify(config, null, 2));
  },

  /**
   * Creates an invalid JSON configuration file to test error handling
   * @param env Environment (dev, test, prod)
   */
  createInvalidConfigFile: (env: Environment): void => {
    fsMock.setFileContent(`config.${env}.json`, '{invalid"json:content');
  },

  /**
   * Creates configuration files for multiple environments
   * @param configs Object mapping environments to their configuration objects
   */
  createConfigFiles: (configs: Record<Environment, Record<string, any>>): void => {
    Object.entries(configs).forEach(([env, config]) => {
      fsMock.createConfigFile(env as Environment, config);
    });
  },

  /**
   * Simulates a missing configuration file by ensuring it doesn't exist
   * @param env Environment (dev, test, prod)
   */
  ensureConfigFileMissing: (env: Environment): void => {
    fileMap.delete(`config.${env}.json`);
  },

  /**
   * Simulates a permission error when accessing a configuration file
   * @param env Environment (dev, test, prod)
   */
  createInaccessibleConfigFile: (env: Environment): void => {
    const filePath = `config.${env}.json`;
    
    // Override the implementation to throw EACCES error for this specific file
    readFilePromise.mockImplementationOnce((path: any) => {
      const pathStr = String(path);
      if (pathStr === filePath) {
        return Promise.reject(createFsError('EACCES', filePath));
      }
      
      // Otherwise use the default implementation
      const content = fileMap.get(pathStr);
      
      if (content === undefined) {
        return Promise.reject(createFsError('ENOENT', pathStr));
      }
      
      return Promise.resolve(content);
    });
  },
  
  /**
   * Set up default configuration files for testing
   * This is a convenience method to set up a standard test environment
   */
  setupDefaultConfigs(): void {
    const defaultDevConfig = {
      game: { difficulty: 'easy', maxPlayers: 4 }
    };
    
    const defaultTestConfig = {
      game: { difficulty: 'medium', maxPlayers: 2 }
    };
    
    const defaultProdConfig = {
      game: { difficulty: 'hard', maxPlayers: 8 }
    };
    
    console.log('Setting up default configs...');
    console.log('Before creating files:', Array.from(fileMap.keys()));
    
    // Create config files
    this.createConfigFiles({
      dev: defaultDevConfig,
      test: defaultTestConfig,
      prod: defaultProdConfig
    });
    
    console.log('After creating files:', Array.from(fileMap.keys()));
  }
};
