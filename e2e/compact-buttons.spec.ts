import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
      binarySensorState({
        entity_id: 'binary_sensor.garage_door',
        state: 'on',
        last_changed: Math.floor(Date.now() / 1000) - 20 * 60,
      }),
    ],
  },
})

// Buttons look 34 px tall; an invisible overlay makes them 44 px targets, which is 5 px
// past each visible edge. Playwright measures the visible box, so the overlay is checked
// by tapping the middle of the fifth pixel out from each side.
for (const side of ['top', 'bottom', 'left', 'right'] as const) {
  test(`hits a compact button when tapping 5 px outside its visible ${side} edge`, async ({
    page,
    mockHa,
  }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Needs attention' })
    const snooze = region.getByRole('button', { name: 'Snooze Garage door' })
    await expect(snooze).toBeVisible()
    const box = (await snooze.boundingBox())!
    expect(box.height).toBeLessThan(40)
    const midX = box.x + box.width / 2
    const midY = box.y + box.height / 2
    const point = {
      top: [midX, box.y - 4.5],
      bottom: [midX, box.y + box.height + 4.5],
      left: [box.x - 4.5, midY],
      right: [box.x + box.width + 4.5, midY],
    }[side]
    await page.mouse.click(point[0], point[1])
    await expect(region.getByRole('group', { name: 'Snooze Garage door' })).toBeVisible()
    expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
  })
}

test('sends a tap on the visible edge of an action button to that button, not to the snooze button beside it', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const close = region.getByRole('button', { name: 'Close garage door' })
  await expect(close).toBeEnabled()
  const box = (await close.boundingBox())!
  // The last visible pixel column of the action, next to the snooze button.
  await page.mouse.click(box.x + box.width - 1, box.y + box.height / 2)
  await expect(region.getByRole('button', { name: 'Confirm close garage door' })).toBeVisible()
  await expect(region.getByRole('group', { name: 'Snooze Garage door' })).toBeHidden()
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
})

// The header's theme toggle and Settings sit side by side; each one's overlay must stop
// short of the other's visible edge.
test("sends a tap on the theme toggle's right edge to the toggle and on Settings' left edge to Settings", async ({
  page,
}) => {
  await page.goto('/')
  const bar = page.getByRole('banner')
  const toggle = bar.getByRole('button', { name: 'Switch to dark mode' })
  const settings = bar.getByRole('button', { name: 'Settings' })
  await expect(toggle).toBeVisible()
  const t = (await toggle.boundingBox())!
  await page.mouse.click(t.x + t.width - 1, t.y + t.height / 2)
  await expect(bar.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden()

  const s = (await settings.boundingBox())!
  await page.mouse.click(s.x + 1, s.y + s.height / 2)
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
})

// Compact buttons apply on every screen; these two are checked by eye in the screenshots.
test('keeps compact buttons on the undo notice', async ({ page }) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await region.getByRole('button', { name: 'Snooze Garage door' }).click()
  await region.getByRole('button', { name: '1 day' }).click()
  const notice = page.getByRole('status').filter({ hasText: /^Snoozed until / })
  const undo = notice.getByRole('button', { name: 'Undo' })
  await expect(undo).toBeVisible()
  expect((await undo.boundingBox())!.height).toBeLessThan(40)
  // Let it finish rising in before the screenshot.
  await expect(notice).toHaveCSS('opacity', '1')
  await page.screenshot({ path: `e2e/screenshots/undo-notice-${test.info().project.name}.png` })
})

test.describe('kiosk token form', () => {
  test.use({ seedToken: false })

  test('keeps compact buttons on the kiosk token form', async ({ page }) => {
    await page.goto('/?kiosk')
    const connect = page.getByRole('button', { name: 'Connect' })
    await expect(connect).toBeVisible()
    expect((await connect.boundingBox())!.height).toBeLessThan(40)
    await page.screenshot({ path: `e2e/screenshots/kiosk-token-${test.info().project.name}.png` })
  })
})
