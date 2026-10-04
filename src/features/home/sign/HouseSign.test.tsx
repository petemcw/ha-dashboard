import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
