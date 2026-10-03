import { existsSync } from 'node:fs'
import { test as base, expect } from '@playwright/test'
import { LONG_LIVED_TOKEN_KEY } from '../src/infrastructure/storageKeys.ts'
import { HaMock, WEBSOCKET_URL, type HaMockOptions, type SentMessage } from './haMock.ts'

const DUMMY_TOKEN = 'mock-token'
// In dev, Vite serves this as /home.json. It's the owner's real house config, gitignored.
const LIVE_HOME_JSON = new URL('../public/home.json', import.meta.url)

// Mock tests: the app talks to an in-test Home Assistant. HA_TOKEN is never read,
// so these run anywhere and may exercise writes safely. The mock is installed for every
// test, whether or not the test reads `mockHa`.
export const test = base.extend<{
  seedToken: string | false
  haOptions: HaMockOptions
  mockHa: HaMock
}>({
  seedToken: [DUMMY_TOKEN, { option: true }],
  haOptions: [{}, { option: true }],
  mockHa: [
    async ({ page, seedToken, haOptions }, use) => {
      const mock = new HaMock(haOptions)
      await mock.install(page)
      if (seedToken !== false) {
        await page.addInitScript(
          ([key, value]) => localStorage.setItem(key, value),
          [LONG_LIVED_TOKEN_KEY, seedToken],
        )
      }
      await use(mock)
    },
    { auto: true },
  ],
})

const FORBIDDEN = /^(call_service|frontend\/set_.*)$/

export type LiveSocket = {
  drop(): Promise<void>
  // Returns the blocked writes and forgets them, for tests that deliberately attempt one.
  takeBlocked(): SentMessage[]
}

// @live tests run against the real house as an admin. The guard owns the only
// WebSocket route and never forwards a write to HA. Tests must not add their own
// routeWebSocket for the same URL: a second route can take the socket and bypass it.
export const liveTest = base.extend<{ pageErrors: Error[]; liveSocket: LiveSocket }>({
  page: async ({ page }, use) => {
    const token = process.env.HA_TOKEN
    const haUrl = process.env.HA_URL
    if (!token || !haUrl) {
      throw new Error('HA_TOKEN or HA_URL is not set. Run from a direnv shell in this repo.')
    }
    if (!existsSync(LIVE_HOME_JSON)) {
      throw new Error(
        '@live tests need public/home.json (your real house config, gitignored). ' +
          'Copy home.example.json to public/home.json and edit it.',
      )
    }
    // The Playwright dev server runs without VITE_HA_URL (see playwright.config.ts).
    await page.route('**/config.json', (route) => route.fulfill({ json: { haUrl } }))
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [LONG_LIVED_TOKEN_KEY, token],
    )
    await use(page)
  },
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = []
    page.on('pageerror', (err) => errors.push(err))
    await use(errors)
  },
  liveSocket: [
    async ({ page }, use, testInfo) => {
      const blocked: SentMessage[] = []
      let current: { close(): Promise<void> } | undefined
      await page.routeWebSocket(WEBSOCKET_URL, (ws) => {
        const server = ws.connectToServer()
        current = ws
        ws.onMessage((raw) => {
          const text = String(raw)
          const msg = JSON.parse(text) as SentMessage
          if (FORBIDDEN.test(msg.type)) {
            blocked.push(msg)
            ws.send(
              JSON.stringify({
                id: msg.id,
                type: 'result',
                success: false,
                error: { code: 'blocked_by_test', message: 'Blocked by the read-only guard' },
              }),
            )
            return
          }
          server.send(text)
        })
      })
      await use({
        drop: async () => {
          await current?.close()
        },
        takeBlocked: () => blocked.splice(0),
      })
      // Admin snooze cleanup may legitimately try a system-data write; note it, don't fail.
      const systemWrites = blocked.filter((m) => m.type === 'frontend/set_system_data')
      for (const m of systemWrites) {
        testInfo.annotations.push({ type: 'blocked', description: `${m.type} ${String(m.key)}` })
      }
      const unexpected = blocked.filter(
        (m) => m.type === 'call_service' || m.type === 'frontend/set_user_data',
      )
      expect(
        unexpected.map((m) => m.type),
        '@live tests must be read-only',
      ).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
