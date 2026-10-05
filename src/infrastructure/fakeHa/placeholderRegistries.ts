import type { EntityRegistryDisplay } from './fakeHa.ts'

// The shared placeholder house for rooms (generic names only; the repo is public). Used by
// the Playwright rooms specs and the demo house, which each pick their own entities with
// `placeRegistries`.

export const PLACEHOLDER_FLOORS = [
  { floor_id: 'ground_floor', name: 'Ground Floor', level: 0, icon: null, aliases: [] },
  { floor_id: 'upstairs', name: 'Upstairs', level: 1, icon: null, aliases: [] },
]

type AreaInit = {
  area_id: string
  name: string
  floor_id: string | null
  icon: string
  temperature_entity_id?: string
  humidity_entity_id?: string
}

const area = (init: AreaInit) => ({
  temperature_entity_id: null,
  humidity_entity_id: null,
  aliases: [],
  labels: [],
  picture: null,
  ...init,
})

export const PLACEHOLDER_AREAS = [
  area({
    area_id: 'living_room',
    name: 'Living Room',
    floor_id: 'ground_floor',
    icon: 'mdi:sofa',
    temperature_entity_id: 'sensor.living_room_temperature',
    humidity_entity_id: 'sensor.living_room_humidity',
  }),
  area({ area_id: 'kitchen', name: 'Kitchen', floor_id: 'ground_floor', icon: 'mdi:countertop' }),
  area({ area_id: 'bedroom', name: 'Bedroom', floor_id: 'upstairs', icon: 'mdi:bed' }),
  area({ area_id: 'office', name: 'Office', floor_id: 'upstairs', icon: 'mdi:desk' }),
  area({ area_id: 'garage', name: 'Garage', floor_id: null, icon: 'mdi:garage' }),
  area({ area_id: 'porch', name: 'Porch', floor_id: null, icon: 'mdi:coach-lamp' }),
  area({ area_id: 'storage', name: 'Storage', floor_id: null, icon: 'mdi:archive' }),
]

export type PlacedRegistries = {
  devices: { id: string; area_id: string | null; name: string }[]
  entityRegistry: EntityRegistryDisplay
}

// Turn `{ areaId: entityIds }` into devices and entity-registry records. Within an area the
// entities alternate: the first sits in the area directly (`ai`), the second belongs to a
// device in the area (`di`, no `ai`), and so on, so both ways HA places an entity are
// covered.
export function placeRegistries(placement: Record<string, string[]>): PlacedRegistries {
  const devices: PlacedRegistries['devices'] = []
  const entities: Record<string, unknown>[] = []
  for (const [areaId, entityIds] of Object.entries(placement)) {
    entityIds.forEach((entityId, i) => {
      if (i % 2 === 0) {
        entities.push({ ei: entityId, pl: 'placeholder', ai: areaId })
        return
      }
      const id = `device_${entityId.replace('.', '_')}`
      devices.push({ id, area_id: areaId, name: entityId })
      entities.push({ ei: entityId, pl: 'placeholder', di: id })
    })
  }
  return {
    devices,
    entityRegistry: { entity_categories: { 0: 'config', 1: 'diagnostic' }, entities },
  }
}
