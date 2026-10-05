import { useMemo, useSyncExternalStore } from 'react'
import { useHomeConfig } from '../../config/useHomeConfig'
import { isKioskDevice } from '../../infrastructure/ha/connection'
import { useCurrentUser } from '../../infrastructure/ha/useCurrentUser'
import { resolveRoom, type ResolvedRoom, type RoomSelection } from './roomSelection'
import { roomSelectionStore, selectRoom } from './roomSelectionStore'
import { awaySource } from './roomSources'
import type { RoomsModel } from './roomModel'
import { usePersonPresence } from './usePersonPresence'
import { useRooms } from './useRooms'

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
  const persons = usePersonPresence()

  const resolved = useMemo(() => {
    if (!rooms) return undefined
    return resolveRoom(
      selection,
      { rooms, awayRoom, currentUserId, persons, kiosk: isKioskDevice() },
      SOURCES,
    )
  }, [rooms, selection, awayRoom, currentUserId, persons])

  return { rooms, resolved, select: selectRoom }
}
