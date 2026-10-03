import { useState } from 'react'
import type { PersonViewModel } from '../types'

function describe(vm: PersonViewModel): string {
  switch (vm.presence) {
    case 'home':
      return 'home'
    case 'away':
      return 'away'
    case 'zone':
      return `at ${vm.zoneName}`
    case 'unknown':
      return 'location unknown'
    case 'unavailable':
      return 'unavailable'
    case 'missing':
      return 'missing'
  }
}

// Text, not color, carries the state so it reads on any screen.
function marker(vm: PersonViewModel): string {
  switch (vm.presence) {
    case 'home':
      return 'Home'
    case 'away':
      return 'Away'
    case 'zone':
      return vm.zoneName ?? ''
    case 'unknown':
      return 'Unknown'
    case 'unavailable':
      return 'Unavailable'
    case 'missing':
      return 'Missing'
  }
}

export function PersonAvatar({ person }: { person: PersonViewModel }) {
  // Remember which url failed, so a new picture url gets a fresh try.
  const [failedUrl, setFailedUrl] = useState<string>()
  const showPicture = person.pictureUrl !== undefined && failedUrl !== person.pictureUrl
  return (
    <li
      className={`person person-${person.presence}`}
      aria-label={`${person.name}, ${describe(person)}`}
    >
      <span className="person__avatar" aria-hidden="true">
        {showPicture ? (
          <img
            src={person.pictureUrl}
            alt=""
            width={48}
            height={48}
            onError={() => setFailedUrl(person.pictureUrl)}
          />
        ) : (
          <span data-testid="initials">{person.initials}</span>
        )}
      </span>
      <small aria-hidden="true">{marker(person)}</small>
    </li>
  )
}
