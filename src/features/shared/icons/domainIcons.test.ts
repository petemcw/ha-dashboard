import { mdiFan, mdiLightbulb, mdiShapeOutline } from '@mdi/js'
import { describe, expect, it } from 'vitest'
import { domainIcon } from './domainIcons'

describe('domainIcon', () => {
  it('picks a default icon by HA domain with a neutral icon for unknown domains', () => {
    expect(domainIcon('light.kitchen_pendant')).toBe(mdiLightbulb)
    expect(domainIcon('fan.office')).toBe(mdiFan)
    expect(domainIcon('widget.thing')).toBe(mdiShapeOutline)
    expect(domainIcon('nodot')).toBe(mdiShapeOutline)
  })
})
