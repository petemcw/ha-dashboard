import { describe, expect, it } from 'vitest'
import exampleJson from '../../home.example.json?raw'
import { parseHomeConfig } from './homeConfig'
import { ROOM_DOMAINS } from './homeConfig'

// A fresh copy per call, so a test can break one field without touching the next.
// oxlint-disable-next-line typescript/no-explicit-any
const example = (): Record<string, any> => JSON.parse(exampleJson)

describe('parsing home.json', () => {
  it('accepts home.example.json so the example cannot rot', () => {
    const parsed = parseHomeConfig(example())
    expect(parsed.leftOnRules.length).toBeGreaterThan(0)
    expect(parsed.people).toBeUndefined()
  })

  it('keeps the optional people list when present', () => {
    const parsed = parseHomeConfig({ ...example(), people: ['person.a', 'person.b'] })
    expect(parsed.people).toEqual(['person.a', 'person.b'])
  })

  it('uses the icon named on a left-on rule and rejects an unknown icon name', () => {
    const raw = example()
    expect(parseHomeConfig(raw).leftOnRules[0].icon).toBe('garage')
    delete raw.leftOnRules[0].icon
    expect(parseHomeConfig(raw).leftOnRules[0].icon).toBeUndefined()
    raw.leftOnRules[0].icon = 'rocket'
    expect(() => parseHomeConfig(raw)).toThrow('leftOnRules[0].icon must be one of garage')
  })

  it('names the invalid field when home.json has the wrong shape', () => {
    const raw = example()
    raw.leftOnRules[1].minutes = '30'
    expect(() => parseHomeConfig(raw)).toThrow('leftOnRules[1].minutes must be a number')
  })

  it('names a missing top-level section', () => {
    const raw = example()
    delete raw.tonerRule
    expect(() => parseHomeConfig(raw)).toThrow('tonerRule must be an object')
  })

  it('names a nested field that is not a string', () => {
    const raw = example()
    raw.suggestions.playing.scene = 3
    expect(() => parseHomeConfig(raw)).toThrow('suggestions.playing.scene must be a string')
  })

  it('rejects a list that is not an array', () => {
    const raw = example()
    raw.crypto = {}
    expect(() => parseHomeConfig(raw)).toThrow('crypto must be an array')
  })

  it('rejects people that are not all strings', () => {
    expect(() => parseHomeConfig({ ...example(), people: ['person.a', 4] })).toThrow(
      'people[1] must be a string',
    )
  })

  it('rejects a document that is not an object', () => {
    expect(() => parseHomeConfig(null)).toThrow('home.json must be an object')
  })

  it('rejects an unsupported onState', () => {
    const raw = example()
    raw.leftOnRules[0].onState = 'off'
    expect(() => parseHomeConfig(raw)).toThrow('leftOnRules[0].onState must be "on"')
  })

  it('allows the optional label and transition to be absent but not mistyped', () => {
    const raw = example()
    delete raw.updateRules[0].label
    delete raw.suggestions.playing.transition
    expect(() => parseHomeConfig(raw)).not.toThrow()
    raw.updateRules[0].label = 5
    expect(() => parseHomeConfig(raw)).toThrow('updateRules[0].label must be a string')
  })
})

