import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { expect, test } from './fixtures.ts'

test('suggests a scene for the Apple TV state, disabled, and follows live changes', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(mediaPlayer('playing'))
  await page.goto('/')
  const strip = page.getByRole('region', { name: 'Suggestions' })
  const mood = strip.getByRole('button', { name: 'Media viewing mood' })
  await expect(mood).toBeDisabled()
  await expect(mood).toHaveAccessibleDescription('Available when controls are enabled')

  mockHa.setState(mediaPlayer('paused'))
  await expect(strip.getByRole('button', { name: 'Bright up lights' })).toBeVisible()
  await expect(mood).toBeHidden()

  mockHa.setState(mediaPlayer('idle'))
  await expect(strip).toBeHidden()
  await page.screenshot({ path: `e2e/screenshots/suggestions-${test.info().project.name}.png` })
})
