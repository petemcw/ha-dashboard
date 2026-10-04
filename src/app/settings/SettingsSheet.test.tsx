import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsSheet } from './SettingsSheet'

describe('SettingsSheet', () => {
  it('closes when the backdrop outside the sheet is tapped', () => {
    const onClose = vi.fn()
    render(<SettingsSheet open onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('sheet-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps Tab inside the sheet when the last control is disabled', async () => {
    render(
      <SettingsSheet open onClose={() => {}}>
        <button type="button">Enabled</button>
        <button type="button" disabled>
          Disabled
        </button>
      </SettingsSheet>,
    )
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Enabled' }).focus()
    await user.tab()
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })
})
