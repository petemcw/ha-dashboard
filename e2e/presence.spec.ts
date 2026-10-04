import { testHomeConfig } from '../src/config/testHomeConfig.ts'
import { personState } from '../src/domains/person/factories.ts'
import { expect, test } from './fixtures.ts'

const person = (id: string, name: string, state: string, picture?: string) =>
  personState({
    entity_id: `person.${id}`,
    friendly_name: name,
    state,
    entity_picture: picture,
  })

const household = [
  person('sam_quinn', 'Sam Quinn', 'unknown'),
  person('alex_rivera', 'Alex Rivera', 'home', '/api/image/serve/a/512x512'),
  person('blair_kim', 'Blair Kim', 'not_home'),
  person('casey_lee', 'Casey Lee', 'Work'),
]

test.describe('people from Home Assistant', () => {
  test.use({ haOptions: { entities: household } })

  test('shows every person with presence, zone, unknown, and initials fallback, sorted by name', async ({
    page,
  }) => {
    await page.goto('/')
    const people = page.getByRole('region', { name: 'People' })
    await expect(people.getByRole('listitem', { name: 'Alex Rivera, home' })).toBeVisible()
    await expect(people.getByRole('listitem', { name: 'Blair Kim, away' })).toBeVisible()
    await expect(people.getByRole('listitem', { name: 'Casey Lee, at Work' })).toBeVisible()
    await expect(
      people.getByRole('listitem', { name: 'Sam Quinn, location unknown' }),
    ).toBeVisible()
    const order = await people
      .getByRole('listitem')
      .evaluateAll((items) => items.map((li) => li.getAttribute('aria-label')?.split(',')[0]))
    expect(order).toEqual(['Alex Rivera', 'Blair Kim', 'Casey Lee', 'Sam Quinn'])
    // The mock 404s HA-origin pictures, so Alex falls back to initials.
    await expect(
      people.getByRole('listitem', { name: 'Alex Rivera, home' }).getByText('AR'),
    ).toBeVisible()
    await expect(page.getByRole('banner').getByRole('region', { name: 'People' })).toBeVisible()
  })

  test('lays out the avatars side by side without overlapping', async ({ page }) => {
    await page.goto('/')
    const items = page.getByRole('region', { name: 'People' }).getByRole('listitem')
    await expect(items).toHaveCount(4)
    const boxes = await items.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
      }),
    )
    for (const box of boxes) expect(box.right - box.left).toBe(32)
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        expect(apart).toBe(true)
      }
    }
  })
})

test.describe('people listed in home.json', () => {
  test.use({
    haOptions: {
      entities: household,
      // ghost_person is deliberately absent from HA.
      homeConfig: {
        ...testHomeConfig,
        people: ['person.casey_lee', 'person.ghost_person', 'person.alex_rivera'],
      },
    },
  })

  test('shows only the listed people, in that order, and a missing one as missing', async ({
    page,
  }) => {
    await page.goto('/')
    const people = page.getByRole('region', { name: 'People' })
    await expect(people.getByRole('listitem', { name: 'ghost person, missing' })).toBeVisible()
    const order = await people
      .getByRole('listitem')
      .evaluateAll((items) => items.map((li) => li.getAttribute('aria-label')?.split(',')[0]))
    expect(order).toEqual(['Casey Lee', 'ghost person', 'Alex Rivera'])
  })
})

test.describe('a large household on a phone', () => {
  // Eight people don't fit one row at phone width, so the row has to wrap.
  test.use({
    haOptions: {
      entities: Array.from({ length: 8 }, (_, i) =>
        person(`member_${i + 1}`, `Member ${i + 1}`, 'home'),
      ),
    },
  })

  test('shows everyone on screen without scrolling the row sideways', async ({ page }) => {
    await page.goto('/')
    const people = page.getByRole('region', { name: 'People' })
    await expect(people.getByRole('listitem')).toHaveCount(8)
    const width = page.viewportSize()!.width
    const rights = await people
      .getByRole('listitem')
      .evaluateAll((items) => items.map((li) => li.getBoundingClientRect().right))
    for (const right of rights) expect(right).toBeLessThanOrEqual(width)
    const row = people.getByRole('list')
    expect(await row.evaluate((ul) => ul.scrollWidth <= ul.clientWidth)).toBe(true)
  })
})
