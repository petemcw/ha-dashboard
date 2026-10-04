import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderBar } from './HeaderBar'

beforeEach(() =>
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date', 'setTimeout', 'clearTimeout'] }),
)
afterEach(() => vi.useRealTimers())

describe('HeaderBar', () => {
  it('shows the greeting for the time of day in the header', () => {
    vi.setSystemTime(new Date(2026, 9, 3, 8, 5))
    const { unmount } = render(<HeaderBar />)
    expect(within(screen.getByRole('banner')).getByText('Good morning')).toBeInTheDocument()
    unmount()

    vi.setSystemTime(new Date(2026, 9, 3, 18, 42))
    render(<HeaderBar />)
    expect(within(screen.getByRole('banner')).getByText('Good evening')).toBeInTheDocument()
  })

  it('shows the current time and date in the header', () => {
    vi.setSystemTime(new Date(2026, 9, 3, 18, 42))
    render(<HeaderBar />)
    const bar = screen.getByRole('banner')
    expect(within(bar).getByText('6:42')).toBeInTheDocument()
    expect(within(bar).getByText('pm')).toBeInTheDocument()
    expect(within(bar).getByText('Saturday, Oct 3')).toBeInTheDocument()
  })

  it('updates the header clock when the minute changes', () => {
    vi.setSystemTime(new Date(2026, 9, 3, 18, 42, 40))
    render(<HeaderBar />)
    expect(screen.getByText('6:42')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(20_000))
    expect(screen.getByText('6:43')).toBeInTheDocument()
  })

  it('renders the tools passed to the header before the Settings button', () => {
    render(<HeaderBar tools={<button type="button">Theme</button>} />)
    const buttons = within(screen.getByRole('banner')).getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Theme',
      'Settings',
    ])
  })

  it('shows the people avatars inside the header banner', () => {
    render(<HeaderBar people={<section aria-label="People" />} />)
    expect(
      within(screen.getByRole('banner')).getByRole('region', { name: 'People' }),
    ).toBeInTheDocument()
  })

  it('opens settings from the Settings button', async () => {
    const open = vi.fn()
    render(<HeaderBar onOpenSettings={open} />)
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(open).toHaveBeenCalledOnce()
  })
})
