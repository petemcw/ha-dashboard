import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { sceneState } from '../src/domains/scene/factories.ts'
import { expect, test } from './fixtures.ts'

test.use({
  haOptions: {
    entities: [
      sceneState({ entity_id: 'scene.living_room_movie' }),
      sceneState({ entity_id: 'scene.living_room_bright' }),
    ],
  },
})

test('suggests a scene for the Apple TV state, enabled, and follows live changes', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(mediaPlayer('playing'))
  await page.goto('/')
  const strip = page.getByRole('region', { name: 'Suggested' })
  const mood = strip.getByRole('button', { name: 'Media viewing mood' })
  await expect(mood).toBeEnabled()
  // The header says why: the player's state.
  await expect(strip.getByText('Playing', { exact: true })).toBeVisible()

  mockHa.setState(mediaPlayer('paused'))
  await expect(strip.getByRole('button', { name: 'Bright up lights' })).toBeVisible()
  await expect(mood).toBeHidden()
  await expect(strip.getByText('Paused', { exact: true })).toBeVisible()

  mockHa.setState(mediaPlayer('idle'))
  await expect(strip).toBeHidden()
  await page.screenshot({ path: `e2e/screenshots/suggestions-${test.info().project.name}.png` })
})
