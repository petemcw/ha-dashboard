import { lightState } from '../src/domains/light/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { FAVORITES_KEY as KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'
import { sendFromAnotherClient } from './haMock.ts'

const saved = (...entityIds: string[]) => ({ version: 1, entityIds })

test.use({
  haOptions: {
    entities: [
      lightState({
        entity_id: 'light.kitchen',
        state: 'on',
        attributes: { friendly_name: 'Kitchen', brightness: 128 },
      }),
      switchState({
        entity_id: 'switch.fan',
        state: 'off',
        attributes: { friendly_name: 'Desk fan' },
      }),
    ],
  },
})

test('shows an Add favorites prompt that opens settings when nothing is saved', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Favorites' })
  await expect(region).toContainText('No favorites yet')
  await region.getByRole('button', { name: 'Add favorites' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
})

test('shows saved favorites in order with state, and a missing one as missing', async ({
  page,
  mockHa,
}) => {
  mockHa.userData.set(KEY, saved('switch.fan', 'light.kitchen', 'light.gone'))
  await page.goto('/')
  const items = page.getByRole('region', { name: 'Favorites' }).getByRole('listitem')
  await expect(items).toHaveText(['Desk fanOff', 'KitchenOn, 50%', 'light.goneMissing'])
  await page.screenshot({ path: 'e2e/screenshots/favorites.png' })
})

test('shows favorites saved on another device without a reload', async ({ page, mockHa }) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Favorites' })
  await expect(region).toContainText('No favorites yet')
  await sendFromAnotherClient(page, {
    type: 'frontend/set_user_data',
    key: KEY,
    value: saved('light.kitchen'),
  })
  await expect(region.getByRole('listitem')).toHaveText(['KitchenOn, 50%'])
  expect(mockHa.userData.get(KEY)).toEqual(saved('light.kitchen'))
})

test('treats a stored value with an unknown version as no favorites', async ({ page, mockHa }) => {
  mockHa.userData.set(KEY, { version: 9, entityIds: ['light.kitchen'] })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Favorites' })).toContainText('No favorites yet')
  expect(mockHa.sent().filter((m) => m.type === 'frontend/set_user_data')).toHaveLength(0)
})
