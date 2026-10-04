import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it('shows only its text, even with a status dot', () => {
    render(
      <Chip tone="ok" dot>
        Gateway online
      </Chip>,
    )
    const chip = screen.getByText('Gateway online')
    expect(chip).toHaveTextContent(/^Gateway online$/)
    expect(chip).toHaveClass('chip--ok')
  })

  it('can be an item in a list of chips', () => {
    render(
      <ul aria-label="Players">
        <Chip as="li" variant="outline">
          Kitchen speaker · Idle
        </Chip>
      </ul>,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('Kitchen speaker · Idle')
  })

  it('is neutral and soft unless told otherwise', () => {
    render(<Chip>3 snoozed</Chip>)
    expect(screen.getByText('3 snoozed')).toHaveClass('chip--neutral', 'chip--soft')
  })
})
