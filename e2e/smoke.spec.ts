// @live: these run against the real HA instance. Most future e2e tests should use the
// WebSocket mock instead (see .farseer/testing.md).
import { expect, test } from './fixtures.ts'

test(
  'connects to HA and receives live entities',
  { tag: '@live' },
  async ({ page, pageErrors }, testInfo) => {
    await page.goto('/')
    await expect(page.getByText(/Connected to Home Assistant \d{4}\.\d+/)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/\d+ entities/)).toBeVisible()
    await page.screenshot({
      path: `e2e/screenshots/smoke-${testInfo.project.name}.png`,
      fullPage: true,
    })
    expect(pageErrors).toEqual([])
  },
)

test(
  'shows reconnecting after the socket drops, then recovers',
  { tag: '@live' },
  async ({ page }) => {
    let dropFirstSocket: (() => Promise<void>) | undefined
    await page.routeWebSocket(/\/api\/websocket$/, (ws) => {
      ws.connectToServer()
      dropFirstSocket ??= () => ws.close()
    })

    await page.goto('/')
    const connected = page.getByText(/Connected to Home Assistant/)
    await expect(connected).toBeVisible({ timeout: 15_000 })

    await dropFirstSocket!()
    await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible()
    await expect(connected).toBeVisible({ timeout: 15_000 })
  },
)
