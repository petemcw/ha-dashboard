import type { Registries } from '../../infrastructure/registries/registries'
import { ROOM_DOMAINS, type RoomsConfig } from '../../config/homeConfig'

export type Room = {
  areaId: string
  name: string
  icon?: string // HA's mdi: name, resolved to a path by the UI
  floorId?: string
  temperatureEntityId?: string
  humidityEntityId?: string
  // Ordered by kind (ROOM_DOMAINS order), then by name.
  entityIds: string[]
}
export type FloorGroup = { floorId?: string; name: string; level?: number; rooms: Room[] }
export type RoomsModel = { groups: FloorGroup[]; byAreaId: Map<string, Room> }

const domainOf = (entityId: string) => entityId.split('.')[0]
const kindRank = (entityId: string) =>
  (ROOM_DOMAINS as readonly string[]).indexOf(domainOf(entityId))

// `nameOf` supplies what a tile shows (friendly_name); the registry's own name is often just
// "Light", so ordering by it would be meaningless.
export function buildRooms(
  registries: Registries,
  liveEntityIds: ReadonlySet<string>,
  config: RoomsConfig,
  nameOf: (entityId: string) => string,
): RoomsModel {
  const deviceArea = new Map(registries.devices.map((d) => [d.id, d.areaId]))
  const members = new Map<string, Set<string>>()
  const put = (areaId: string, entityId: string) => {
    const set = members.get(areaId) ?? new Set<string>()
    set.add(entityId)
    members.set(areaId, set)
  }

  for (const e of registries.entities) {
    if (e.hidden || e.category || kindRank(e.entityId) < 0 || !liveEntityIds.has(e.entityId))
      continue
    // HA's rule: the entity's own area wins, else its device's.
    const areaId = e.areaId ?? (e.deviceId ? deviceArea.get(e.deviceId) : undefined)
    if (areaId) put(areaId, e.entityId)
  }
  // An added ID HA doesn't know is kept so its tile shows "missing".
  for (const [areaId, tweak] of Object.entries(config.areas)) {
    for (const id of tweak.add) put(areaId, id)
    for (const id of tweak.remove) members.get(areaId)?.delete(id)
  }

  const floors = new Map(registries.floors.map((f) => [f.floorId, f]))
  const byAreaId = new Map<string, Room>()
  for (const area of registries.areas) {
    if (config.hidden.includes(area.areaId)) continue
    const ids = [...(members.get(area.areaId) ?? [])]
    if (ids.length === 0) continue
    const names = new Map(ids.map((id) => [id, nameOf(id)]))
    ids.sort(
      (a, b) =>
        kindRank(a) - kindRank(b) ||
        names.get(a)!.localeCompare(names.get(b)!) ||
        a.localeCompare(b),
    )
    byAreaId.set(area.areaId, {
      areaId: area.areaId,
      name: area.name,
      icon: area.icon,
      floorId: area.floorId,
      temperatureEntityId: area.temperatureEntityId,
      humidityEntityId: area.humidityEntityId,
      entityIds: ids,
    })
  }

  const grouped = new Map<string | undefined, Room[]>()
  for (const room of byAreaId.values()) {
    // An area pointing at a floor HA no longer lists is treated as floorless.
    const key = room.floorId && floors.has(room.floorId) ? room.floorId : undefined
    grouped.set(key, [...(grouped.get(key) ?? []), room])
  }
  const byName = (a: Room, b: Room) => a.name.localeCompare(b.name)
  const groups: FloorGroup[] = [...floors.values()]
    .filter((f) => grouped.has(f.floorId))
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
    .map((f) => ({
      floorId: f.floorId,
      name: f.name,
      level: f.level,
      rooms: grouped.get(f.floorId)!.sort(byName),
    }))
  const other = grouped.get(undefined)
  if (other) groups.push({ name: 'Other', rooms: other.sort(byName) })
  return { groups, byAreaId }
}
