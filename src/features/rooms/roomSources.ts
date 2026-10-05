import type { RoomSource } from './roomSelection'

// Home, and the states that say nothing about where someone is, never count as away. A
// named zone (Work) does: it matches the old dashboard's "not home" rule.
const NOT_AWAY = new Set(['home', 'unknown', 'unavailable', 'missing'])

export const awaySource: RoomSource = {
  id: 'away',
  resolve({ awayRoom, currentUserId, persons, kiosk }) {
    // A kiosk token belongs to a shared user; the wall screen never shows the away room.
    if (kiosk || !awayRoom || !currentUserId) return undefined
    const person = persons.find((p) => p.userId === currentUserId)
    if (!person || NOT_AWAY.has(person.presence)) return undefined
    return { areaId: awayRoom, reason: "you're away" }
  },
}
