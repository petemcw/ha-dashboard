import { useDeferredValue, useMemo, useState } from 'react'
import { friendlyName } from '../../domains/entityStatus'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useEntityIds } from '../../infrastructure/entities/useEntityIds'
import { InlineUndoNotice } from '../shared/InlineUndoNotice'
import { entitySearch, MAX_RESULTS } from './searchEntities'
import { useFavoritesEditor } from './useFavoritesEditor'
import './FavoritesEditor.css'

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
  onRemove: (name: string) => void
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
      <button
        type="button"
        disabled={disabled}
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
      >
        Remove
      </button>
    </li>
  )
}

export function FavoritesEditor() {
  const editor = useFavoritesEditor()
  const [query, setQuery] = useState('')
  // Removing is one tap with no "are you sure?"; the notice offers the way back instead.
  const [removed, setRemoved] = useState<{ id: string; index: number; name: string }>()
  const { entityIds } = editor
  // Each search scans every entity in the house, so it trails the input instead of
  // holding up each keystroke on a slow tablet.
  const deferredQuery = useDeferredValue(query)
  const predicate = useMemo(
    () => entitySearch(deferredQuery, entityIds),
    [deferredQuery, entityIds],
  )
  const results = useEntityIds(predicate).slice(0, MAX_RESULTS)

  if (editor.loaded && !editor.writable) {
    return <p>Favorites were saved by a newer version of this app, so they can’t be edited here.</p>
  }

  return (
    <div className="favorites-editor">
      {editor.error && <p role="alert">{editor.error}</p>}
      {removed && !editor.error && (
        <InlineUndoNotice
          key={removed.id}
          message={`Removed ${removed.name}`}
          undoDisabled={!editor.canEdit}
          onUndo={() => {
            editor.restore(removed.id, removed.index)
            setRemoved(undefined)
          }}
          onDismiss={() => setRemoved(undefined)}
        />
      )}
      <ul className="favorites-editor__list" aria-label="Your favorites">
        {entityIds.map((id, i) => (
          <Item
            key={id}
            id={id}
            first={i === 0}
            last={i === entityIds.length - 1}
            disabled={!editor.canEdit}
            onMove={(by) => editor.move(id, by)}
            onRemove={(name) => {
              editor.remove(id)
              setRemoved({ id, index: i, name })
            }}
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
