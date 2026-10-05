import { useMemo, useSyncExternalStore } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { personViewModel } from '../../domains/person/viewModel'
import { useHomeConfig } from '../../config/useHomeConfig'
import { useEntitiesById } from '../../infrastructure/entities/useEntitiesById'
import { useEntityIds } from '../../infrastructure/entities/useEntityIds'
import { isKioskDevice } from '../../infrastructure/ha/connection'
import { useCurrentUser } from '../../infrastructure/ha/useCurrentUser'
import { useHaUrl } from '../../infrastructure/ha/useHaUrl'
import { resolveRoom, type ResolvedRoom, type RoomSelection } from './roomSelection'
import { roomSelectionStore, selectRoom } from './roomSelectionStore'
import { awaySource } from './roomSources'
import type { RoomsModel } from './roomModel'
import { useRooms } from './useRooms'

// Module constant: useEntityIds shares one scan per predicate.
const isPerson = (e: HassEntity) => e.entity_id.startsWith('person.')

// Sources run in order under Auto; later ones (occupancy, UniFi, BLE) are added here.
const SOURCES = [awaySource]

// `rooms` and `resolved` are undefined while the registries load or failed, so callers render
// nothing.
export function useSelectedRoom(): {
  rooms: RoomsModel | undefined
  resolved: ResolvedRoom | undefined
  select: (selection: RoomSelection) => void
} {
  const store = roomSelectionStore()
  const selection = useSyncExternalStore(store.subscribe, store.get)
  const rooms = useRooms()
  const awayRoom = useHomeConfig().rooms.awayRoom
  const currentUserId = useCurrentUser()?.id
  // Pictures aren't used here, so the runtime URL isn't waited for.
  const haUrl = useHaUrl()
  const personIds = useEntityIds(isPerson)
  const entities = useEntitiesById(personIds)

  const resolved = useMemo(() => {
    if (!rooms) return undefined
    const persons = personIds.map((id) => personViewModel(entities[id], id, haUrl ?? ''))
    return resolveRoom(
      selection,
      { rooms, awayRoom, currentUserId, persons, kiosk: isKioskDevice() },
      SOURCES,
    )
  }, [rooms, selection, awayRoom, currentUserId, haUrl, personIds, entities])

  return { rooms, resolved, select: selectRoom }
}
