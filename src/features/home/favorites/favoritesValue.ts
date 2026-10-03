export const FAVORITES_KEY = 'ha-dashboard:favorites'

export type Favorites = {
  entityIds: string[]
  // False when a value is stored that this app can't read (newer version, junk).
  // Show nothing, but the editor must not overwrite it.
  writable: boolean
}

export function parseFavorites(value: unknown): Favorites {
  if (value === null || value === undefined) return { entityIds: [], writable: true }
  if (typeof value === 'object') {
    const { version, entityIds } = value as { version?: unknown; entityIds?: unknown }
    if (
      version === 1 &&
      Array.isArray(entityIds) &&
      entityIds.every((i) => typeof i === 'string')
    ) {
      return { entityIds, writable: true }
    }
  }
  return { entityIds: [], writable: false }
}

export function serializeFavorites(entityIds: string[]) {
  return { version: 1, entityIds }
}
