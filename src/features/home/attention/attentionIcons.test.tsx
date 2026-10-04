import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionIcon, badgeIcon } from './attentionIcons'
import type { ActionIcon, AttentionIcon } from './types'

const glyph = (Icon: ReturnType<typeof badgeIcon>) =>
  render(<Icon />).container.firstElementChild?.getAttribute('class')

describe('attention icons', () => {
  it('maps each badge name to its own glyph', () => {
    const names: AttentionIcon[] = [
      'garage',
      'door',
      'heater',
      'light',
      'fan',
      'power',
      'battery',
      'update',
      'filter',
      'toner',
      'missing',
    ]
    const classes = names.map((n) => glyph(badgeIcon(n)))
    expect(new Set(classes).size).toBe(names.length)
    expect(glyph(badgeIcon('garage'))).toContain('lucide-warehouse')
    expect(glyph(badgeIcon('toner'))).toContain('lucide-printer')
  })

  it('maps each action name to its own glyph', () => {
    const names: ActionIcon[] = ['power', 'close-garage', 'check', 'cart']
    const classes = names.map((n) => glyph(actionIcon(n)))
    expect(new Set(classes).size).toBe(names.length)
    expect(glyph(actionIcon('cart'))).toContain('lucide-shopping-cart')
  })
})
