import { defineConfig } from 'vitest/config'

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['e2e/**/*.spec.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false
  }
})
