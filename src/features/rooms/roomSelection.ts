import type { PersonViewModel } from '../../domains/person/types'
import type { Room, RoomsModel } from './roomModel'

export type RoomSelection = { kind: 'auto' } | { kind: 'room'; areaId: string }
// What room sources know about a person: their HA user and where they are.
export type PersonPresence = Pick<PersonViewModel, 'userId' | 'presence'>
export type RoomPick = { areaId: string; reason: string }
export type RoomSourceContext = {
  rooms: RoomsModel
  awayRoom?: string
  currentUserId?: string
  persons: PersonPresence[]
  kiosk: boolean
}
export type RoomSource = { id: string; resolve(ctx: RoomSourceContext): RoomPick | undefined }
export type ResolvedRoom =
  | { kind: 'none'; selection: RoomSelection }
  | { kind: 'room'; selection: RoomSelection; room: Room; reason?: string } // reason only for Auto

export function resolveRoom(
  selection: RoomSelection,
  ctx: RoomSourceContext,
  sources: readonly RoomSource[],
): ResolvedRoom {
  if (selection.kind === 'room') {
    const room = ctx.rooms.byAreaId.get(selection.areaId)
    if (room) return { kind: 'room', selection, room }
  }
  // Auto, and a pick whose area is gone (deleted, hidden, emptied) falls back to it.
  for (const source of sources) {
    const pick = source.resolve(ctx)
    const room = pick && ctx.rooms.byAreaId.get(pick.areaId)
    if (pick && room) return { kind: 'room', selection, room, reason: pick.reason }
  }
  return { kind: 'none', selection }
}
