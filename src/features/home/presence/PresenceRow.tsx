import { PersonAvatar } from '../../../domains/person/components/PersonAvatar'
import { personViewModel } from '../../../domains/person/viewModel'
import { people } from '../../../config/home'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useHaUrl } from '../../../infrastructure/ha/useHaUrl'

function Person({ entityId, haUrl }: { entityId: string; haUrl: string }) {
  const entity = useEntity(entityId)
  return <PersonAvatar person={personViewModel(entity, entityId, haUrl)} />
}

export function PresenceRow() {
  const haUrl = useHaUrl()
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
