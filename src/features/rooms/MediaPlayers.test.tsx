import { act, createEvent, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../config/testHomeConfig'
import { mediaPlayer } from '../../domains/media_player/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { renderWithHome } from '../../test/renderWithHome'
import { MediaPlayers } from './MediaPlayers'

// supported_features bits (HA MediaPlayerEntityFeature).
const PAUSE = 1
const PREVIOUS = 16
const NEXT = 32
const TURN_ON = 128
const TURN_OFF = 256
const VOLUME_SET = 4
const PLAY = 16384

const KITCHEN = 'media_player.kitchen_speaker'
const DEN = 'media_player.den'
const player = (state: string, attributes: Record<string, unknown> = {}, id = KITCHEN) =>
  mediaPlayer(state, {
    entity_id: id,
    attributes: { friendly_name: 'Kitchen speaker', ...attributes },
  })

const seed = (...entities: ReturnType<typeof mediaPlayer>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

const show = (ids: string[] = [KITCHEN], confirm: string[] = []) => {
  const fake = createFakeServiceGateway()
  renderWithHome(<MediaPlayers entityIds={ids} />, {
    gateway: fake.gateway,
    config: { ...testHomeConfig, confirm },
  })
  return fake
}

beforeEach(() => {
  vi.stubEnv('VITE_HA_URL', 'https://ha.example')
  setConnected()
})
afterEach(() => {
  vi.unstubAllEnvs()
  entityStore.reset()
  resetConnectionStatus()
})

describe('MediaPlayers', () => {
  it('shows a playing or paused player as a row with artwork, title, and artist', async () => {
    seed(
      player('playing', {
        media_title: 'Blue Train',
        media_artist: 'John Coltrane',
        entity_picture: '/api/media_player_proxy/kitchen?token=one',
      }),
      player(
        'paused',
        { friendly_name: 'Den speaker', media_title: 'So What', media_artist: 'Miles Davis' },
        'media_player.den',
      ),
    )
    show([KITCHEN, 'media_player.den'])
    const row = screen.getByRole('listitem', { name: 'Kitchen speaker' })
    expect(within(row).getByText('Blue Train')).toBeInTheDocument()
    expect(within(row).getByText('John Coltrane')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(row.querySelector('img')).toHaveAttribute(
        'src',
        'https://ha.example/api/media_player_proxy/kitchen?token=one',
      ),
    )
    expect(within(screen.getAllByRole('listitem')[1]).getByText('So What')).toBeInTheDocument()
  })

  it('sends media_pause on a playing row and media_play on a paused row', async () => {
    seed(
      player('playing', { supported_features: PAUSE | PLAY }),
      player('paused', { friendly_name: 'Den speaker', supported_features: PAUSE | PLAY }, DEN),
    )
    const { calls } = show([KITCHEN, DEN])
    await userEvent.click(screen.getByRole('button', { name: 'Pause Kitchen speaker' }))
    await userEvent.click(screen.getByRole('button', { name: 'Play Den speaker' }))
    expect(calls.map((c) => [c.service, c.target])).toEqual([
      ['media_pause', { entity_id: KITCHEN }],
      ['media_play', { entity_id: DEN }],
    ])
  })

  it('shows previous and next only when the player supports them', async () => {
    seed(
      player('playing', { supported_features: PAUSE | PREVIOUS | NEXT }),
      player('playing', { friendly_name: 'Den speaker', supported_features: PAUSE | NEXT }, DEN),
      player('playing', { friendly_name: 'Bath speaker' }, 'media_player.bath'),
    )
    const { calls } = show([KITCHEN, DEN, 'media_player.bath'])
    expect(screen.getByRole('button', { name: 'Previous track on Kitchen speaker' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next track on Kitchen speaker' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /Previous track on Den/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Next track on Den speaker' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /Bath speaker/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Next track on Den speaker' }))
    expect(calls.map((c) => c.service)).toEqual(['media_next_track'])
  })

  it('collapses idle, off, and standby players to chips with a power button', () => {
    seed(
      player('off', { supported_features: TURN_ON }),
      player('standby', { friendly_name: 'Den speaker', supported_features: TURN_ON }, DEN),
    )
    show([KITCHEN, DEN])
    for (const name of ['Kitchen speaker', 'Den speaker']) {
      const chip = screen.getByRole('listitem', { name })
      expect(within(chip).getByText(name)).toBeVisible()
      expect(chip).toHaveClass('media-chip')
      expect(within(chip).getByRole('button', { name: `Turn on ${name}` })).toBeVisible()
    }
    expect(screen.queryByText('Unknown title')).toBeNull()
  })

  it('shows an unavailable player as a chip without a power button', () => {
    seed(player('unavailable', { supported_features: TURN_ON | TURN_OFF }))
    show([KITCHEN, 'media_player.gone'])
    const chip = screen.getByRole('listitem', { name: 'Kitchen speaker' })
    expect(within(chip).getByText('Unavailable')).toBeVisible()
    expect(within(chip).queryByRole('button')).toBeNull()
    const missing = screen.getByRole('listitem', { name: 'media_player.gone' })
    expect(within(missing).getByText('Missing')).toBeVisible()
    expect(within(missing).queryByRole('button')).toBeNull()
  })

  it('turns a player on from its chip with an explicit turn_on', async () => {
    seed(player('off', { supported_features: TURN_ON | TURN_OFF }))
    const { calls } = show()
    await userEvent.click(screen.getByRole('button', { name: 'Turn on Kitchen speaker' }))
    expect(calls).toEqual([
      {
        domain: 'media_player',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: KITCHEN },
      },
    ])
  })

  it('turns an idle player off from its chip with an explicit turn_off', async () => {
    seed(
      player('idle', { supported_features: TURN_ON | TURN_OFF }),
      player('on', { friendly_name: 'Den speaker', supported_features: TURN_OFF }, DEN),
    )
    const { calls } = show([KITCHEN, DEN])
    expect(screen.queryByRole('button', { name: /Turn on/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Turn off Kitchen speaker' }))
    await userEvent.click(screen.getByRole('button', { name: 'Turn off Den speaker' }))
    expect(calls.map((c) => [c.service, c.target])).toEqual([
      ['turn_off', { entity_id: KITCHEN }],
      ['turn_off', { entity_id: DEN }],
    ])
  })

  it("shows no power button when the player doesn't support that direction", () => {
    seed(
      player('off', { supported_features: TURN_OFF }),
      player('idle', { friendly_name: 'Den speaker', supported_features: TURN_ON }, DEN),
      player('standby', { friendly_name: 'Bath speaker' }, 'media_player.bath'),
    )
    show([KITCHEN, DEN, 'media_player.bath'])
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('asks for a second tap before sending play, pause, or power to a confirm-listed player', async () => {
    seed(
      player('playing', { supported_features: PAUSE | NEXT }),
      player('off', { friendly_name: 'Den speaker', supported_features: TURN_ON }, DEN),
    )
    const { calls } = show([KITCHEN, DEN], [KITCHEN, DEN])
    await userEvent.click(screen.getByRole('button', { name: 'Pause Kitchen speaker' }))
    expect(screen.getByRole('button', { name: 'Confirm: pause Kitchen speaker' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Turn on Den speaker' }))
    expect(screen.getByRole('button', { name: 'Confirm: turn on Den speaker' })).toBeVisible()
    expect(calls).toEqual([])
    // Skipping a track is not confirm-gated.
    await userEvent.click(screen.getByRole('button', { name: 'Next track on Kitchen speaker' }))
    expect(calls.map((c) => c.service)).toEqual(['media_next_track'])
  })

  describe('volume', () => {
    const TRACK_WIDTH = 200
    // jsdom has no layout, so the volume track is given a width; a finger starting at `from`
    // moves through `path` ([x, y] points) and lets go.
    function drag(from: [number, number], path: [number, number][], { release = true } = {}) {
      const slider = screen.getByRole('slider', { name: 'Kitchen speaker volume' })
      const surface = slider.parentElement as HTMLElement
      surface.setPointerCapture = vi.fn()
      vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: TRACK_WIDTH,
        width: TRACK_WIDTH,
        top: 0,
        bottom: 44,
        height: 44,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
      const pointer = (
        type: 'pointerDown' | 'pointerMove' | 'pointerUp',
        [x, y]: [number, number],
      ) =>
        fireEvent(
          surface,
          createEvent[type](surface, { pointerId: 1, isPrimary: true, clientX: x, clientY: y }),
        )
      pointer('pointerDown', from)
      for (const point of path) pointer('pointerMove', point)
      if (release) pointer('pointerUp', path[path.length - 1] ?? from)
    }
    const seedPlaying = (attributes: Record<string, unknown> = {}) =>
      seed(player('playing', { supported_features: VOLUME_SET, volume_level: 0.5, ...attributes }))

    it('sends one volume_set with the dragged level on release', () => {
      seedPlaying()
      const fake = show()
      drag(
        [100, 20],
        [
          [140, 20],
          [160, 20],
        ],
      )
      expect(fake.calls).toEqual([
        {
          domain: 'media_player',
          service: 'volume_set',
          data: { volume_level: 0.8 },
          target: { entity_id: KITCHEN },
        },
      ])
    })

    it('shows the dragged volume while dragging', () => {
      seedPlaying()
      const fake = show()
      drag([100, 20], [[140, 20]], { release: false })
      expect(screen.getByRole('slider', { name: 'Kitchen speaker volume' })).toHaveAttribute(
        'aria-valuenow',
        '70',
      )
      expect(fake.calls).toEqual([])
    })

    it("shows a volume slider only when the player supports setting volume and isn't confirm-listed", () => {
      seedPlaying()
      const { unmount } = renderWithHome(<MediaPlayers entityIds={[KITCHEN]} />, {
        gateway: createFakeServiceGateway().gateway,
        config: { ...testHomeConfig, confirm: [KITCHEN] },
      })
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
      unmount()
      seedPlaying({ supported_features: PAUSE })
      show()
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it("shows the slider at HA's level and the muted state beside it", () => {
      seedPlaying({ is_volume_muted: true })
      show()
      expect(screen.getByRole('slider', { name: 'Kitchen speaker volume' })).toHaveAttribute(
        'aria-valuenow',
        '50',
      )
      expect(screen.getByRole('img', { name: 'Muted' })).toBeInTheDocument()
    })

    it('changes volume with arrow keys as a slider', async () => {
      seedPlaying()
      const fake = show()
      const user = userEvent.setup()
      screen.getByRole('slider', { name: 'Kitchen speaker volume' }).focus()
      await user.keyboard('{ArrowRight}')
      await vi.waitFor(() => expect(fake.calls).toHaveLength(1))
      expect(fake.calls[0]).toMatchObject({
        service: 'volume_set',
        data: { volume_level: 0.6 },
      })
    })
  })
})
