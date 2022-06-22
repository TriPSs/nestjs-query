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
    '!**/jest.config.ts'
  ],
  moduleNameMapper: {
    '@ptc-org/nestjs-query-core': process.cwd() + '/packages/core/src',
    '@ptc-org/nestjs-query-graphql': process.cwd() + '/packages/query-graphql/src',
    '@ptc-org/nestjs-query-typeorm': process.cwd() + '/packages/query-typeorm/src',
    '@ptc-org/nestjs-query-sequelize': process.cwd() + '/packages/query-sequelize/src',
    '@ptc-org/nestjs-query-typegoose': process.cwd() + '/packages/query-typegoose/src',
    '@ptc-org/nestjs-query-mongoose': process.cwd() + '/packages/query-mongoose/src',
    // Fix for uuid, see: https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
    '^uuid$': require.resolve('uuid')
  },
  modulePathIgnorePatterns: ['__fixtures__'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  snapshotSerializers: ['jest-snapshot-serializer-raw/always']
};
