import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'

describe('BottomSheet', () => {
  it('opens a bottom sheet named by its title and closes it on Escape', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open onClose={onClose} title="Pick a room">
        <button type="button">Kitchen</button>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog', { name: 'Pick a room' })).toBeInTheDocument()
    await userEvent.setup().keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('traps focus inside an open bottom sheet', async () => {
    render(
      <>
        <button type="button">Outside</button>
        <BottomSheet open onClose={() => {}} title="Trap">
          <button type="button">First</button>
          <button type="button">Last</button>
        </BottomSheet>
      </>,
    )
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Last' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()
  })

  // Drags the sheet's header through `moves` ([clientY, timeStamp] pairs) and lets go.
  // Returns how many times the sheet's height was read along the way.
  function dragHeader(moves: [number, number][]) {
    // jsdom has no layout; give the sheet a height so the dismiss threshold means something.
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    const header = screen.getByRole('banner')
    header.setPointerCapture = vi.fn()
    // jsdom ignores `timeStamp` in the event init and stamps the real clock, which made the
    // release velocity depend on how fast the test ran. Pin it on the event instead, away from
    // 0, which React's synthetic event swaps for Date.now().
    const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', y: number, t: number) => {
      const event = createEvent[type](header, { pointerId: 1, clientY: y })
      Object.defineProperty(event, 'timeStamp', { value: t })
      fireEvent(header, event)
    }
    const [[startY, startT], ...rest] = moves
    pointer('pointerDown', startY, startT)
    for (const [y, t] of rest) pointer('pointerMove', y, t)
    const [endY, endT] = moves[moves.length - 1]
    pointer('pointerUp', endY, endT + 30)
    const reads = height.mock.calls.length
    vi.restoreAllMocks()
    return reads
  }

  it('dismisses the bottom sheet on a downward flick of its header', () => {
    const onClose = vi.fn()
    render(<BottomSheet open onClose={onClose} title="Flick" />)
    dragHeader([
      [0, 1000],
      [60, 1030],
    ])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the bottom sheet open after a short, slow drag of its header', () => {
    const onClose = vi.fn()
    render(<BottomSheet open onClose={onClose} title="Nudge" />)
    dragHeader([
      [0, 1000],
      [20, 1500],
      [40, 2000],
    ])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('gives two bottom sheets distinct accessible names', () => {
    render(
      <>
        <BottomSheet open onClose={() => {}} title="Rooms" />
        <BottomSheet open onClose={() => {}} title="Light" />
      </>,
    )
    expect(screen.getByRole('dialog', { name: 'Rooms' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Light' })).toBeInTheDocument()
  })

  it("renders an open bottom sheet outside its parent's subtree, at the document body", () => {
    const { container } = render(
      <div data-stale>
        <BottomSheet open onClose={() => {}} title="Portal" />
      </div>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Portal' })
    expect(container).not.toContainElement(dialog)
    expect(dialog.closest('.sheet-layer')?.parentElement).toBe(document.body)
  })

  // Reading the height after moving the sheet makes the browser lay out again before it can
  // paint, on every pointer move. The sheet doesn't change size mid-drag, so once is enough.
  it('measures the bottom sheet once per drag, not on every move', () => {
    render(<BottomSheet open onClose={() => {}} title="Measure" />)
    const reads = dragHeader([
      [0, 1000],
      [10, 1100],
      [20, 1200],
      [30, 1300],
      [40, 1400],
      [50, 1500],
    ])
    expect(reads).toBe(1)
  })
})
