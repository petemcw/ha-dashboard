import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { expect, test } from './fixtures.ts'

const SPEAKER = 'media_player.living_room_speaker'
const KITCHEN = 'media_player.kitchen_speaker'

const speaker = (state: string, attributes: Record<string, unknown> = {}) =>
  mediaPlayer(state, {
    entity_id: SPEAKER,
    attributes: { friendly_name: 'Living Room Speaker', ...attributes },
  })

test.use({
  haOptions: {
    entities: [
      speaker('playing', {
        media_title: 'Harvest Moon',
        media_artist: 'Neil Young',
        volume_level: 0.38,
      }),
      mediaPlayer('off', { entity_id: KITCHEN, attributes: { friendly_name: 'Kitchen Speaker' } }),
    ],
  },
})

test('shows what is playing, read-only, and follows the player', async ({ page, mockHa }) => {
  await page.goto('/')
  const card = page.getByRole('region', { name: 'Media', exact: true })
  await expect(card).toContainText('Harvest Moon')
  await expect(card).toContainText('Neil Young')
  await expect(card).toContainText('Living Room Speaker')
  await expect(card).toContainText('1 playing')
  await expect(card).toContainText('Kitchen Speaker · Off')
  await expect(card.getByRole('meter', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '38')
  await expect(card.getByRole('button')).toHaveCount(0)

  mockHa.setState(speaker('off'))
  await expect(card).toContainText('Nothing playing')
  await page.screenshot({ path: 'e2e/screenshots/media.png' })
})
