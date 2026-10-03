import { useMemo } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { PersonAvatar } from '../../../domains/person/components/PersonAvatar'
import { personViewModel } from '../../../domains/person/viewModel'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { useEntitiesById } from '../../../infrastructure/entities/useEntitiesById'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useEntityIds } from '../../../infrastructure/entities/useEntityIds'
import { useHaUrl } from '../../../infrastructure/ha/useHaUrl'

const isPerson = (e: HassEntity) => e.entity_id.startsWith('person.')

const sortKey = (id: string, entity: HassEntity | undefined) => {
  const name = entity?.attributes.friendly_name
  return typeof name === 'string' && name ? name : id
}

function Person({ entityId, haUrl }: { entityId: string; haUrl: string }) {
  const entity = useEntity(entityId)
  return <PersonAvatar person={personViewModel(entity, entityId, haUrl)} />
}

// Everyone Home Assistant knows about, by name, unless home.json lists the people to show.
function usePeopleIds(): string[] {
  const listed = useHomeConfig().people
  const known = useEntityIds(isPerson)
  const entities = useEntitiesById(known)
  return useMemo(
    () =>
      listed ??
      [...known].sort((a, b) => sortKey(a, entities[a]).localeCompare(sortKey(b, entities[b]))),
    [listed, known, entities],
  )
}

export function PresenceRow() {
  const haUrl = useHaUrl()
  const people = usePeopleIds()
  // Pictures can't be resolved until the runtime config loads, so wait for it.
  if (!haUrl) return <section aria-label="People" />
  return (
    <section aria-label="People">
      <ul className="presence-row">
        {people.map((id) => (
          <Person key={id} entityId={id} haUrl={haUrl} />
        ))}
      </ul>
    </section>
  )
}
