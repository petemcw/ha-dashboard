import { defineConfig } from '@playwright/test'

// Runs against its own Vite dev server. Mock specs talk to an in-test HA; @live specs
// talk to the real instance with HA_TOKEN from .env.local (see e2e/fixtures.ts).
// Screenshots land in e2e/screenshots/.
//
// The server runs on its own port with VITE_HA_URL blanked: direnv exports it, and the
// app prefers it over /config.json, which would send mock specs to the real house.
// Each fixture serves /config.json instead (the mock URL, or HA_URL for @live).
const PORT = 5174
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
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
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { VITE_HA_URL: '' },
    reuseExistingServer: true,
  },
})
