import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SnoozeMenu } from './SnoozeMenu'

const renderMenu = () =>
  render(<SnoozeMenu title="Garage door" disabled={false} onChoose={() => {}} />)

describe('SnoozeMenu', () => {
  it('moves focus to the first choice when it opens', async () => {
    renderMenu()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Snooze Garage door' }))
    expect(screen.getByRole('button', { name: '1 day' })).toHaveFocus()
  })

  it('returns focus to the Snooze button when cancelled', async () => {
    renderMenu()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Snooze Garage door' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Snooze Garage door' })).toHaveFocus()
  })
})
