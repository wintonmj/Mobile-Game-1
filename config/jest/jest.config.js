/**
 * @file jest.config.js
 * @description Jest configuration file for the game project. Configures testing environment, coverage thresholds,
 * module resolution, and other testing-specific settings. For troubleshooting and detailed explanations,
 * see {@link ../docs/testing/jest-configuration-troubleshooting.md}
 * 
 * @see {@link ../docs/testing/jest-configuration-troubleshooting.md|Jest Configuration Troubleshooting Guide}
 */

/** @type {import('jest').Config} */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

/**
 * Jest configuration object defining test environment setup, coverage requirements,
 * module resolution, and performance settings.
 * 
 * @type {import('jest').Config}
 * @exports
 * @see {@link ../docs/testing/jest-configuration-troubleshooting.md|Troubleshooting Guide}
 */
export default {
  /** @type {string} - Uses ts-jest for TypeScript support */
  preset: 'ts-jest',
  
  /** @type {string} - JSDOM environment for browser API simulation */
  testEnvironment: 'jsdom',
  
  /** @type {string[]} - Setup files to run before tests */
  setupFilesAfterEnv: [resolve(projectRoot, 'tests/jest.setup.ts')],
  
  /**
   * Module name mapping configuration
   * @type {Object.<string, string>}
   */
  moduleNameMapper: {
    '^phaser$': resolve(projectRoot, '__mocks__/phaser.ts'),
    '@/(.*)$': resolve(projectRoot, 'src/$1'),
    '@assets/(.*)$': resolve(projectRoot, 'src/assets/$1')
  },
  
  /**
   * Transform configuration for TypeScript files
   * @type {Object.<string, Array>}
   */
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: resolve(__dirname, '../typescript/tsconfig.json'),
      useESM: true,
      diagnostics: {
        warnOnly: true
      }
    }]
  },
  
  /** @type {string[]} - Test file patterns to match */
  testMatch: ['**/*.test.ts'],
  
  /** @type {string[]} - File extensions to process */
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  /** @type {string[]} - Extensions to treat as ES modules */
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  /** @type {string[]} - Module resolution directories */
  moduleDirectories: ['node_modules', 'src', 'tests/helpers'],
  
  /** @type {string[]} - Root directories for tests */
  roots: [
    resolve(projectRoot, 'src'),
    resolve(projectRoot, 'tests')
  ],
  
  /** @type {string[]} - Patterns to ignore during testing */
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  /** @type {boolean} - Enable verbose output */
  verbose: true,
  
  /**
   * Files to collect coverage from
   * @type {string[]}
   */
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**',
    '!src/types/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  
  /** @type {string} - Directory where Jest should output coverage files */
  coverageDirectory: 'coverage',
  
  /** @type {boolean} - Collect coverage from untested files */
  collectCoverage: true,
  
  /** @type {string} - Root directory for resolving paths */
  rootDir: projectRoot,
  
  /**
   * Coverage thresholds configuration
   * @see {@link ../docs/testing/jest-configuration-troubleshooting.md#coverage-threshold-issues}
   * @type {Object.<string, Object>}
   */
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    },
    'src/core/services/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/entities/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    'src/controllers/**/*.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    'src/ui/**/*.ts': {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    }
  },
  
  /**
   * Test environment options for JSDOM
   * @type {Object}
   */
  testEnvironmentOptions: {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  },
  
  /** @type {string} - Maximum number of workers for parallel execution */
  maxWorkers: '50%',
  
  /**
   * Fake timers configuration
   * @see {@link ../docs/testing/jest-configuration-troubleshooting.md#timer-and-animation-testing}
   * @type {Object}
   */
  fakeTimers: {
    enableGlobally: true
  },
  
  /** @type {boolean} - Clear mocks between tests */
  clearMocks: true,
  
  /** @type {boolean} - Restore mocked state between tests */
  restoreMocks: true,
  
  /** @type {boolean} - Don't reset mocks between tests */
  resetMocks: false
}; 