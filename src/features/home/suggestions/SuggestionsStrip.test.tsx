import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { ServiceCallError } from '../../../infrastructure/serviceGateway/serviceGateway'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { afterEach, describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { mediaPlayer } from '../../../domains/media_player/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { SuggestionsStrip } from './SuggestionsStrip'

afterEach(() => {
  entityStore.reset()
  resetConnectionStatus()
})

function seed(state?: string) {
  const entities = state ? { [testHomeConfig.suggestions.player]: mediaPlayer(state) } : {}
  act(() => entityStore.setEntities(entities))
}

describe('suggestions strip', () => {
  it('suggests the media viewing mood while the Apple TV is playing', () => {
    seed('playing')
    render(<SuggestionsStrip />)
    expect(screen.getByRole('region', { name: 'Suggestions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bright up lights' })).not.toBeInTheDocument()
  })

  it('suggests brighter lights while the Apple TV is paused', () => {
    seed('paused')
    render(<SuggestionsStrip />)
    expect(screen.getByRole('button', { name: 'Bright up lights' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Media viewing mood' })).not.toBeInTheDocument()
  })

  it.each(['idle', 'off', 'standby', 'unavailable', 'unknown', undefined])(
    'shows no suggestions while the Apple TV is %s',
    (state) => {
      seed(state)
      render(<SuggestionsStrip />)
      expect(screen.queryByRole('region', { name: 'Suggestions' })).not.toBeInTheDocument()
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

  it('disables suggestion buttons while the connection is not connected', () => {
    seed('playing')
    render(<SuggestionsStrip />, { gateway: createFakeServiceGateway().gateway })
    expect(screen.getByRole('button', { name: 'Media viewing mood' })).toBeDisabled()
  })
})
