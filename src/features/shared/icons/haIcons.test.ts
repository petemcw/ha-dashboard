import { mdiGarage, mdiSofa, mdiLightbulb } from '@mdi/js'
import { describe, expect, it } from 'vitest'
import { iconForHa } from './haIcons'

describe('iconForHa', () => {
  it('resolves a known mdi: name from HA to its path', () => {
    expect(iconForHa('mdi:sofa', mdiLightbulb)).toBe(mdiSofa)
    expect(iconForHa('mdi:garage', mdiLightbulb)).toBe(mdiGarage)
  })

  it('returns the fallback for an mdi: name that is not in the curated map', () => {
    expect(iconForHa('mdi:definitely-not-an-icon', mdiLightbulb)).toBe(mdiLightbulb)
  })

  it('returns the fallback for an empty, undefined, or non-mdi icon string', () => {
    expect(iconForHa(undefined, mdiLightbulb)).toBe(mdiLightbulb)
    expect(iconForHa('', mdiLightbulb)).toBe(mdiLightbulb)
    expect(iconForHa('mdi:', mdiLightbulb)).toBe(mdiLightbulb)
    expect(iconForHa('hass:sofa', mdiLightbulb)).toBe(mdiLightbulb)
    expect(iconForHa('sofa', mdiLightbulb)).toBe(mdiLightbulb)
  })
})
