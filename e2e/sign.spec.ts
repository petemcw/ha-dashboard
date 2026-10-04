import { calmHouse } from '../src/features/home/attention/factories.ts'
import { lightState } from '../src/domains/light/factories.ts'
import { FAVORITES_KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

// Enough favorites that the phone page scrolls well past the sign.
const lights = Array.from({ length: 12 }, (_, i) =>
  lightState({ entity_id: `light.room_${i}`, attributes: { friendly_name: `Room ${i}` } }),
)

test.use({ haOptions: { entities: [...calmHouse(), ...lights] } })

test('keeps the house status and Settings in the top bar after scrolling past the sign', async ({
  page,
  mockHa,
}, testInfo) => {
  // The two-column tablet layout is too short to scroll the sign away.
  test.skip(testInfo.project.name !== 'phone', 'phone layout only')
  mockHa.userData.set(FAVORITES_KEY, { version: 1, entityIds: lights.map((l) => l.entity_id) })
  await page.goto('/')
  const bar = page.getByRole('banner')
  await expect(page.getByText('All quiet at home.')).toBeVisible()
  await expect(bar).not.toContainText('All quiet at home.')
  await page.mouse.wheel(0, 3000)
  await expect(bar).toContainText('All quiet at home.')
  await bar.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
})
