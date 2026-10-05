import { mdiMusic } from '@mdi/js'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mediaPlayer } from '../../../domains/media_player/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { renderWithHome } from '../../../test/renderWithHome'
import { MediaCard } from './MediaCard'

beforeEach(() => vi.stubEnv('VITE_HA_URL', 'https://ha.example'))
afterEach(() => {
  entityStore.reset()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const SPEAKER = 'media_player.living_room_speaker'
const KITCHEN = 'media_player.kitchen_speaker'

const player = (
  id: string,
  name: string,
  state: string,
  attributes: Record<string, unknown> = {},
) => mediaPlayer(state, { entity_id: id, attributes: { friendly_name: name, ...attributes } })

const load = (...entities: ReturnType<typeof mediaPlayer>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

const card = () => screen.getByRole('region', { name: 'Media' })

describe('media card', () => {
  it('renders the media card label with an MDI icon', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'playing', { media_title: 'T' }))
    renderWithHome(<MediaCard />)
    await screen.findByText('T')
    expect(card().querySelector('svg.card__icon path')?.getAttribute('d')).toBe(mdiMusic)
  })

  it('features the playing player with its title, artist, and room', async () => {
    load(
      player(KITCHEN, 'Kitchen Speaker', 'off'),
      player(SPEAKER, 'Living Room Speaker', 'playing', {
        media_title: 'Harvest Moon',
        media_artist: 'Neil Young',
        volume_level: 0.38,
      }),
    )
    renderWithHome(<MediaCard />)
    const c = within(await screen.findByRole('region', { name: 'Media' }))
    expect(c.getByText('Harvest Moon')).toBeInTheDocument()
    expect(c.getByText('Neil Young')).toBeInTheDocument()
    expect(c.getByText('Living Room Speaker')).toBeInTheDocument()
    const volume = c.getByRole('meter', { name: 'Volume' })
    expect(volume).toHaveAttribute('aria-valuenow', '38')
    expect(c.queryByRole('button')).not.toBeInTheDocument()
    expect(c.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('features a paused player when nothing is playing', async () => {
    load(
      player(SPEAKER, 'Living Room Speaker', 'idle'),
      player(KITCHEN, 'Kitchen Speaker', 'paused', { media_title: 'Held Song' }),
    )
    renderWithHome(<MediaCard />)
    expect(await screen.findByText('Held Song')).toBeInTheDocument()
    expect(screen.queryByText('Nothing playing')).not.toBeInTheDocument()
  })

  it('shows Nothing playing when no configured player is playing or paused', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'off'), player(KITCHEN, 'Kitchen Speaker', 'idle'))
    renderWithHome(<MediaCard />)
    expect(await screen.findByText('Nothing playing')).toBeInTheDocument()
  })

  it('shows the other configured players as state chips', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'playing', { media_title: 'A' }))
    renderWithHome(<MediaCard />)
    // The kitchen speaker is configured but HA has no such entity.
    expect(await screen.findByText('Kitchen Speaker · Missing')).toBeInTheDocument()
    expect(screen.queryByText(/Living Room Speaker · /)).not.toBeInTheDocument()
  })

  it('shows how many players are playing in the card header', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'playing'), player(KITCHEN, 'K', 'playing'))
    renderWithHome(<MediaCard />)
    expect(await screen.findByText('2 playing')).toBeInTheDocument()
  })

  it('shows no playing chip when nothing is playing', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'paused'))
    renderWithHome(<MediaCard />)
    await screen.findByRole('region', { name: 'Media' })
    expect(screen.queryByText(/playing$/)).not.toBeInTheDocument()
  })

  it('hides the Media card when home config has no media section', async () => {
    load(player(SPEAKER, 'Living Room Speaker', 'playing'))
    const { container } = renderWithHome(<MediaCard />, {
      config: { ...testHomeConfig, media: undefined },
    })
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the artwork placeholder until the HA URL is known', async () => {
    // No dev URL, so the HA URL comes from /config.json, which answers when the test says.
    vi.stubEnv('VITE_HA_URL', '')
    let answer: (r: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
    )
    load(
      player(SPEAKER, 'Living Room Speaker', 'playing', {
        media_title: 'T',
        entity_picture: '/api/media_player_proxy/x?token=one',
      }),
    )
    const { container } = renderWithHome(<MediaCard />)
    await screen.findByText('T')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.media-art svg')).not.toBeNull()

    await act(async () => answer(Response.json({ haUrl: 'https://ha.example' })))
    await vi.waitFor(() =>
      expect(container.querySelector('.media-art img')?.getAttribute('src')).toBe(
        'https://ha.example/api/media_player_proxy/x?token=one',
      ),
    )
  })

  it('tries the artwork again when the track picture changes after a failed load', async () => {
    const art = (token: string) => ({
      media_title: 'T',
      entity_picture: `/api/media_player_proxy/${SPEAKER}?token=${token}`,
    })
    load(player(SPEAKER, 'Living Room Speaker', 'playing', art('one')))
    const { container } = renderWithHome(<MediaCard />)
    const img = await vi.waitFor(() => {
      const el = container.querySelector('img')
      expect(el).not.toBeNull()
      return el!
    })
    expect(img).toHaveAttribute('alt', '')
    expect(img.getAttribute('src')).toBe(
      `https://ha.example/api/media_player_proxy/${SPEAKER}?token=one`,
    )
    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    load(player(SPEAKER, 'Living Room Speaker', 'playing', art('two')))
    expect(container.querySelector('img')?.getAttribute('src')).toContain('token=two')
    expect(card()).toBeInTheDocument()
  })
})
