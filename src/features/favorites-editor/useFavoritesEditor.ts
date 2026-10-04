import { useAppData } from '../../infrastructure/appData/useAppData'
import { useAppDataWriter } from '../../infrastructure/appData/useAppDataWriter'
import { FAVORITES_KEY, parseFavorites, serializeFavorites } from '../home/favorites/favoritesValue'

// Edits are only offered once the stored list has been read (`loaded`) and is one this
// app understands (`writable`); the writer also holds them while a save is in flight.
export function useFavoritesEditor() {
  const { value, loaded } = useAppData('user', FAVORITES_KEY)
  const { entityIds, writable } = parseFavorites(value)
  const writer = useAppDataWriter('user', FAVORITES_KEY, entityIds, loaded && writable)
  const edit = (change: (ids: string[]) => string[]) =>
    writer.write((ids) => serializeFavorites(change(ids)))

  return {
    entityIds,
    loaded,
    writable,
    error: writer.failed ? "Couldn't save favorites. Try again." : null,
    canEdit: loaded && writable && !writer.pending,
    add: (id: string) => edit((ids) => (ids.includes(id) ? ids : [...ids, id])),
    remove: (id: string) => edit((ids) => ids.filter((i) => i !== id)),
    // Undo for a removal: back where it was, or at the end if the list has shrunk since.
    restore: (id: string, index: number) =>
      edit((ids) => (ids.includes(id) ? ids : [...ids.slice(0, index), id, ...ids.slice(index)])),
    move: (id: string, by: -1 | 1) =>
      edit((ids) => {
        const from = ids.indexOf(id)
        const to = from + by
        if (from < 0 || to < 0 || to >= ids.length) return ids
        const next = [...ids]
        ;[next[from], next[to]] = [next[to], next[from]]
        return next
      }),
  }
}
