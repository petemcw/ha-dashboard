import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionIcon, badgeIcon } from './attentionIcons'
import type { ActionIcon, AttentionIcon } from './types'

const glyph = (Icon: ReturnType<typeof badgeIcon>) =>
  render(<Icon />).container.firstElementChild?.getAttribute('class')

// Lucide has no garage glyph, so a warehouse stands in.
const BADGES: [AttentionIcon, string][] = [
  ['garage', 'lucide-warehouse'],
  ['door', 'lucide-door-open'],
  ['heater', 'lucide-heater'],
  ['light', 'lucide-lightbulb'],
  ['fan', 'lucide-fan'],
  ['power', 'lucide-power'],
  ['battery', 'lucide-battery-low'],
  ['update', 'lucide-circle-arrow-up'],
  ['filter', 'lucide-air-vent'],
  ['toner', 'lucide-printer'],
  ['missing', 'lucide-circle-question-mark'],
]

const ACTIONS: [ActionIcon, string][] = [
  ['power', 'lucide-power'],
  ['close-garage', 'lucide-arrow-down-to-line'],
  ['check', 'lucide-check'],
  ['cart', 'lucide-shopping-cart'],
]

describe('attention icons', () => {
  it.each(BADGES)('maps the %s badge to %s', (name, cls) => {
    expect(glyph(badgeIcon(name))).toContain(cls)
  })

  it.each(ACTIONS)('maps the %s action to %s', (name, cls) => {
    expect(glyph(actionIcon(name))).toContain(cls)
  })
})
