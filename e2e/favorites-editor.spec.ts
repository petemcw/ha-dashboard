import { lightState } from '../src/domains/light/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { FAVORITES_KEY as KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

const saved = (...entityIds: string[]) => ({ version: 1, entityIds })

test.use({
  haOptions: {
    entities: [
      lightState({ entity_id: 'light.kitchen', attributes: { friendly_name: 'Kitchen' } }),
      switchState({ entity_id: 'switch.fan', attributes: { friendly_name: 'Desk fan' } }),
    ],
  },
})

test('adds, reorders, and removes favorites and saves them to the user data', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  const dialog = page.getByRole('dialog')
  const search = dialog.getByRole('searchbox')

  await search.fill('kitchen')
  await dialog.getByRole('button', { name: 'Add Kitchen' }).click()
  await expect.poll(() => mockHa.userData.get(KEY)).toEqual(saved('light.kitchen'))

  await search.fill('fan')
  await dialog.getByRole('button', { name: 'Add Desk fan' }).click()
  await expect.poll(() => mockHa.userData.get(KEY)).toEqual(saved('light.kitchen', 'switch.fan'))

  await dialog.getByRole('button', { name: 'Move up Desk fan' }).click()
  await expect.poll(() => mockHa.userData.get(KEY)).toEqual(saved('switch.fan', 'light.kitchen'))

  await dialog.getByRole('button', { name: 'Remove Desk fan' }).click()
  await expect.poll(() => mockHa.userData.get(KEY)).toEqual(saved('light.kitchen'))
  await expect(
    dialog.getByRole('list', { name: 'Your favorites' }).getByRole('listitem'),
  ).toHaveCount(1)
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
})
