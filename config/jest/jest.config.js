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
    '!src/**/*.d.ts'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
}; 