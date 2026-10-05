import { render } from '@testing-library/react'
import { mdiGarage } from '@mdi/js'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'

describe('icon', () => {
  it('renders an MDI path as an svg that is hidden from assistive tech', () => {
    const { container } = render(<Icon path={mdiGarage} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelectorAll('path')).toHaveLength(1)
    expect(svg.querySelector('path')).toHaveAttribute('d', mdiGarage)
  })

  it('labels the svg when a title is given', () => {
    const { getByRole, container } = render(<Icon path={mdiGarage} title="Garage" />)
    expect(getByRole('img', { name: 'Garage' })).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden')
  })
})
