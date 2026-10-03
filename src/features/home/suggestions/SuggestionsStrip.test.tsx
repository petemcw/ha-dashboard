import { act, screen } from '@testing-library/react'
import { renderWithHome as render } from '../../../test/renderWithHome'
import { afterEach, describe, expect, it } from 'vitest'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { mediaPlayer } from '../../../domains/media_player/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { SuggestionsStrip } from './SuggestionsStrip'

afterEach(() => entityStore.reset())

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

  it('renders a suggestion as a disabled action with an explanation', () => {
    seed('playing')
    render(<SuggestionsStrip />)
    const button = screen.getByRole('button', { name: 'Media viewing mood' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Available when controls are enabled')
    expect(screen.getByRole('heading', { name: 'Suggestions' })).toBeInTheDocument()
  })
})
