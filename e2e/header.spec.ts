import { calmHouse } from '../src/features/home/attention/factories.ts'
import { lightState } from '../src/domains/light/factories.ts'
import { personState } from '../src/domains/person/factories.ts'
import { FAVORITES_KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

// Enough favorites that the phone page scrolls well past the header.
const lights = Array.from({ length: 12 }, (_, i) =>
  lightState({ entity_id: `light.room_${i}`, attributes: { friendly_name: `Room ${i}` } }),
)

const people = [
  personState({ entity_id: 'person.alex_rivera', friendly_name: 'Alex Rivera', state: 'home' }),
  personState({ entity_id: 'person.blair_kim', friendly_name: 'Blair Kim', state: 'not_home' }),
]

test.use({ haOptions: { entities: [...calmHouse(), ...lights, ...people] } })

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
  // Scroll only once the last favorite has rendered, or the page may be too short to.
  await expect(page.getByRole('button', { name: 'Room 11' })).toBeVisible()
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

test('hides the house name and the date in the header on a phone', async ({ page }) => {
  test.skip(test.info().project.name !== 'phone', 'phone layout only')
  await page.goto('/')
  const bar = page.getByRole('banner')
  await expect(bar.getByText(/Good (morning|afternoon|evening)/)).toBeVisible()
  await expect(bar.locator('time')).toBeVisible()
  await expect(bar.getByText('Maple Frontier')).toBeHidden()
  await expect(bar.locator('.header-bar__date')).toBeHidden()
})

for (const [label, width, height] of [
  ['tablet', 820, 1180],
  ['wall-tablet', 1180, 820],
] as const) {
  test(`shows the house name and the date in the header at ${label} size`, async ({ page }) => {
    test.skip(test.info().project.name !== 'tablet')
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const bar = page.getByRole('banner')
    await expect(bar.getByText('Maple Frontier')).toBeVisible()
    // "Saturday, Oct 3": the weekday, the short month, and the day.
    await expect(bar.getByText(/^[A-Z][a-z]+day, [A-Z][a-z]{2} \d{1,2}$/)).toBeVisible()
  })
}

// The bar is one slim row on a tablet or wall screen, and two on a phone (the faces get a
// row of their own). The old sign was well over 150 px. Afternoon has the longest
// greeting, which must stay on one line.
// The longest greeting beside an everyday time and the widest one.
for (const [hour, minute] of [
  [15, 30],
  [12, 58],
]) {
  test(`keeps the header slim at ${hour}:${minute}`, async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 9, 3, hour, minute) })
    await page.goto('/')
    const bar = page.getByRole('banner')
    await expect(bar.getByText('Good afternoon')).toBeVisible()
    await page.evaluate('document.fonts.ready')
    await expect(bar.getByRole('region', { name: 'People' })).toBeVisible()
    const ceiling = test.info().project.name === 'phone' ? 100 : 68
    expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(ceiling)
    if (test.info().project.name === 'tablet') {
      await page.setViewportSize({ width: 820, height: 1180 })
      await expect.poll(async () => (await bar.boundingBox())!.height).toBeLessThanOrEqual(68)
    }
  })
}

test('sets the clock in fixed-width digits, so the time never nudges its neighbours', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('banner').locator('time')).toHaveCSS(
    'font-variant-numeric',
    'tabular-nums',
  )
})
