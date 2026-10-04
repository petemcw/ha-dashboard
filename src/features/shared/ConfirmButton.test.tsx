import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmButton } from './ConfirmButton'

type Props = Partial<Parameters<typeof ConfirmButton>[0]>

function setup(props: Props = {}) {
  const onConfirm = vi.fn()
  const ui = (p: Props) => (
    <ConfirmButton
      label="Close garage door"
      confirmLabel="Confirm close garage door"
      pendingLabel="Closing…"
      icon={<svg data-testid="icon" />}
      onConfirm={onConfirm}
      {...p}
    />
  )
  const view = render(ui(props))
  return {
    onConfirm,
    unmount: view.unmount,
    rerender: (p: Props) => view.rerender(ui({ ...props, ...p })),
  }
}

// fireEvent, not user-event: its internal delays hang under fake timers.
const tap = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('ConfirmButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    // The listener test spies on document; a failed assertion must not leak the spies.
    vi.restoreAllMocks()
  })

  it('reveals Confirm beside the action icon on the first tap', () => {
    setup()
    tap('Close garage door')
    const armed = screen.getByRole('button', { name: 'Confirm close garage door' })
    expect(armed).toHaveTextContent('Confirm?')
    expect(armed).toContainElement(screen.getByTestId('icon'))
  })

  it('disarms when the user taps outside the armed button', () => {
    setup()
    tap('Close garage door')
    fireEvent.pointerDown(document.body)
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it('stays armed when the user presses the armed button itself', () => {
    setup()
    tap('Close garage door')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Confirm close garage door' }))
    expect(screen.getByRole('button', { name: 'Confirm close garage door' })).toBeInTheDocument()
  })

  it('disarms when keyboard focus leaves the armed button', () => {
    setup()
    tap('Close garage door')
    const armed = screen.getByRole('button', { name: 'Confirm close garage door' })
    fireEvent.blur(armed)
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it('stays armed when a pointer press on the button blurs it transiently', () => {
    setup()
    tap('Close garage door')
    const armed = screen.getByRole('button', { name: 'Confirm close garage door' })
    fireEvent.pointerDown(armed)
    fireEvent.blur(armed)
    expect(screen.getByRole('button', { name: 'Confirm close garage door' })).toBeInTheDocument()
  })

  it('listens for outside taps only while armed and stops on disarm and unmount', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const taps = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'pointerdown')
    const view = setup()
    expect(taps(add)).toHaveLength(0)
    tap('Close garage door')
    expect(taps(add)).toHaveLength(1)
    fireEvent.pointerDown(document.body)
    expect(taps(remove)).toHaveLength(1)
    tap('Close garage door')
    expect(taps(add)).toHaveLength(2)
    view.unmount()
    expect(taps(remove)).toHaveLength(2)
  })

  it('stays armed and confirmable just before the confirm window ends', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(3_900))
    tap('Confirm close garage door')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disarms once the confirm window has ended', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(4_000))
    tap('Close garage door')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('disarms on Tab after a press that was released off the button', () => {
    setup()
    tap('Close garage door')
    const armed = screen.getByRole('button', { name: 'Confirm close garage door' })
    fireEvent.pointerDown(armed)
    // The pointer left the button before release, so the button never sees the pointerup.
    fireEvent.pointerUp(document.body)
    fireEvent.blur(armed)
    expect(screen.getByRole('button', { name: 'Close garage door' })).toBeInTheDocument()
  })

  it('does not call onConfirm on the first tap', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows the confirm label after the first tap', async () => {
    setup()
    tap('Close garage door')
    expect(screen.getByRole('button', { name: 'Confirm close garage door' })).toBeInTheDocument()
  })

  it('calls onConfirm when tapped again while armed', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(600))
    tap('Confirm close garage door')
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

  it('announces the armed confirm to assistive technology', async () => {
    setup()
    tap('Close garage door')
    expect(screen.getByRole('status')).toHaveTextContent('Confirm close garage door')
  })

  it('ignores a second tap that comes within half a second of arming', async () => {
    const { onConfirm } = setup()
    tap('Close garage door')
    await act(() => vi.advanceTimersByTimeAsync(200))
    tap('Confirm close garage door')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Confirm close garage door' })).toBeInTheDocument()
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
