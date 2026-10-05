import { render, screen, within } from '@testing-library/react'
import { mdiWeatherSunny } from '@mdi/js'
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
    render(<SectionCard title="Favorites" icon={mdiWeatherSunny} chip={<span>3 on</span>} />)
    const region = screen.getByRole('region', { name: 'Favorites' })
    const header = region.querySelector('header')!
    expect(within(header).getByRole('heading', { name: 'Favorites' })).toBeInTheDocument()
    expect(within(header).getByText('3 on')).toBeInTheDocument()
    expect(header.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it("renders the section card's icon label with an MDI icon", () => {
    render(<SectionCard title="Today" icon={mdiWeatherSunny} />)
    const svg = screen.getByRole('region', { name: 'Today' }).querySelector('header svg')
    expect(svg?.querySelector('path')).toHaveAttribute('d', mdiWeatherSunny)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts only an MDI path as a section card icon', () => {
    const NotAPath = () => <svg data-testid="component-icon" />
    // @ts-expect-error a component is not an MDI path
    render(<SectionCard title="Today" icon={NotAPath} />)
    expect(screen.queryByTestId('component-icon')).not.toBeInTheDocument()
  })
})
