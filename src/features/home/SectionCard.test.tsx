import { render, screen, within } from '@testing-library/react'
import { Sun } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { SectionCard } from './SectionCard'

describe('section card', () => {
  it('renders a home section as a card region named by its title', () => {
    render(
      <SectionCard title="Favorites">
        <p>content</p>
      </SectionCard>,
    )
    const region = screen.getByRole('region', { name: 'Favorites' })
    expect(within(region).getByText('content')).toBeInTheDocument()
  })

  it("shows the section's icon label and its header chip in the card header", () => {
    render(<SectionCard title="Favorites" icon={Sun} chip={<span>3 on</span>} />)
    const region = screen.getByRole('region', { name: 'Favorites' })
    const header = region.querySelector('header')!
    expect(within(header).getByRole('heading', { name: 'Favorites' })).toBeInTheDocument()
    expect(within(header).getByText('3 on')).toBeInTheDocument()
    expect(header.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
