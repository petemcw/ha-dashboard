import { useMemo, useState } from 'react'
import { friendlyName } from '../../domains/entityStatus'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useEntityIds } from '../../infrastructure/entities/useEntityIds'
import { MAX_RESULTS, matchesSearch } from './searchEntities'
import { useFavoritesEditor } from './useFavoritesEditor'

function useName(entityId: string) {
  const entity = useEntity(entityId)
  return { name: friendlyName(entityId, entity), missing: !entity }
}

function Result({ id, disabled, onAdd }: { id: string; disabled: boolean; onAdd: () => void }) {
  const { name } = useName(id)
  return (
    <li>
      <button type="button" disabled={disabled} aria-label={`Add ${name}`} onClick={onAdd}>
        <span>{name}</span> <small>{id}</small>
      </button>
    </li>
  )
}

type ItemProps = {
  id: string
  first: boolean
  last: boolean
  disabled: boolean
  onMove: (by: -1 | 1) => void
  onRemove: () => void
}

function Item({ id, first, last, disabled, onMove, onRemove }: ItemProps) {
  const { name, missing } = useName(id)
  return (
    <li className="favorites-editor__item">
      <span>
        {name}
        {missing && <small> (missing)</small>}
      </span>
      <button
        type="button"
        disabled={disabled || first}
        aria-label={`Move up ${name}`}
        onClick={() => onMove(-1)}
      >
        Move up
      </button>
      <button
        type="button"
        disabled={disabled || last}
        aria-label={`Move down ${name}`}
        onClick={() => onMove(1)}
      >
        Move down
      </button>
      <button type="button" disabled={disabled} aria-label={`Remove ${name}`} onClick={onRemove}>
        Remove
      </button>
    </li>
  )
}

export function FavoritesEditor() {
  const editor = useFavoritesEditor()
  const [query, setQuery] = useState('')
  const { entityIds } = editor
  const predicate = useMemo(
    () => (e: Parameters<typeof matchesSearch>[0]) => matchesSearch(e, query, entityIds),
    [query, entityIds],
  )
  const results = useEntityIds(predicate).slice(0, MAX_RESULTS)

  if (editor.loaded && !editor.writable) {
    return <p>Favorites were saved by a newer version of this app, so they can’t be edited here.</p>
  }

  return (
    <div className="favorites-editor">
      {editor.error && <p role="alert">{editor.error}</p>}
      <ul className="favorites-editor__list" aria-label="Your favorites">
        {entityIds.map((id, i) => (
          <Item
            key={id}
            id={id}
            first={i === 0}
            last={i === entityIds.length - 1}
            disabled={!editor.canEdit}
            onMove={(by) => editor.move(id, by)}
            onRemove={() => editor.remove(id)}
          />
        ))}
      </ul>
      <label>
        Search entities
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or entity ID"
        />
      </label>
      <ul className="favorites-editor__results" aria-label="Search results">
        {results.map((id) => (
          <Result key={id} id={id} disabled={!editor.canEdit} onAdd={() => editor.add(id)} />
        ))}
      </ul>
    </div>
  )
}
