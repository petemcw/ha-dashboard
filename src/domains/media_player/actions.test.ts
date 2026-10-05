import { describe, expect, it } from 'vitest'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { nextTrack, pause, play, previousTrack, setPower, setVolume } from './actions'

const ID = 'media_player.kitchen_speaker'
const sent = (run: (g: ReturnType<typeof createFakeServiceGateway>['gateway']) => unknown) => {
  const fake = createFakeServiceGateway()
  void run(fake.gateway)
  return fake.calls
}
const call = (service: string) => [
  { domain: 'media_player', service, data: undefined, target: { entity_id: ID } },
]

describe('media_player actions', () => {
  it('sends explicit transport services targeting the player', () => {
    expect(sent((g) => play(g, ID))).toEqual(call('media_play'))
    expect(sent((g) => pause(g, ID))).toEqual(call('media_pause'))
    expect(sent((g) => nextTrack(g, ID))).toEqual(call('media_next_track'))
    expect(sent((g) => previousTrack(g, ID))).toEqual(call('media_previous_track'))
  })

  it('sends an explicit turn_on or turn_off, never a toggle', () => {
    expect(sent((g) => setPower(g, ID, true))).toEqual(call('turn_on'))
    expect(sent((g) => setPower(g, ID, false))).toEqual(call('turn_off'))
  })

  it('sends volume_set with the percent as a 0 to 1 volume_level', () => {
    expect(sent((g) => setVolume(g, ID, 35))).toEqual([
      {
        domain: 'media_player',
        service: 'volume_set',
        data: { volume_level: 0.35 },
        target: { entity_id: ID },
      },
    ])
  })
})
