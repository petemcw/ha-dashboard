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
    const box = await people.getByRole('listitem').first().boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
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
