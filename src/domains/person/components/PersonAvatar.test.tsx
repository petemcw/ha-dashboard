import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { personState } from '../factories'
import { personViewModel } from '../viewModel'
import { PersonAvatar } from './PersonAvatar'

const HA = 'https://ha.example.test'
const show = (state: string, picture?: string) =>
  render(
    <ul>
      <PersonAvatar
        person={personViewModel(
          personState({ state, entity_picture: picture }),
          'person.alex_rivera',
          HA,
        )}
      />
    </ul>,
  )

describe('PersonAvatar', () => {
  it.each([
    ['home', 'Alex Rivera, home'],
    ['not_home', 'Alex Rivera, away'],
    ['Work', 'Alex Rivera, at Work'],
    ['unknown', 'Alex Rivera, location unknown'],
    ['unavailable', 'Alex Rivera, unavailable'],
  ])('names a %s person for assistive tech', (state, name) => {
    show(state)
    expect(screen.getByRole('listitem', { name })).toBeInTheDocument()
  })

  it('names a missing person', () => {
    render(
      <ul>
        <PersonAvatar person={personViewModel(undefined, 'person.casey_rivera', HA)} />
      </ul>,
    )
    expect(screen.getByRole('listitem', { name: 'casey rivera, missing' })).toBeInTheDocument()
  })

  it('shows initials when a person has no picture or the picture fails to load', () => {
    const { container, unmount } = show('home')
    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    unmount()

    const view = show('home', '/api/image/serve/abc/512x512')
    const img = view.container.querySelector('img')!
    expect(img).toHaveAttribute('src', 'https://ha.example.test/api/image/serve/abc/512x512')
    expect(screen.queryByText('AR')).toBeNull()
    fireEvent.error(img)
    expect(screen.getByText('AR')).toBeInTheDocument()
  })
})
