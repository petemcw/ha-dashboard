import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { HomeScreen } from './HomeScreen'

afterEach(() => entityStore.reset())

describe('home screen', () => {
  it('renders the home screen with a labelled region for each section', () => {
    render(<HomeScreen />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getByText('Connecting…')).toBeInTheDocument()

    act(() => entityStore.setEntities({}))
    for (const name of ['Needs attention', 'People', 'Favorites', 'Crypto']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })
})
