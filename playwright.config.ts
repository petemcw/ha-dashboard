import { defineConfig } from '@playwright/test'

// Runs against the Vite dev server and the live HA instance, authenticated with
// HA_TOKEN from .env.local (see e2e/fixtures.ts). Screenshots land in e2e/screenshots/.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: {
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      // Placeholder until the wall tablet hardware is chosen.
      name: 'tablet',
      use: {
        viewport: { width: 1180, height: 820 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
