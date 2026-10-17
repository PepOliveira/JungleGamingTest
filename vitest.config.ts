import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      VITE_API_BASE_URL: 'http://mock.test/api',
      VITE_ENABLE_MOCKS: 'true',
      VITE_MOCK_SCENARIO: 'instant',
    },
  },
})
