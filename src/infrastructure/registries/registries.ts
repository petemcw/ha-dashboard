import type { Connection } from 'home-assistant-js-websocket'

export type AreaRecord = {
  areaId: string
  name: string
  icon?: string
  floorId?: string
  temperatureEntityId?: string
  humidityEntityId?: string
}
export type FloorRecord = { floorId: string; name: string; level?: number; icon?: string }
export type DeviceRecord = { id: string; areaId?: string }
export type EntityRecord = {
  entityId: string
  areaId?: string
  deviceId?: string
  icon?: string
  hidden: boolean
  // HA's `ec` (entity category) is present for config and diagnostic entities.
  category: boolean
}

export type Registries = {
  areas: AreaRecord[]
  floors: FloorRecord[]
  devices: DeviceRecord[]
  entities: EntityRecord[]
}

export type RegistryKind = keyof Registries

// None of these list messages is admin-gated (checked on HA 2026.9.4), so non-admin
// phones can read them.
export const LIST_MESSAGES: Record<RegistryKind, string> = {
  areas: 'config/area_registry/list',
  floors: 'config/floor_registry/list',
  devices: 'config/device_registry/list',
  entities: 'config/entity_registry/list_for_display',
}

// The registry-updated event that means each list changed.
export const UPDATE_EVENTS: Record<RegistryKind, string> = {
  areas: 'area_registry_updated',
  floors: 'floor_registry_updated',
  devices: 'device_registry_updated',
  entities: 'entity_registry_updated',
}

export const REGISTRY_KINDS = Object.keys(LIST_MESSAGES) as RegistryKind[]

type Wire = Record<string, unknown>

// HA sends null for a field that isn't set, so null reads as absent.
const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
const num = (v: unknown) => (typeof v === 'number' ? v : undefined)

function list(raw: unknown): Wire[] {
  if (!Array.isArray(raw)) throw new Error('Unexpected registry response')
  return raw as Wire[]
}

const mappers: { [K in RegistryKind]: (raw: unknown) => Registries[K] } = {
  areas: (raw) =>
    list(raw).map((a) => ({
      areaId: a.area_id as string,
      name: a.name as string,
      icon: str(a.icon),
      floorId: str(a.floor_id),
      temperatureEntityId: str(a.temperature_entity_id),
      humidityEntityId: str(a.humidity_entity_id),
    })),
  floors: (raw) =>
    list(raw).map((f) => ({
      floorId: f.floor_id as string,
      name: f.name as string,
      level: num(f.level),
      icon: str(f.icon),
    })),
  devices: (raw) => list(raw).map((d) => ({ id: d.id as string, areaId: str(d.area_id) })),
  entities: (raw) => {
    const entities = (raw as { entities?: unknown } | null)?.entities
    return list(entities).map((e) => ({
      entityId: e.ei as string,
      areaId: str(e.ai),
      deviceId: str(e.di),
      icon: str(e.ic),
      hidden: e.hb === true,
      category: e.ec !== undefined && e.ec !== null,
    }))
  },
}

export async function fetchRegistry<K extends RegistryKind>(
  conn: Connection,
  kind: K,
): Promise<Registries[K]> {
  return mappers[kind](await conn.sendMessagePromise({ type: LIST_MESSAGES[kind] }))
}
