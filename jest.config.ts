module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  restoreMocks: true,
  resetMocks: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  coverageReporters: ['text', 'lcov', 'clover', 'html']
};
