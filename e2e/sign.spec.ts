import { calmHouse } from '../src/features/home/attention/factories.ts'
import { lightState } from '../src/domains/light/factories.ts'
import { FAVORITES_KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

// Enough favorites that the phone page scrolls well past the header.
const lights = Array.from({ length: 12 }, (_, i) =>
  lightState({ entity_id: `light.room_${i}`, attributes: { friendly_name: `Room ${i}` } }),
)

test.use({ haOptions: { entities: [...calmHouse(), ...lights] } })

test('keeps the header pinned to the top after scrolling on a phone', async ({
  page,
  mockHa,
}, testInfo) => {
  // The two-column tablet layout is too short to scroll.
  test.skip(testInfo.project.name !== 'phone', 'phone layout only')
  mockHa.userData.set(FAVORITES_KEY, { version: 1, entityIds: lights.map((l) => l.entity_id) })
  await page.goto('/')
  const bar = page.getByRole('banner')
  await expect(bar.getByRole('button', { name: 'Settings' })).toBeVisible()
  await page.mouse.wheel(0, 3000)
  await expect.poll(() => page.evaluate('window.scrollY') as Promise<number>).toBeGreaterThan(500)
  await expect.poll(async () => (await bar.boundingBox())?.y).toBe(0)
  await bar.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
})

test('no longer shows a house status sentence', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner').getByText(/Good (morning|afternoon|evening)/)).toBeVisible()
  await expect(page.getByText('All quiet at home.')).toHaveCount(0)
})
