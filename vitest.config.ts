import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const threshold = { lines: 80, functions: 80, branches: 80, statements: 80 }

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      passWithNoTests: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
        // Gate coverage where the logic lives; features are covered by behavior tests.
        thresholds: {
          'src/domains/**': threshold,
          'src/infrastructure/**': threshold,
        },
      },
    },
  }),
)
