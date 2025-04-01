/** @type {import('jest').Config} */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [resolve(projectRoot, 'tests/jest.setup.ts')],
  moduleNameMapper: {
    '^phaser$': resolve(projectRoot, '__mocks__/phaser.ts'),
    '@/(.*)$': resolve(projectRoot, 'src/$1'),
    '@assets/(.*)$': resolve(projectRoot, 'src/assets/$1')
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: resolve(__dirname, '../typescript/tsconfig.json'),
      useESM: true,
      diagnostics: {
        warnOnly: true
      }
    }]
  },
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules', 'src', 'tests/helpers'],
  roots: [resolve(projectRoot, 'tests')],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**',
    '!src/types/**'
  ],
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
  testEnvironmentOptions: {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  },
  setupFiles: [
    resolve(projectRoot, 'tests/jest.setup.ts')
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        warnOnly: true
      }
    }
  },
  maxWorkers: '50%',
  timers: 'modern',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false
}; 