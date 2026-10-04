import type { HassEntity } from 'home-assistant-js-websocket'
import { favoriteDomains } from '../../config/favoriteDomains'

export const MAX_RESULTS = 20

const DOMAINS = new Set(favoriteDomains)

// A case-insensitive match on friendly name or entity ID, limited to controllable domains,
// skipping what's already a favorite. The query and favorites are prepared once here, since
// the predicate runs for every entity in the house. A blank query offers nothing, so it
// gets no predicate at all.
export function entitySearch(
  query: string,
  favorites: readonly string[],
): ((entity: HassEntity) => boolean) | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const taken = new Set(favorites)
  return (entity) => {
    const id = entity.entity_id
    if (!DOMAINS.has(id.slice(0, id.indexOf('.'))) || taken.has(id)) return false
    const name = String(entity.attributes.friendly_name ?? '').toLowerCase()
    return id.toLowerCase().includes(q) || name.includes(q)
  }
}
