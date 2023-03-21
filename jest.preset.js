const nxPreset = require('@nrwl/jest/preset').default;

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
    '@rezonate/nestjs-query-core': __dirname + '/packages/core/src',
    '@rezonate/nestjs-query-graphql': __dirname + '/packages/query-graphql/src',
    '@rezonate/nestjs-query-typeorm': __dirname + '/packages/query-typeorm/src',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  snapshotSerializers: ['jest-snapshot-serializer-raw/always'],
  testMatch: ["**/?(*.)+(spec).[jt]s?(x)"]
};
