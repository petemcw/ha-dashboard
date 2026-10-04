import { sensorState } from '../src/domains/sensor/factories.ts'
import { updateState } from '../src/domains/update/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

const bootedDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      sensorState({ entity_id: 'sensor.gateway_state', state: 'connected' }),
      sensorState({ entity_id: 'sensor.gateway_boot_time', state: bootedDaysAgo(19) }),
      sensorState({ entity_id: 'sensor.office_ap_state', state: 'connected' }),
      sensorState({ entity_id: 'sensor.hallway_ap_state', state: 'disconnected' }),
      sensorState({ entity_id: 'sensor.garage_ap_state', state: 'connected' }),
      sensorState({ entity_id: 'sensor.basement_ap_state', state: 'connected' }),
      sensorState({
        entity_id: 'sensor.backup_last_successful_automatic_backup',
        state: new Date().toISOString(),
      }),
      sensorState({ entity_id: 'sensor.processor_use', state: '12' }),
      sensorState({ entity_id: 'sensor.gateway_cpu_utilization', state: '47' }),
      updateState({ entity_id: 'update.router_firmware', state: 'on' }),
    ],
  },
})

test('shows the gateway status chip and stat tiles in the Systems card', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('region', { name: 'Systems' })
  await expect(card.getByText('Gateway online')).toBeVisible()
  await expect(card.getByRole('group', { name: 'Uptime' })).toContainText('19 d')
  await expect(card.getByRole('group', { name: 'Access points' })).toContainText('3/4')
  await expect(card.getByRole('group', { name: 'Last backup' })).toContainText('Today')
  await expect(card.getByRole('group', { name: 'Updates' })).toContainText('Ready to install')
})

test('shows a CPU bar per configured device in the Systems card', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('region', { name: 'Systems' })
  await expect(card.getByRole('meter', { name: 'Home Assistant CPU' })).toHaveAttribute(
    'aria-valuenow',
    '12',
  )
  await expect(card.getByRole('meter', { name: 'Gateway CPU' })).toBeVisible()
  await expect(card.getByText('47%')).toBeVisible()
})

test('eases a CPU bar to a new reading, but not with reduced motion', async ({ page }) => {
  await page.goto('/')
  const fill = page
    .getByRole('region', { name: 'Systems' })
    .getByRole('meter', { name: 'Gateway CPU' })
    .locator('span')
  const easing = () =>
    fill.evaluate((node) => {
      const s = node.ownerDocument.defaultView!.getComputedStyle(node)
      return { property: s.transitionProperty, duration: parseFloat(s.transitionDuration) }
    })

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const { property, duration } = await easing()
  expect(property).toContain('width')
  expect(duration).toBeGreaterThan(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect((await easing()).duration).toBe(0)
})
