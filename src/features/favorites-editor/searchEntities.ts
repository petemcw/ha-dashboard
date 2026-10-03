import type { HassEntity } from 'home-assistant-js-websocket'
import { favoriteDomains } from '../../config/favoriteDomains'

export const MAX_RESULTS = 20

// Case-insensitive match on friendly name or entity ID, limited to controllable
// domains, skipping what's already a favorite. An empty query offers nothing.
export function matchesSearch(entity: HassEntity, query: string, favorites: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  const id = entity.entity_id
  if (!favoriteDomains.includes(id.split('.')[0])) return false
  if (favorites.includes(id)) return false
  const name = String(entity.attributes.friendly_name ?? '').toLowerCase()
  return id.toLowerCase().includes(q) || name.includes(q)
}
