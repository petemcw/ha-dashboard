import { scriptState } from '../src/domains/script/factories.ts'
import { sensorState } from '../src/domains/sensor/factories.ts'
import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

const TWENTY_MIN_AGO = Math.floor(Date.now() / 1000) - 20 * 60
const openDoor = () =>
  binarySensorState({
    entity_id: 'binary_sensor.garage_door',
    state: 'on',
    last_changed: TWENTY_MIN_AGO,
  })

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
    ],
  },
})

const toggles = (mockHa: { sent(): { type: string }[] }) =>
  mockHa.sent().filter((m) => m.type === 'call_service')

test('closing the garage door takes two taps and sends one switch.toggle', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const close = region.getByRole('button', { name: 'Close garage door' })
  await expect(close).toBeEnabled()
  await close.click()
  expect(toggles(mockHa)).toHaveLength(0)

  const confirm = region.getByRole('button', { name: 'Tap again to close' })
  await expect(confirm).toBeVisible()
  await page.waitForTimeout(600)
  await confirm.click()

  await expect
    .poll(() => toggles(mockHa))
    .toMatchObject([
      { domain: 'switch', service: 'toggle', target: { entity_id: 'switch.garage_door_opener' } },
    ])
  // The item stays until HA reports the door closed.
  mockHa.setState(binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'off' }))
  await expect(region.getByText('Garage door', { exact: true })).toBeHidden()
})

test('sends nothing when the door closed between the two taps', async ({ page, mockHa }) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await region.getByRole('button', { name: 'Close garage door' }).click()
  await expect(region.getByRole('button', { name: 'Tap again to close' })).toBeVisible()
  mockHa.setState(binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'off' }))
  await expect(region.getByText('Garage door', { exact: true })).toBeHidden()
  await page.waitForTimeout(600)
  expect(toggles(mockHa)).toHaveLength(0)
})

test('Mark replaced takes two taps and sends one script.turn_on for the reset script', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(sensorState({ entity_id: 'sensor.water_filter_days_remaining', state: '-4' }))
  mockHa.setState(scriptState({ entity_id: 'script.reset_water_filter' }))
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const mark = region.getByRole('button', { name: 'Mark replaced' })
  await expect(mark).toBeEnabled()
  await mark.click()
  expect(toggles(mockHa)).toHaveLength(0)

  const confirm = region.getByRole('button', { name: 'Tap to confirm' })
  await expect(confirm).toBeVisible()
  await page.waitForTimeout(600)
  await confirm.click()

  await expect
    .poll(() => toggles(mockHa))
    .toMatchObject([
      { domain: 'script', service: 'turn_on', target: { entity_id: 'script.reset_water_filter' } },
    ])
  // The chore goes when the days-remaining sensor is back above the threshold.
  mockHa.setState(sensorState({ entity_id: 'sensor.water_filter_days_remaining', state: '90' }))
  await expect(region.getByText('Water filter', { exact: true })).toBeHidden()
})
