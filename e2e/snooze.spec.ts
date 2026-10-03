import type { Page } from '@playwright/test'
import { batterySensorState } from '../src/domains/sensor/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { SNOOZES_KEY as KEY } from '../src/features/home/attention/snoozes.ts'
import { expect, test } from './fixtures.ts'
import { sendFromAnotherClient } from './haMock.ts'

const ID = 'battery-low:sensor.door_battery'

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      batterySensorState({
        entity_id: 'sensor.door_battery',
        state: '12',
        attributes: { friendly_name: 'Front door battery' },
      }),
    ],
  },
})

const choreRow = (page: Page) => page.getByRole('list', { name: 'Chores' })
const farFuture = () => new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()

test.describe('snoozing attention items', () => {
  test('an admin snoozes a chore for a week and it moves to the snoozed list', async ({
    page,
    mockHa,
  }) => {
    await page.goto('/')
    await expect(choreRow(page)).toContainText('Front door battery')
    await page.getByRole('button', { name: 'Snooze Front door battery' }).click()
    await page.getByRole('button', { name: '1 week' }).click()

    await expect(page.getByText('1 snoozed')).toBeVisible()
    await expect(choreRow(page)).toHaveCount(0)
    const stored = mockHa.systemData.get(KEY) as {
      version: number
      snoozes: Record<string, { until: string; by: string }>
    }
    expect(stored.version).toBe(1)
    expect(stored.snoozes[ID].by).toBe('user-1')
    const days = (Date.parse(stored.snoozes[ID].until) - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThan(7.1)
    expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
  })

  test('a non-admin sees an item is snoozed but gets no snooze action', async ({
    page,
    mockHa,
  }) => {
    mockHa.user = { ...mockHa.user, is_admin: false, is_owner: false }
    mockHa.systemData.set(KEY, { version: 1, snoozes: { [ID]: { until: farFuture(), by: 'x' } } })
    await page.goto('/')
    await expect(page.getByText('1 snoozed')).toBeVisible()
    await expect(page.getByRole('button', { name: /snooze/i })).toHaveCount(0)
    expect(mockHa.sent().filter((m) => m.type === 'frontend/set_system_data')).toHaveLength(0)
  })

  test('shows a snooze made on another device without a reload', async ({ page }) => {
    await page.goto('/')
    await expect(choreRow(page)).toContainText('Front door battery')
    // Another admin's device writes the shared system data.
    await sendFromAnotherClient(page, {
      type: 'frontend/set_system_data',
      key: KEY,
      value: { version: 1, snoozes: { [ID]: { until: farFuture(), by: 'someone' } } },
    })
    await expect(page.getByText('1 snoozed')).toBeVisible()
    await expect(choreRow(page)).toHaveCount(0)
  })
})
