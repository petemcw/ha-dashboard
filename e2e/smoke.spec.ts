// @live: these run against the real HA instance. Most future e2e tests should use the
// WebSocket mock instead (see .farseer/testing.md).
import type { Page } from '@playwright/test'
import { expect, liveTest as test } from './fixtures.ts'

test(
  'connects to HA and receives live entities',
  { tag: '@live' },
  async ({ page, pageErrors }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached({
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
    await page.screenshot({
      path: `e2e/screenshots/smoke-${testInfo.project.name}.png`,
      fullPage: true,
    })
    expect(pageErrors).toEqual([])
  },
)

test(
  'renders the home sections against the real Home Assistant instance',
  { tag: '@live' },
  async ({ page, pageErrors }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached({
      timeout: 15_000,
    })
    // Structure only: the house decides whether items, people, or suggestions show up. A
    // calm house has no attention card at all, so it's only checked for order below.
    await expect(page.getByRole('region', { name: 'People' })).toBeAttached()
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    // Suggestions depend on whether the Apple TV is playing; check order only if present.
    const names = await page
      .locator('header section, main section')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('aria-label') ?? el.querySelector('h2')?.textContent),
      )
    // DOM order, column by column (what a screen reader reads), as in home.spec.ts.
    const order = [
      'People',
      'Needs attention',
      // Takes the attention card's place when everything left is snoozed.
      'Snoozed',
      'Suggested',
      'Crypto',
      'Favorites',
      'Today',
      'Systems',
      'Media',
    ]
    expect(names).toEqual(order.filter((n) => names.includes(n)))
    await page.screenshot({
      path: `e2e/screenshots/home-${testInfo.project.name}.png`,
      fullPage: true,
    })
    expect(pageErrors).toEqual([])
  },
)

test(
  'shows reconnecting after the socket drops, then recovers',
  { tag: '@live' },
  async ({ page, liveSocket }) => {
    await page.goto('/')
    const connected = page.getByRole('region', { name: 'Favorites' })
    await expect(connected).toBeAttached({ timeout: 15_000 })

    await liveSocket.drop()
    await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible()
    await expect(connected).toBeAttached({ timeout: 15_000 })
  },
)

// A raw socket from the page bypasses the app, so only the guard stands in the way.
async function sendRawCallService(page: Page) {
  const haUrl = process.env.HA_URL
  if (!haUrl) throw new Error('HA_URL is not set. Run from a direnv shell in this repo.')
  const wsUrl = `${haUrl.replace(/^http/, 'ws')}/api/websocket`
  return page.evaluate(
    (url) =>
      new Promise<string>((resolve, reject) => {
        const ws = new WebSocket(url)
        ws.onerror = () => reject(new Error('socket error'))
        ws.onopen = () =>
          ws.send(
            JSON.stringify({
              id: 1,
              type: 'call_service',
              domain: 'homeassistant',
              service: 'noop',
            }),
          )
        ws.onmessage = (ev) => {
          const msg = JSON.parse(String(ev.data))
          if (msg.type === 'result') resolve(msg.error?.code ?? 'forwarded')
        }
      }),
    wsUrl,
  )
}

test(
  'never forwards call_service or a frontend set message to the real Home Assistant',
  { tag: '@live' },
  async ({ page, liveSocket }) => {
    await page.goto('/')
    // The guard answers itself; HA would have answered with its own error code.
    expect(await sendRawCallService(page)).toBe('blocked_by_test')
    expect(liveSocket.takeBlocked().map((m) => m.type)).toEqual(['call_service'])
  },
)

test('fails a live test that sends call_service', { tag: '@live' }, async ({ page }) => {
  test.fail()
  await page.goto('/')
  await sendRawCallService(page)
})
