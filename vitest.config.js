import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'functions/api/*.test.js', 'workers/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
  },
})
