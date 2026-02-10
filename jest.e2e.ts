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
  setupFilesAfterEnv: ['jest-extended'],
  coverageDirectory: './coverage/examples'
} satisfies Config
