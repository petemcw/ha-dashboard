import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AttentionItem } from '../attention/types'
import { HouseSign } from './HouseSign'

const urgent: AttentionItem = {
  id: 'garage-door',
  tier: 'urgent',
  title: 'Garage door',
  detail: 'Open for 45 min',
}

describe('HouseSign', () => {
  it('says what needs attention under the greeting', () => {
    render(<HouseSign loaded urgent={[urgent]} chores={[]} onOpenSettings={() => {}} />)
    expect(screen.getByText('Garage door: open for 45 min.')).toBeInTheDocument()
    expect(screen.getByText(/^Good (morning|afternoon|evening)$/)).toBeInTheDocument()
  })

  it('says it is connecting until Home Assistant has sent the house', () => {
    render(<HouseSign loaded={false} urgent={[]} chores={[]} onOpenSettings={() => {}} />)
    expect(screen.getByText('Connecting to the house…')).toBeInTheDocument()
    expect(screen.queryByText('All quiet at home.')).not.toBeInTheDocument()
  })

  it('opens settings from the gear button', async () => {
    const open = vi.fn()
    render(<HouseSign loaded urgent={[]} chores={[]} onOpenSettings={open} />)
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(open).toHaveBeenCalledOnce()
  })
})

describe('HouseSign top bar', () => {
  // jsdom has no IntersectionObserver; this one lets a test say when the status scrolls away.
  let report: (visible: boolean) => void = () => {}
  class FakeObserver {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      report = (visible) => cb([{ isIntersecting: visible }])
    }
    observe() {}
    disconnect() {}
  }
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the house status in the top bar once the sign has scrolled away', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    render(<HouseSign loaded urgent={[urgent]} chores={[]} onOpenSettings={() => {}} />)
    const bar = screen.getByRole('banner')
    expect(within(bar).queryByText('Garage door: open for 45 min.')).not.toBeInTheDocument()
    act(() => report(false))
    expect(within(bar).getByText('Garage door: open for 45 min.')).toBeInTheDocument()
    act(() => report(true))
    expect(within(bar).queryByText('Garage door: open for 45 min.')).not.toBeInTheDocument()
  })

  it('keeps the Settings button reachable in the top bar', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    render(<HouseSign loaded urgent={[]} chores={[]} onOpenSettings={() => {}} />)
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Settings' }),
    ).toBeInTheDocument()
  })
})
