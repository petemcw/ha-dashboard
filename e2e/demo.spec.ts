import { MOCK_HA_URL } from './haMock.ts'
import { expect, test } from './fixtures.ts'

// The fixture installs the HA mock for every test, so demo mode is proven by what never
// reaches it. Playwright's 'request' event doesn't report WebSockets, hence the separate
// websocket listener and the mock's own records.
test('demo mode shows the Home screen on the fake HA without reaching Home Assistant', async ({
  page,
  mockHa,
}) => {
  const requests: string[] = []
  const sockets: string[] = []
  page.on('request', (r) => requests.push(r.url()))
  page.on('websocket', (ws) => sockets.push(ws.url()))

  await page.goto('/?demo')

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'People' })).toBeVisible()
  await expect(page.getByText('Demo', { exact: true })).toBeVisible()

  expect(requests.filter((u) => u.startsWith(MOCK_HA_URL))).toEqual([])
  expect(requests.filter((u) => /\/(config|home)\.json$/.test(new URL(u).pathname))).toEqual([])
  // Vite's own hot-reload socket isn't Home Assistant's.
  expect(sockets.filter((u) => u.endsWith('/api/websocket'))).toEqual([])
  expect(mockHa.authTokens).toEqual([])
  expect(mockHa.sent()).toEqual([])
})

test('a favorite light tapped in demo mode turns on without reaching Home Assistant', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  await page.goto('/?demo')
  const lamp = page.getByRole('button', { name: /Living room lamp/ })
  await expect(lamp).toHaveAttribute('aria-pressed', 'false')
  await lamp.click()
  await expect(lamp).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({
    path: `e2e/screenshots/demo-${test.info().project.name}.png`,
    fullPage: true,
  })

  expect(requests.filter((u) => u.startsWith(MOCK_HA_URL))).toEqual([])
})

test('it shows the Today card with a forecast in demo mode', async ({ page }) => {
  await page.goto('/?demo')
  const today = page.getByRole('region', { name: 'Today' })
  await expect(today).toBeVisible()
  await expect(
    today.getByRole('list', { name: 'Next hours' }).getByRole('listitem'),
  ).not.toHaveCount(0)
})

test('it shows the Systems card with the gateway online in demo mode', async ({ page }) => {
  await page.goto('/?demo')
  const systems = page.getByRole('region', { name: 'Systems' })
  await expect(systems).toBeVisible()
  await expect(systems.getByText('Online', { exact: false }).first()).toBeVisible()
  await expect(systems.getByText('1/2')).toBeVisible()
})

test('it shows the Media card with a player playing in demo mode', async ({ page }) => {
  await page.goto('/?demo')
  const media = page.getByRole('region', { name: 'Media' })
  await expect(media).toBeVisible()
  await expect(media.getByText('Demo Song')).toBeVisible()
})

test('it requests no images in demo mode', async ({ page }) => {
  const images: string[] = []
  page.on('request', (r) => {
    // The app's own bundled assets (the logo) are fine; entity pictures would be remote.
    const own = new URL(r.url()).origin === new URL(page.url()).origin
    if (r.resourceType() === 'image' && !own) images.push(r.url())
  })
  await page.goto('/?demo')
  await expect(page.getByRole('region', { name: 'Media' })).toBeVisible()
  expect(images).toEqual([])
})
