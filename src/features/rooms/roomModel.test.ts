import { describe, expect, it } from 'vitest'
import type { Registries } from '../../infrastructure/registries/registries'
import type { RoomsConfig } from '../../config/homeConfig'
import { buildRooms } from './roomModel'

const NO_CONFIG: RoomsConfig = { hidden: [], areas: {} }

const baseRegistries: Registries = {
  floors: [
    { floorId: 'upstairs', name: 'Upstairs', level: 1 },
    { floorId: 'ground_floor', name: 'Ground Floor', level: 0 },
    { floorId: 'attic', name: 'Attic' },
    { floorId: 'basement', name: 'Basement', level: 5 },
  ],
  areas: [
    {
      areaId: 'living_room',
      name: 'Living Room',
      icon: 'mdi:sofa',
      floorId: 'ground_floor',
      temperatureEntityId: 'sensor.living_room_temperature',
      humidityEntityId: 'sensor.living_room_humidity',
    },
    { areaId: 'kitchen', name: 'Kitchen', floorId: 'ground_floor' },
    { areaId: 'bedroom', name: 'Bedroom', floorId: 'upstairs' },
    { areaId: 'office', name: 'Office', floorId: 'upstairs' },
    { areaId: 'garage', name: 'Garage' },
    { areaId: 'porch', name: 'Porch' },
  ],
  devices: [],
  entities: [],
}

const entity = (entityId: string, extra: Partial<Registries['entities'][number]> = {}) => ({
  entityId,
  hidden: false,
  category: false,
  ...extra,
})

function build(
  entities: Registries['entities'],
  opts: {
    devices?: Registries['devices']
    config?: RoomsConfig
    live?: string[]
    areas?: Registries['areas']
    nameOf?: (id: string) => string
  } = {},
) {
  return buildRooms(
    {
      ...baseRegistries,
      devices: opts.devices ?? [],
      entities,
      areas: opts.areas ?? baseRegistries.areas,
    },
    new Set(opts.live ?? entities.map((e) => e.entityId)),
    opts.config ?? NO_CONFIG,
    opts.nameOf ?? ((id) => id),
  )
}

const idsOf = (model: ReturnType<typeof build>, areaId: string) =>
  model.byAreaId.get(areaId)?.entityIds

describe('buildRooms', () => {
  it("puts an entity in its own area before its device's area", () => {
    const model = build([entity('light.a', { areaId: 'kitchen', deviceId: 'd1' })], {
      devices: [{ id: 'd1', areaId: 'bedroom' }],
    })
    expect(idsOf(model, 'kitchen')).toEqual(['light.a'])
    expect(model.byAreaId.has('bedroom')).toBe(false)
  })

  it("puts an entity with no area of its own in its device's area", () => {
    const model = build([entity('light.a', { deviceId: 'd1' })], {
      devices: [{ id: 'd1', areaId: 'bedroom' }],
    })
    expect(idsOf(model, 'bedroom')).toEqual(['light.a'])
  })

  it('leaves out hidden entities, categorized entities, and ineligible domains', () => {
    const model = build([
      entity('light.ok', { areaId: 'kitchen' }),
      entity('light.hidden', { areaId: 'kitchen', hidden: true }),
      entity('switch.config', { areaId: 'kitchen', category: true }),
      entity('button.restart', { areaId: 'kitchen' }),
      entity('sensor.temp', { areaId: 'kitchen' }),
    ])
    expect(idsOf(model, 'kitchen')).toEqual(['light.ok'])
  })

  it('leaves out registry entities HA does not report', () => {
    const model = build([entity('light.gone', { areaId: 'kitchen' })], { live: [] })
    expect(model.byAreaId.size).toBe(0)
  })

  it('leaves out an area with nothing eligible to control', () => {
    const model = build([entity('sensor.temp', { areaId: 'office' })])
    expect(model.byAreaId.has('office')).toBe(false)
    expect(model.groups).toEqual([])
  })

  it('adds and removes entities per area from home.json and hides hidden areas', () => {
    const model = build(
      [
        entity('light.pendant', { areaId: 'kitchen' }),
        entity('switch.unused_plug', { areaId: 'living_room' }),
        entity('light.lamp', { areaId: 'living_room' }),
        entity('light.shed', { areaId: 'porch' }),
      ],
      {
        config: {
          hidden: ['porch'],
          areas: {
            living_room: {
              add: ['light.pendant', 'light.not_in_ha'],
              remove: ['switch.unused_plug'],
            },
          },
        },
      },
    )
    expect(idsOf(model, 'living_room')).toEqual(['light.lamp', 'light.not_in_ha', 'light.pendant'])
    expect(idsOf(model, 'kitchen')).toEqual(['light.pendant'])
    expect(model.byAreaId.has('porch')).toBe(false)
  })

  it('groups rooms by floor level with areas that have no floor last under Other', () => {
    const model = build([
      entity('light.g', { areaId: 'garage' }),
      entity('light.b', { areaId: 'bedroom' }),
      entity('light.o', { areaId: 'office' }),
      entity('light.l', { areaId: 'living_room' }),
      entity('light.k', { areaId: 'kitchen' }),
    ])
    expect(model.groups.map((g) => [g.floorId, g.name, g.level])).toEqual([
      ['ground_floor', 'Ground Floor', 0],
      ['upstairs', 'Upstairs', 1],
      [undefined, 'Other', undefined],
    ])
    expect(model.groups[0].rooms.map((r) => r.name)).toEqual(['Kitchen', 'Living Room'])
    expect(model.groups[1].rooms.map((r) => r.name)).toEqual(['Bedroom', 'Office'])
    expect(model.groups[2].rooms.map((r) => r.name)).toEqual(['Garage'])
    const living = model.byAreaId.get('living_room')
    expect(living).toMatchObject({
      name: 'Living Room',
      icon: 'mdi:sofa',
      floorId: 'ground_floor',
      temperatureEntityId: 'sensor.living_room_temperature',
      humidityEntityId: 'sensor.living_room_humidity',
    })
  })

  it('sorts a floor without a level as level 0', () => {
    const areas = [
      { areaId: 'a', name: 'Attic Room', floorId: 'attic' },
      { areaId: 'b', name: 'Upper Room', floorId: 'upstairs' },
      { areaId: 'c', name: 'Basement Room', floorId: 'basement' },
    ]
    const model = build(
      [
        entity('light.a', { areaId: 'a' }),
        entity('light.b', { areaId: 'b' }),
        entity('light.c', { areaId: 'c' }),
      ],
      { areas },
    )
    expect(model.groups.map((g) => g.floorId)).toEqual(['attic', 'upstairs', 'basement'])
  })

  it("orders a room's entities by kind and then by name", () => {
    const names: Record<string, string> = {
      'light.a': 'Zed Lamp',
      'light.b': 'Alpha Lamp',
      'switch.s': 'Plug',
      'media_player.m': 'TV',
      'scene.c': 'Movie',
      'script.r': 'Run',
      'fan.f': 'Fan',
      'lock.l': 'Door',
      'cover.v': 'Blind',
      'climate.t': 'Heat',
      'input_boolean.i': 'Guest Mode',
    }
    const model = build(
      Object.keys(names)
        .reverse()
        .map((id) => entity(id, { areaId: 'kitchen' })),
      { nameOf: (id) => names[id] },
    )
    expect(idsOf(model, 'kitchen')).toEqual([
      'light.b',
      'light.a',
      'switch.s',
      'fan.f',
      'input_boolean.i',
      'scene.c',
      'script.r',
      'media_player.m',
      'cover.v',
      'climate.t',
      'lock.l',
    ])
  })
})
