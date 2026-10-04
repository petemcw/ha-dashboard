import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'

// The header's sun/moon button. On `system` it follows the device; a tap pins the opposite
// theme as an explicit preference that outlives a reload.

// The browser chrome colors from index.html and useThemePreference.
const LIGHT_BAR = '#542711'
const DARK_BAR = '#3e1c0d'

const toggle = (page: Page) => page.getByRole('banner').getByRole('button', { name: /^Switch to / })

const themeColors = (page: Page) =>
  page
    .locator('meta[name="theme-color"]')
    .evaluateAll((metas) => metas.map((m) => m.getAttribute('content')))

async function expectShowsTarget(page: Page, target: 'light' | 'dark') {
  // A moon offers dark; a sun offers light.
  const icon = target === 'dark' ? 'moon' : 'sun'
  const other = target === 'dark' ? 'sun' : 'moon'
  await expect(toggle(page)).toHaveAccessibleName(`Switch to ${target} mode`)
  await expect(toggle(page).locator(`svg.lucide-${icon}`)).toBeVisible()
  await expect(toggle(page).locator(`svg.lucide-${other}`)).toHaveCount(0)
}

test('names the toggle and picks its icon from the device theme while on system', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expectShowsTarget(page, 'light')

  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expectShowsTarget(page, 'dark')
})

test('follows the device theme when it changes while on system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expectShowsTarget(page, 'dark')

  await page.emulateMedia({ colorScheme: 'dark' })
  await expectShowsTarget(page, 'light')
  await page.emulateMedia({ colorScheme: 'light' })
  await expectShowsTarget(page, 'dark')
})

test('sets an explicit theme on tap and pins the browser chrome color to it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  // System: one theme-color per scheme.
  expect(await themeColors(page)).toEqual([LIGHT_BAR, DARK_BAR])

  await toggle(page).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expectShowsTarget(page, 'light')
  await expect.poll(() => themeColors(page)).toEqual([DARK_BAR, DARK_BAR])

  // Explicit now, so the device changing no longer moves it.
  await page.emulateMedia({ colorScheme: 'dark' })
  await toggle(page).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expectShowsTarget(page, 'dark')
  await expect.poll(() => themeColors(page)).toEqual([LIGHT_BAR, LIGHT_BAR])
})

test('keeps the theme chosen in the header after a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await toggle(page).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expectShowsTarget(page, 'light')
  expect(await themeColors(page)).toEqual([DARK_BAR, DARK_BAR])
  // --surface in dark: #1c130e.
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(28, 19, 14)')
})

// Colour transitions running on <body> right now. The page ground has no transition of its
// own (buttons and tiles do), so one here means the whole page is easing.
const colourTransitions = (page: Page) =>
  page.evaluate(
    `document.body.getAnimations().filter((a) => a.transitionProperty === 'background-color').length`,
  ) as Promise<number>

test('eases the page into the new theme instead of flipping it in one frame', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(toggle(page)).toBeVisible()
  expect(await colourTransitions(page)).toBe(0)
  await toggle(page).click()
  expect(await colourTransitions(page)).toBeGreaterThan(0)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('switches the theme at once with reduced motion', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/')
  await toggle(page).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expectShowsTarget(page, 'light')
  expect(await colourTransitions(page)).toBe(0)
})
