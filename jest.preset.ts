const nxPreset = require('@nrwl/jest/preset');

module.exports = {
  ...nxPreset,

  collectCoverage: true,
  coverageReporters: ['html', 'clover'],
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!**/__tests__/**',
    '!*.spec.ts',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/jest.config.ts',
  ],
  moduleNameMapper: {
    '@rezonapp/nestjs-query-core': process.cwd() + '/packages/core/src',
    '@rezonapp/nestjs-query-graphql': process.cwd() + '/packages/query-graphql/src',
    '@rezonapp/nestjs-query-typeorm': process.cwd() + '/packages/query-typeorm/src',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  snapshotSerializers: ['jest-snapshot-serializer-raw/always'],
  testMatch: ["**/?(*.)+(spec).[jt]s?(x)"]
};
