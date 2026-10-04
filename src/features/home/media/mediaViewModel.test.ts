import { describe, expect, it } from 'vitest'
import { mediaPlayer } from '../../../domains/media_player/factories'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { mediaCardViewModel } from './mediaViewModel'

const SPEAKER = 'media_player.living_room_speaker'
const OTHER = 'media_player.family_room_tv'

// The other player's chip, next to a featured speaker that is playing.
function chipFor(state: string | undefined): string {
  const speaker = mediaPlayer('playing', { entity_id: SPEAKER })
  const other =
    state === undefined
      ? undefined
      : mediaPlayer(state, { entity_id: OTHER, attributes: { friendly_name: 'Family room TV' } })
  const { chips } = mediaCardViewModel([
    mediaPlayerViewModel(speaker),
    mediaPlayerViewModel(other, OTHER),
  ])
  return chips[0].label
}

describe('media card chips', () => {
  it.each([
    ['off', 'Family room TV · Off'],
    ['standby', 'Family room TV · Off'],
    ['idle', 'Family room TV · Idle'],
    ['buffering', 'Family room TV · Idle'],
    ['paused', 'Family room TV · Paused'],
    ['playing', 'Family room TV · Playing'],
    ['unavailable', 'Family room TV · Unavailable'],
    ['unknown', 'Family room TV · Unavailable'],
  ])('labels a player that HA reports as %s "%s"', (state, label) => {
    expect(chipFor(state)).toBe(label)
  })

  it('labels a configured player HA does not have as Missing, named from its entity ID', () => {
    expect(chipFor(undefined)).toBe('Family Room Tv · Missing')
  })
})
