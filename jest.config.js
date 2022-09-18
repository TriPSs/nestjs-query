// jest.config.js
module.exports = {
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/query-graphql',
    '<rootDir>/packages/query-typeorm',
  ],
  testTimeout: 10000,
  collectCoverageFrom: ['packages/**/*.ts', '!**/__tests__/**', '!**/dist/**', '!**/node_modules/**'],
  snapshotSerializers: ['jest-snapshot-serializer-raw/always']
};
