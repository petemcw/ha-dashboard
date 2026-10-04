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

// Buttons look 34 px tall; an invisible overlay makes them 44 px targets. Playwright
// measures the visible box, so the overlay is checked by tapping where it should reach.
test('hits a compact button when tapping just outside its visible edge', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const snooze = region.getByRole('button', { name: 'Snooze Garage door' })
  await expect(snooze).toBeVisible()
  const box = (await snooze.boundingBox())!
  expect(box.height).toBeLessThan(40)
  // Four pixels past the bottom edge, in the middle: outside the box, inside the overlay.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height + 4)
  await expect(region.getByRole('group', { name: 'Snooze Garage door' })).toBeVisible()
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
})

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
