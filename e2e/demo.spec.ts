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
  const hours = today.getByRole('list', { name: 'Next hours' }).getByRole('listitem')
  await expect(hours).not.toHaveCount(0)
  // The demo forecast starts at the current hour.
  await expect(hours.first()).toContainText('Now')
})

test('it shows the Systems card with the gateway online in demo mode', async ({ page }) => {
  await page.goto('/?demo')
  const systems = page.getByRole('region', { name: 'Systems' })
  await expect(systems).toBeVisible()
  await expect(systems.getByText('Gateway online', { exact: true })).toBeVisible()
  await expect(systems.getByRole('group', { name: 'Access points' })).toContainText('3/4')
})

test('it shows the Media card with a player playing in demo mode', async ({ page }) => {
  await page.goto('/?demo')
  const media = page.getByRole('region', { name: 'Media' })
  await expect(media).toBeVisible()
  await expect(media.getByText('Demo Song')).toBeVisible()
  await expect(media.getByRole('listitem')).toHaveText([
    'Kitchen speaker · Off',
    'Family room TV · Off',
    'Receiver · Idle',
  ])
})

// The app's own logo is the only image allowed. In demo mode the HA URL is the page's own
// origin, so an entity_picture would be a same-origin request: allow by path, not origin.
const OWN_IMAGES = ['/maple_frontier_logo.svg']

test('it requests no images in demo mode', async ({ page, baseURL }) => {
  const images: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    const own = url.origin === new URL(baseURL!).origin && OWN_IMAGES.includes(url.pathname)
    if (r.resourceType() === 'image' && !own) images.push(r.url())
  })
  await page.goto('/?demo')
  await expect(page.getByRole('region', { name: 'Media' }).getByText('Demo Song')).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(images).toEqual([])
})

async function pickDemoRoom(page: import('@playwright/test').Page, name: string) {
  await page.goto('/?demo')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText(name, { exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  return page.getByRole('region', { name })
}

test('it shows the room selector and a demo room card in demo mode', async ({ page }) => {
  const card = await pickDemoRoom(page, 'Living Room')
  await expect(card).toBeVisible()
  // The header reads the area's temperature and humidity sensors, not "Missing".
  await expect(card).not.toContainText('Missing')
  await expect(card.getByText(/\d+(\.\d+)?\s*°/).first()).toBeVisible()
  await expect(card.getByText(/\d+\s*%/).first()).toBeVisible()
  const project = test.info().project.name
  await page.screenshot({ path: `e2e/screenshots/demo-room-${project}.png`, fullPage: true })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: `e2e/screenshots/demo-room-dark-${project}.png`, fullPage: true })
})

test('it dims a demo light and plays a demo media player through the shared fake HA', async ({
  page,
}) => {
  const card = await pickDemoRoom(page, 'Living Room')
  const dimmer = card.getByRole('slider', { name: 'Living room strip brightness' })
  await dimmer.focus()
  const before = Number(await dimmer.getAttribute('aria-valuenow'))
  await dimmer.press('ArrowLeft')
  await expect.poll(async () => Number(await dimmer.getAttribute('aria-valuenow'))).not.toBe(before)
  const speaker = card.getByRole('listitem', { name: 'Living room speaker' })
  await speaker.getByRole('button', { name: 'Pause Living room speaker' }).click()
  await expect(speaker.getByRole('button', { name: 'Play Living room speaker' })).toBeVisible()
})

test('it asks for a second tap before the demo garage opener toggles', async ({ page }) => {
  const card = await pickDemoRoom(page, 'Garage')
  await card.getByRole('button', { name: /Garage opener/ }).click()
  const armed = card.getByRole('button', { name: /^Confirm: turn on/ })
  await expect(armed).toContainText('Confirm?')
  // The guard window keeps a brush from counting as the second tap.
  await page.waitForTimeout(600)
  await armed.click()
  await expect(card.getByRole('button', { name: /Garage opener/ })).toContainText('On')
})
