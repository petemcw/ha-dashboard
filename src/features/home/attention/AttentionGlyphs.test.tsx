import {
  mdiAirFilter,
  mdiArrowCollapseDown,
  mdiArrowUpCircleOutline,
  mdiBatteryLow,
  mdiCart,
  mdiCheck,
  mdiDoorOpen,
  mdiFan,
  mdiGarage,
  mdiHelpCircleOutline,
  mdiLightbulb,
  mdiPower,
  mdiPrinter,
  mdiRadiator,
} from '@mdi/js'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActionGlyph, BadgeGlyph } from './AttentionGlyphs'
import type { ActionIcon, AttentionItem } from './types'

const drawnPath = (ui: React.ReactElement) =>
  render(ui).container.querySelector('svg path')?.getAttribute('d')

const leftOn = (icon: string) => ({ kind: 'left-on', icon }) as unknown as AttentionItem
const fixed = (kind: string) => ({ kind }) as unknown as AttentionItem

describe('attention icons', () => {
  it('shows the garage icon on a garage left-on row', () => {
    expect(drawnPath(<BadgeGlyph item={leftOn('garage')} />)).toBe(mdiGarage)
  })

  it.each([
    ['door', mdiDoorOpen],
    ['heater', mdiRadiator],
    ['light', mdiLightbulb],
    ['fan', mdiFan],
    ['power', mdiPower],
  ])('maps the %s left-on icon name in home.json to an MDI path', (name, path) => {
    expect(drawnPath(<BadgeGlyph item={leftOn(name)} />)).toBe(path)
  })

  it.each([
    ['battery', mdiBatteryLow],
    ['update', mdiArrowUpCircleOutline],
    ['filter', mdiAirFilter],
    ['toner', mdiPrinter],
    ['missing', mdiHelpCircleOutline],
  ])('gives the %s kind its own MDI badge', (kind, path) => {
    expect(drawnPath(<BadgeGlyph item={fixed(kind)} />)).toBe(path)
  })

  it.each<[ActionIcon, string]>([
    ['power', mdiPower],
    ['close-garage', mdiArrowCollapseDown],
    ['check', mdiCheck],
    ['cart', mdiCart],
  ])('maps the %s action to an MDI path', (name, path) => {
    expect(drawnPath(<ActionGlyph name={name} />)).toBe(path)
  })
})
