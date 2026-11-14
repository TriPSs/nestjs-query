import { defineConfig } from 'vitest/config'

module.exports = defineConfig({
  oxc: {
    jsx: { runtime: 'classic' }
  },
  test: {
    include: ['docs/test/**/*.spec.ts']
  }
})
