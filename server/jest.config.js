/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  globalSetup: '<rootDir>/test/globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 15000,
};
