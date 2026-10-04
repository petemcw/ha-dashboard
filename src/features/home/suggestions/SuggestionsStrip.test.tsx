import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { afterEach, describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket'
import { mediaPlayer } from '../../../domains/media_player/factories'
import { sceneState } from '../../../domains/scene/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { SuggestionsStrip } from './SuggestionsStrip'

afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
})

const { playing, paused } = testHomeConfig.suggestions
const SCENES = [playing.scene, paused.scene].map((entity_id) => sceneState({ entity_id }))

// The suggestion scenes are seeded unless a test passes its own: a button whose scene HA
// doesn't have is disabled.
function seed(state?: string, scenes: HassEntity[] = SCENES) {
  const entities: HassEntities = Object.fromEntries(scenes.map((s) => [s.entity_id, s]))
  if (state) entities[testHomeConfig.suggestions.player] = mediaPlayer(state)
  act(() => entityStore.setEntities(entities))
}

describe('suggestions strip', () => {
  it('suggests the media viewing mood while the Apple TV is playing', () => {
    seed('playing')
    render(<SuggestionsStrip />)
    expect(screen.getByRole('region', { name: 'Suggested' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bright up lights' })).not.toBeInTheDocument()
  })

  it('suggests brighter lights while the Apple TV is paused', () => {
    seed('paused')
    render(<SuggestionsStrip />)
    expect(screen.getByRole('button', { name: 'Bright up lights' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Media viewing mood' })).not.toBeInTheDocument()
  })

  it.each([
    ['playing', 'Playing'],
    ['paused', 'Paused'],
  ])('shows a header chip saying the player is %s', (state, text) => {
    seed(state)
    render(<SuggestionsStrip />)
    const header = screen.getByRole('heading', { name: 'Suggested' }).parentElement!
    expect(within(header).getByText(text)).toBeInTheDocument()
  })

  it.each(['idle', 'off', 'standby', 'unavailable', 'unknown', undefined])(
    'shows no suggestions while the Apple TV is %s',
    (state) => {
      seed(state)
      render(<SuggestionsStrip />)
      expect(screen.queryByRole('region', { name: 'Suggested' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    },
  )

  it('sends scene.turn_on with the transition when the playing suggestion is tapped', async () => {
    seed('playing')
    setConnected()
    const fake = createFakeServiceGateway()
    render(<SuggestionsStrip />, { gateway: fake.gateway })
    const button = screen.getByRole('button', { name: 'Media viewing mood' })
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(fake.calls).toEqual([
      {
        domain: 'scene',
        service: 'turn_on',
        data: { transition: 5 },
        target: { entity_id: 'scene.living_room_movie' },
      },
    ])
  })

  it('sends scene.turn_on without a transition when the suggestion has none', async () => {
    seed('paused')
    setConnected()
    const fake = createFakeServiceGateway()
    render(<SuggestionsStrip />, { gateway: fake.gateway })
    await userEvent.click(screen.getByRole('button', { name: 'Bright up lights' }))
    expect(fake.calls).toEqual([
      {
        domain: 'scene',
        service: 'turn_on',
        data: undefined,
        target: { entity_id: 'scene.living_room_bright' },
      },
    ])
  })

  it('shows "Didn\'t work, tap to retry" on a suggestion when the scene fails', async () => {
    seed('playing')
    setConnected()
    const fake = createFakeServiceGateway()
    render(<SuggestionsStrip />, { gateway: fake.gateway })
    await userEvent.click(screen.getByRole('button', { name: 'Media viewing mood' }))
    await act(async () => fake.reject(new ServiceCallError('rejected')))
    expect(screen.getByRole('status')).toHaveTextContent("Didn't work, tap to retry")
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeEnabled()
  })

  it.each([
    ['missing', []],
    ['unavailable', [sceneState({ entity_id: playing.scene, state: 'unavailable' })]],
  ])('disables a suggestion whose scene is %s', (_, scenes) => {
    seed('playing', scenes)
    setConnected()
    render(<SuggestionsStrip />, { gateway: createFakeServiceGateway().gateway })
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeDisabled()
  })

  it('enables a suggestion whose scene has never been activated', () => {
    seed('playing', [sceneState({ entity_id: playing.scene, state: 'unknown' })])
    setConnected()
    render(<SuggestionsStrip />, { gateway: createFakeServiceGateway().gateway })
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeEnabled()
  })

  it('disables suggestion buttons while the connection is not connected', () => {
    seed('playing')
    render(<SuggestionsStrip />, { gateway: createFakeServiceGateway().gateway })
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeDisabled()
  })
})
