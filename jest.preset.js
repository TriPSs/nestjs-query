const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  collectCoverage: true,
  coverageReporters: ['html', 'clover'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/__tests__/**',
    '!*.spec.ts',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/jest.config.ts',
    '!**/jest.e2e.ts'
  ],
  moduleNameMapper: {
    '@souagrosolucoes/nestjs-query-core': process.cwd() + '/packages/core/src',
    '@souagrosolucoes/nestjs-query-graphql': process.cwd() + '/packages/query-graphql/src',
    '@souagrosolucoes/nestjs-query-typeorm': process.cwd() + '/packages/query-typeorm/src',
    '@souagrosolucoes/nestjs-query-sequelize': process.cwd() + '/packages/query-sequelize/src',
    '@souagrosolucoes/nestjs-query-typegoose': process.cwd() + '/packages/query-typegoose/src',
    '@souagrosolucoes/nestjs-query-mongoose': process.cwd() + '/packages/query-mongoose/src'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  testTimeout: 10000
}
