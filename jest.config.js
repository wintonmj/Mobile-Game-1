export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^phaser$': '<rootDir>/src/__tests__/mocks/phaser.ts',
    '^../../controllers/InputController$': '<rootDir>/src/__tests__/mocks/inputController.ts',
    '^../controllers/InputController$': '<rootDir>/src/__tests__/mocks/inputController.ts',
    '^./InputController$': '<rootDir>/src/__tests__/mocks/inputController.ts',
    '^controllers/InputController$': '<rootDir>/src/__tests__/mocks/inputController.ts',
    '^src/controllers/InputController$': '<rootDir>/src/__tests__/mocks/inputController.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
  },
  // Re-enable setup file
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/helpers/'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Use correct configuration without globals
  resolver: undefined, // Let Jest figure out the correct resolver
}; 