import { test as base, expect } from '@playwright/test'
import { LONG_LIVED_TOKEN_KEY } from '../src/storageKeys.ts'

// Every page starts with HA_TOKEN in localStorage, so the app takes the
// long-lived token path instead of redirecting to HA's login page. The token
// only lives in the test browser; it never reaches the bundle.
export const test = base.extend<{ pageErrors: Error[] }>({
  page: async ({ page }, use) => {
    const token = process.env.HA_TOKEN
    if (!token) throw new Error('HA_TOKEN is not set. Run from a direnv shell in this repo.')
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
})

export { expect }
