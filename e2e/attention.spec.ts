import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { batterySensorState, sensorState } from '../src/domains/sensor/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { updateState } from '../src/domains/update/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

const TWENTY_MIN_AGO = Math.floor(Date.now() / 1000) - 20 * 60

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
    ],
  },
})

test.describe('attention', () => {
  test('shows an urgent item for a garage door open for 20 minutes, with an enabled action', async ({
    page,
    mockHa,
  }) => {
    mockHa.setState(
      binarySensorState({
        entity_id: 'binary_sensor.garage_door',
        state: 'on',
        last_changed: TWENTY_MIN_AGO,
      }),
    )
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Needs attention' })
    await expect(region.getByText('Garage door', { exact: true })).toBeVisible()
    await expect(region.getByText('Open for 20 min')).toBeVisible()
    const action = region.getByRole('button', { name: 'Close garage door' })
    await expect(action).toBeEnabled()
    expect(mockHa.sent().some((m) => m.type === 'call_service')).toBe(false)
    await page.screenshot({ path: `e2e/screenshots/attention-${test.info().project.name}.png` })
  })

  test('shows that nothing needs attention when the house is calm', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('region', { name: 'Needs attention' }).getByText('Nothing needs attention'),
    ).toBeVisible()
  })

  test('shows a low battery and a pending update as compact chores', async ({ page, mockHa }) => {
    mockHa.setState(
      batterySensorState({
        entity_id: 'sensor.front_door_battery',
        state: '12',
        attributes: { friendly_name: 'Front door battery' },
      }),
    )
    mockHa.setState(
      updateState({
        entity_id: 'update.router_firmware',
        state: 'on',
        attributes: { installed_version: '4.3.5', latest_version: '4.3.10' },
      }),
    )
    await page.goto('/')
    const chores = page.getByRole('region', { name: 'Needs attention' }).getByRole('list', {
      name: 'Chores',
    })
    await expect(chores.getByText('Front door battery')).toBeVisible()
    await expect(chores.getByText('12%')).toBeVisible()
    await expect(chores.getByText('4.3.5 → 4.3.10')).toBeVisible()
    const row = chores.getByRole('listitem').first()
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: `e2e/screenshots/chores-${test.info().project.name}.png` })
  })
  test('shows low toner with a reorder link and an overdue filter', async ({ page, mockHa }) => {
    mockHa.setState(sensorState({ entity_id: 'sensor.printer_ink', state: '9' }))
    mockHa.setState(sensorState({ entity_id: 'sensor.water_filter_days_remaining', state: '-117' }))
    await page.goto('/')
    const chores = page.getByRole('region', { name: 'Needs attention' }).getByRole('list', {
      name: 'Chores',
    })
    await expect(chores.getByRole('link', { name: 'Reorder toner' })).toHaveAttribute(
      'href',
      /^https:\/\//,
    )
    await expect(chores.getByText('Overdue by 117 days')).toBeVisible()
    await expect(chores.getByRole('button', { name: 'Mark replaced' })).toBeVisible()
    await page.screenshot({ path: `e2e/screenshots/filters-${test.info().project.name}.png` })
  })
})
