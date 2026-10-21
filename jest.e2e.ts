import type { Config } from 'jest'

export default {
  displayName: 'examples',
  preset: './jest.preset.js',
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: process.cwd() + '/examples/tsconfig.spec.json'
      }
    ]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['**/examples/**/e2e/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/federation-v2-e2e/'],
  // mercurius and its transitive deps (@fastify/static -> ESM-only content-disposition,
  // dynamic import of ESM-only quick-lru, @mercuriusjs/gateway -> ESM-only p-map)
  // must be transpiled by ts-jest to CJS
  transformIgnorePatterns: [
    'node_modules/(?!(mercurius|quick-lru|@fastify/static|@fastify/static/node_modules/content-disposition|content-disposition|uuid|@mercuriusjs/gateway|p-map)/)'
  ],
  setupFilesAfterEnv: ['jest-extended'],
  coverageDirectory: './coverage/examples'
} satisfies Config
