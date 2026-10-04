import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { sceneState } from '../src/domains/scene/factories.ts'
import { FAVORITES_KEY as KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'

test.use({
  haOptions: {
    entities: [
      sceneState({ entity_id: 'scene.living_room_movie' }),
      sceneState({ entity_id: 'scene.living_room_bright' }),
      sceneState({ entity_id: 'scene.cozy', attributes: { friendly_name: 'Cozy' } }),
    ],
  },
})

test('tapping the playing suggestion activates its scene with the transition', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(mediaPlayer('playing'))
  await page.goto('/')
  await page
    .getByRole('region', { name: 'Suggested' })
    .getByRole('button', { name: 'Media viewing mood' })
    .click()
  await expect
    .poll(() => mockHa.sent().filter((m) => m.type === 'call_service'))
    .toMatchObject([
      {
        domain: 'scene',
        service: 'turn_on',
        service_data: { transition: 5 },
        target: { entity_id: 'scene.living_room_movie' },
      },
    ])
})

test('tapping a scene favorite tile activates the scene', async ({ page, mockHa }) => {
  mockHa.userData.set(KEY, { version: 1, entityIds: ['scene.cozy'] })
  await page.goto('/')
  const tile = page.getByRole('region', { name: 'Favorites' }).getByRole('button', { name: 'Cozy' })
  await expect(tile).toBeEnabled()
  await tile.click()
  await expect
    .poll(() => mockHa.sent().filter((m) => m.type === 'call_service'))
    .toMatchObject([{ domain: 'scene', service: 'turn_on', target: { entity_id: 'scene.cozy' } }])
  const box = await tile.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test.describe('when HA refuses the scene', () => {
  test.use({
    haOptions: {
      entities: [
        sceneState({ entity_id: 'scene.living_room_movie' }),
        sceneState({ entity_id: 'scene.living_room_bright' }),
      ],
      failServices: ['scene.turn_on'],
    },
  })

  test('the suggestion shows an inline retry message', async ({ page, mockHa }) => {
    mockHa.setState(mediaPlayer('playing'))
    await page.goto('/')
    const strip = page.getByRole('region', { name: 'Suggested' })
    await strip.getByRole('button', { name: 'Media viewing mood' }).click()
    await expect(strip.getByRole('status')).toHaveText("Didn't work, tap to retry")
  })
})
