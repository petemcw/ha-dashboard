import { describe, expect, it } from 'vitest'
import { mediaPlayer } from './factories'
import { mediaPlayerViewModel } from './viewModel'

const NOTHING = {
  pause: false,
  play: false,
  previous: false,
  next: false,
  volumeSet: false,
  turnOn: false,
  turnOff: false,
}

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
      supports: NOTHING,
    })
  })
})

describe('mediaPlayerViewModel details', () => {
  it('maps a playing media player to its title, artist, artwork, and volume', () => {
    const vm = mediaPlayerViewModel(
      mediaPlayer('playing', {
        attributes: {
          media_title: 'Song',
          media_artist: 'Band',
          entity_picture: '/api/media_player_proxy/media_player.living_room_tv?token=abc',
          volume_level: 0.355,
          is_volume_muted: true,
        },
      }),
      undefined,
      'https://ha.example',
    )
    expect(vm).toMatchObject({
      friendlyName: 'Living Room TV',
      title: 'Song',
      artist: 'Band',
      artworkUrl: 'https://ha.example/api/media_player_proxy/media_player.living_room_tv?token=abc',
      volumePercent: 36,
      muted: true,
    })
  })

  it('falls back from artist to album, then app name', () => {
    const album = mediaPlayer('playing', {
      attributes: { media_album_name: 'LP', app_name: 'App' },
    })
    const app = mediaPlayer('playing', { attributes: { app_name: 'App' } })
    expect(mediaPlayerViewModel(album).artist).toBe('LP')
    expect(mediaPlayerViewModel(app).artist).toBe('App')
  })

  it('leaves artwork, volume, and title undefined when absent or without an HA URL', () => {
    const bare = mediaPlayerViewModel(mediaPlayer('playing'), undefined, 'https://ha.example')
    expect(bare.artworkUrl).toBeUndefined()
    expect(bare.volumePercent).toBeUndefined()
    expect(bare.title).toBeUndefined()
    const noUrl = mediaPlayer('playing', { attributes: { entity_picture: '/x' } })
    expect(mediaPlayerViewModel(noUrl).artworkUrl).toBeUndefined()
  })

  it('reads what a player supports from its supported_features bits', () => {
    // 1 pause + 4 volume set + 32 next track + 256 turn off + 16384 play
    const vm = mediaPlayerViewModel(
      mediaPlayer('playing', { attributes: { supported_features: 1 + 4 + 32 + 256 + 16384 } }),
    )
    expect(vm.supports).toEqual({
      pause: true,
      play: true,
      previous: false,
      next: true,
      volumeSet: true,
      turnOn: false,
      turnOff: true,
    })
  })

  it('supports nothing when supported_features is absent', () => {
    expect(mediaPlayerViewModel(mediaPlayer('playing')).supports).toEqual(NOTHING)
  })
})
