const nxPreset = require('@nx/jest/preset').default

// ESM-only packages (uuid, @nestjs v12) are loaded via Node's native
// require(esm); this requires running jest with --experimental-vm-modules
// (see .local.env) on Node v24.9+
const esmPackages = []

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
    '@ptc-org/nestjs-query-core': process.cwd() + '/packages/core/src',
    '@ptc-org/nestjs-query-graphql': process.cwd() + '/packages/query-graphql/src',
    '@ptc-org/nestjs-query-typeorm': process.cwd() + '/packages/query-typeorm/src',
    '@ptc-org/nestjs-query-sequelize': process.cwd() + '/packages/query-sequelize/src',
    '@ptc-org/nestjs-query-typegoose': process.cwd() + '/packages/query-typegoose/src',
    '@ptc-org/nestjs-query-mongoose': process.cwd() + '/packages/query-mongoose/src',
    '@ptc-org/nestjs-query-rest': process.cwd() + '/packages/query-rest/src'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  testTimeout: 10000,
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')})/)`]
}
