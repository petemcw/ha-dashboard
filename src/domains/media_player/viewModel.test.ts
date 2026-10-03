import { describe, expect, it } from 'vitest'
import { mediaPlayer } from './factories'
import { mediaPlayerViewModel } from './viewModel'

describe('mediaPlayerViewModel', () => {
  it.each(['playing', 'paused', 'idle', 'off', 'standby', 'unavailable', 'unknown'])(
    'reports %s playback as is',
    (state) => {
      expect(mediaPlayerViewModel(mediaPlayer(state)).playback).toBe(state)
    },
  )

  it('reports any other HA state as other', () => {
    expect(mediaPlayerViewModel(mediaPlayer('buffering')).playback).toBe('other')
    expect(mediaPlayerViewModel(mediaPlayer('on')).playback).toBe('other')
  })

  it('reports a player HA does not have as missing', () => {
    expect(mediaPlayerViewModel(undefined, 'media_player.gone')).toEqual({
      entity_id: 'media_player.gone',
      playback: 'missing',
    })
  })
})
