import { lightState } from '../src/domains/light/factories.ts'
import { fanState } from '../src/domains/fan/factories.ts'
import { scriptState } from '../src/domains/script/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { FAVORITES_KEY as KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

test.use({
  haOptions: {
    entities: [
      lightState({
        entity_id: 'light.kitchen',
        state: 'off',
        attributes: { friendly_name: 'Kitchen' },
      }),
      switchState({
        entity_id: 'switch.fan',
        state: 'on',
        attributes: { friendly_name: 'Desk fan' },
      }),
    ],
  },
})

test('tapping a light and a switch tile sends the service call and updates the tile', async ({
  page,
  mockHa,
}) => {
  mockHa.userData.set(KEY, { version: 1, entityIds: ['light.kitchen', 'switch.fan'] })
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Favorites' })
  const light = region.getByRole('button', { name: 'Kitchen' })
  const fan = region.getByRole('button', { name: 'Desk fan' })
  await expect(light).toBeEnabled()

  await light.click()
  await expect(light).toHaveAttribute('aria-pressed', 'true')
  await fan.click()
  await expect(fan).toHaveAttribute('aria-pressed', 'false')
  await expect(region.getByRole('listitem')).toHaveText(['KitchenOn', 'Desk fanOff'])

  const calls = mockHa.sent().filter((m) => m.type === 'call_service')
  expect(calls).toMatchObject([
    { domain: 'light', service: 'turn_on', target: { entity_id: 'light.kitchen' } },
    { domain: 'switch', service: 'turn_off', target: { entity_id: 'switch.fan' } },
  ])

  for (const button of [light, fan]) {
    const box = await button.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  await page.screenshot({ path: 'e2e/screenshots/controls.png' })
})

test.describe('when HA refuses the call', () => {
  test.use({
    haOptions: {
      entities: [
        lightState({ entity_id: 'light.kitchen', attributes: { friendly_name: 'Kitchen' } }),
      ],
      failServices: ['light.turn_on'],
    },
  })

  test('shows an inline retry message', async ({ page, mockHa }) => {
    mockHa.userData.set(KEY, { version: 1, entityIds: ['light.kitchen'] })
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    await region.getByRole('button', { name: 'Kitchen' }).click()
    await expect(region.getByRole('status')).toHaveText("Didn't work, tap to retry")
  })
})

test.describe('fan and script tiles', () => {
  test.use({
    haOptions: {
      entities: [
        fanState({ entity_id: 'fan.desk', attributes: { friendly_name: 'Desk' } }),
        scriptState({ entity_id: 'script.goodnight', attributes: { friendly_name: 'Goodnight' } }),
      ],
    },
  })

  test('tapping a fan toggles it and tapping a script runs it', async ({ page, mockHa }) => {
    mockHa.userData.set(KEY, { version: 1, entityIds: ['fan.desk', 'script.goodnight'] })
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    const fan = region.getByRole('button', { name: 'Desk' })
    const script = region.getByRole('button', { name: 'Goodnight' })
    await expect(fan).toBeEnabled()

    await fan.click()
    await expect(fan).toHaveAttribute('aria-pressed', 'true')
    await script.click()

    await expect
      .poll(() => mockHa.sent().filter((m) => m.type === 'call_service'))
      .toMatchObject([
        { domain: 'fan', service: 'turn_on', target: { entity_id: 'fan.desk' } },
        { domain: 'script', service: 'turn_on', target: { entity_id: 'script.goodnight' } },
      ])
  })
})
