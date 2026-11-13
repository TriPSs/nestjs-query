import { defineConfig } from 'vitest/config'

module.exports = defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts']
  }
})
