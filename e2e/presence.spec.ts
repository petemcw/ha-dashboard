import { personState } from '../src/domains/person/factories.ts'
import { expect, test } from './fixtures.ts'

const person = (id: string, name: string, state: string, picture?: string) =>
  personState({
    entity_id: `person.${id}`,
    friendly_name: name,
    state,
    entity_picture: picture,
  })

test.use({
  haOptions: {
    entities: [
      person('alex_rivera', 'Alex Rivera', 'home', '/api/image/serve/a/512x512'),
      person('sam_rivera', 'Sam Rivera', 'not_home'),
      person('jordan_rivera', 'Jordan Rivera', 'Work'),
      person('casey_rivera', 'Casey Rivera', 'unknown'),
      person('taylor_rivera', 'Taylor Rivera', 'home'),
      // morgan_rivera is deliberately absent from HA.
    ],
  },
})

test('shows everyone with presence, zone, unknown, missing, and initials fallback', async ({
  page,
}) => {
  await page.goto('/')
  const people = page.getByRole('region', { name: 'People' })
  await expect(people.getByRole('listitem', { name: 'Alex Rivera, home' })).toBeVisible()
  await expect(people.getByRole('listitem', { name: 'Sam Rivera, away' })).toBeVisible()
  await expect(people.getByRole('listitem', { name: 'Jordan Rivera, at Work' })).toBeVisible()
  await expect(
    people.getByRole('listitem', { name: 'Casey Rivera, location unknown' }),
  ).toBeVisible()
  await expect(people.getByRole('listitem', { name: /morgan rivera, missing/i })).toBeVisible()
  // The mock 404s HA-origin pictures, so Alex falls back to initials.
  await expect(
    people.getByRole('listitem', { name: 'Alex Rivera, home' }).getByText('AR'),
  ).toBeVisible()
  const box = await people.getByRole('listitem').first().boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})
