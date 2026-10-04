import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmButton } from './ConfirmButton'

type Props = Partial<Parameters<typeof ConfirmButton>[0]>

function setup(props: Props = {}) {
  const onConfirm = vi.fn()
  const ui = (p: Props) => (
    <ConfirmButton
      label="Close garage door"
      confirmLabel="Tap to close"
      pendingLabel="Closing…"
      onConfirm={onConfirm}
      {...p}
    />
  )
  const view = render(ui(props))
  return { onConfirm, rerender: (p: Props) => view.rerender(ui({ ...props, ...p })) }
}

// fireEvent, not user-event: its internal delays hang under fake timers.
const tap = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('ConfirmButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not call onConfirm on the first tap', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows the confirm label after the first tap', async () => {
    setup()
    tap('Close garage door')
    expect(screen.getByRole('button', { name: 'Tap to close' })).toBeInTheDocument()
  })

  it('calls onConfirm when tapped again while armed', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(600))
    tap('Tap to close')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it('reverts to the original label after four seconds without a second tap', async () => {
    setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it('disarms when it becomes disabled while armed', async () => {
    const { onConfirm, rerender } = setup()
    tap('Close garage door')
    rerender({ disabled: true })
    rerender({ disabled: false })
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('announces the armed state to screen readers', async () => {
    setup()
    tap('Close garage door')
    expect(screen.getByRole('status')).toHaveTextContent('Tap to close')
  })

  it('ignores a second tap that comes within half a second of arming', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(200))
    tap('Tap to close')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Tap to close' })).toBeInTheDocument()
  })

  it('shows the pending label and ignores taps while pending', async () => {
    const { onConfirm } = setup({ pending: true })
    const button = screen.getByRole('button', { name: 'Closing…' })
    fireEvent.click(button)
    await act(() => vi.advanceTimersByTimeAsync(600))
    fireEvent.click(button)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })
})
