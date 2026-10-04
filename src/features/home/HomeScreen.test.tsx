import { act, screen } from '@testing-library/react'
import { renderWithHome as render } from '../../test/renderWithHome'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { personState } from '../../domains/person/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { HomeScreen } from './HomeScreen'

afterEach(() => {
  entityStore.reset()
  vi.unstubAllEnvs()
})

describe('home screen', () => {
  it('renders the home screen with a labelled region for each section', () => {
    render(<HomeScreen />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getByText('Connecting…')).toBeInTheDocument()

    act(() => entityStore.setEntities({}))
    for (const name of ['Needs attention', 'Favorites', 'Crypto']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('shows who is home on the sign, above the sections', async () => {
    vi.stubEnv('VITE_HA_URL', 'https://ha.example')
    render(<HomeScreen />)
    act(() =>
      entityStore.setEntities({
        'person.alex_rivera': personState({
          entity_id: 'person.alex_rivera',
          friendly_name: 'Alex Rivera',
          state: 'home',
        }),
      }),
    )
    const people = await screen.findByRole('region', { name: 'People' })
    expect(people).toContainElement(screen.getByRole('listitem', { name: 'Alex Rivera, home' }))
    expect(screen.getByRole('main')).not.toContainElement(people)
  })
})