describe('the weather, systems, and media sections', () => {
  const systems = () => ({
    status: { entity_id: 'sensor.gateway_state', upState: 'connected', label: 'Gateway' },
  })

  it('parses a home config with none of the weather, systems, or media sections', () => {
    const raw = example()
    delete raw.weather
    delete raw.systems
    delete raw.media
    const parsed = parseHomeConfig(raw)
    expect(parsed.weather).toBeUndefined()
    expect(parsed.systems).toBeUndefined()
    expect(parsed.media).toBeUndefined()
  })

  it('parses a weather section and defaults the sun entity to sun.sun', () => {
    const parsed = parseHomeConfig({
      ...example(),
      weather: { entity_id: 'weather.forecast_home' },
    })
    expect(parsed.weather).toEqual({ entity_id: 'weather.forecast_home', sun: 'sun.sun' })
    const custom = parseHomeConfig({
      ...example(),
      weather: { entity_id: 'weather.forecast_home', sun: 'sun.other' },
    })
    expect(custom.weather?.sun).toBe('sun.other')
  })

  it('rejects a weather section without an entity_id', () => {
    expect(() => parseHomeConfig({ ...example(), weather: {} })).toThrow(
      'weather.entity_id must be a string',
    )
  })

  it('parses a systems section with its status entity, up state, and label', () => {
    const parsed = parseHomeConfig({ ...example(), systems: systems() })
    expect(parsed.systems?.status).toEqual({
      entity_id: 'sensor.gateway_state',
      upState: 'connected',
      label: 'Gateway',
    })
    expect(parsed.systems?.uptime).toBeUndefined()
    expect(parsed.systems?.accessPoints).toBeUndefined()
    expect(parsed.systems?.backup).toBeUndefined()
    expect(parsed.systems?.cpu).toBeUndefined()
  })

  it('rejects a systems cpu entry without a label', () => {
    const raw = { ...example(), systems: { ...systems(), cpu: [{ entity_id: 'sensor.cpu' }] } }
    expect(() => parseHomeConfig(raw)).toThrow('systems.cpu[0].label must be a string')
  })

  it('parses access points with their own up state and uptime with its own label', () => {
    const parsed = parseHomeConfig({
      ...example(),
      systems: {
        status: { entity_id: 'binary_sensor.wan_ping', upState: 'on', label: 'Internet' },
        uptime: { entity_id: 'sensor.gateway_boot', label: 'Gateway' },
        accessPoints: { entity_ids: ['sensor.office_ap_state'], upState: 'connected' },
        backup: 'sensor.last_backup',
        cpu: [{ label: 'HA', entity_id: 'sensor.processor_use' }],
      },
    })
    expect(parsed.systems?.status.upState).toBe('on')
    expect(parsed.systems?.uptime).toEqual({ entity_id: 'sensor.gateway_boot', label: 'Gateway' })
    expect(parsed.systems?.accessPoints).toEqual({
      entity_ids: ['sensor.office_ap_state'],
      upState: 'connected',
    })
    expect(parsed.systems?.backup).toBe('sensor.last_backup')
    expect(parsed.systems?.cpu).toEqual([{ label: 'HA', entity_id: 'sensor.processor_use' }])
  })

  it('names the full path of a bad entry in a nested list of entity ids', () => {
    const raw = {
      ...example(),
      systems: {
        ...systems(),
        accessPoints: { entity_ids: ['sensor.a', 4], upState: 'connected' },
      },
    }
    expect(() => parseHomeConfig(raw)).toThrow(
      'systems.accessPoints.entity_ids[1] must be a string',
    )
  })

  it('parses a media section with its list of players', () => {
    const parsed = parseHomeConfig({
      ...example(),
      media: { players: ['media_player.living_room_speaker'] },
    })
    expect(parsed.media).toEqual({ players: ['media_player.living_room_speaker'] })
  })

  it('parses the example home config including the new sections', () => {
    const parsed = parseHomeConfig(example())
    expect(parsed.weather?.entity_id).toBe('weather.forecast_home')
    expect(parsed.systems?.status.entity_id).toBe('sensor.gateway_state')
    expect(parsed.systems?.accessPoints?.entity_ids).toContain('sensor.office_ap_state')
    expect(parsed.media?.players).toContain('media_player.living_room_speaker')
  })
})

describe('the shared test house', () => {
  it('is a valid home config', async () => {
    const { testHomeConfig } = await import('./testHomeConfig')
    expect(parseHomeConfig(JSON.parse(JSON.stringify(testHomeConfig)))).toEqual(testHomeConfig)
  })
})

describe('the rooms and confirm sections', () => {
  it('parses hidden areas, per-area add and remove lists, and the away room', () => {
    const parsed = parseHomeConfig({
      ...example(),
      rooms: {
        hidden: ['placeholder_area'],
        awayRoom: 'garage',
        areas: { living_room: { add: ['light.entry_lamp'], remove: ['switch.unused_plug'] } },
      },
    })
    expect(parsed.rooms).toEqual({
      hidden: ['placeholder_area'],
      awayRoom: 'garage',
      areas: { living_room: { add: ['light.entry_lamp'], remove: ['switch.unused_plug'] } },
    })
  })

  it('defaults rooms to no hidden areas, no tweaks, and no away room when the section is absent', () => {
    const raw = example()
    delete raw.rooms
    expect(parseHomeConfig(raw).rooms).toEqual({ hidden: [], areas: {} })
    expect(parseHomeConfig(raw).rooms.awayRoom).toBeUndefined()
  })

  it('parses the confirm list of entity ids and defaults it to empty', () => {
    const raw = example()
    expect(parseHomeConfig({ ...raw, confirm: ['switch.garage_door_opener'] }).confirm).toEqual([
      'switch.garage_door_opener',
    ])
    delete raw.confirm
    expect(parseHomeConfig(raw).confirm).toEqual([])
    expect(() => parseHomeConfig({ ...raw, confirm: ['garage'] })).toThrow('confirm[0]')
  })

  it("rejects a malformed entity id in a room's add list with the path in the message", () => {
    const rooms = { areas: { living_room: { add: ['not an id'] } } }
    expect(() => parseHomeConfig({ ...example(), rooms })).toThrow('rooms.areas.living_room.add[0]')
  })

  it('rejects an unknown key in the rooms section', () => {
    expect(() => parseHomeConfig({ ...example(), rooms: { hidded: [] } })).toThrow('rooms.hidded')
    const rooms = { areas: { living_room: { ad: [] } } }
    expect(() => parseHomeConfig({ ...example(), rooms })).toThrow('rooms.areas.living_room.ad')
  })

  it("rejects a room add entry whose HA domain rooms don't use", () => {
    const rooms = { areas: { living_room: { add: ['button.restart'] } } }
    expect(() => parseHomeConfig({ ...example(), rooms })).toThrow('rooms.areas.living_room.add[0]')
    expect(ROOM_DOMAINS).toContain('light')
    expect(ROOM_DOMAINS).not.toContain('button')
  })

  it('parses home.example.json without errors', () => {
    const parsed = parseHomeConfig(example())
    expect(parsed.confirm).toEqual(['switch.garage_door_opener'])
    expect(parsed.rooms.awayRoom).toBe('garage')
  })
})
