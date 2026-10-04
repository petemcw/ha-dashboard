import { useId } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { suggestionsFor } from './suggestionRules'

// Hidden entirely when nothing is suggested. In v1 the buttons stay disabled:
// running a scene changes devices. The scene id and transition stay in config
// for the controls phase.
export function SuggestionsStrip() {
  const { suggestions } = useHomeConfig()
  const entity = useEntity(suggestions.player)
  const hintId = useId()
  const { playback } = mediaPlayerViewModel(entity, suggestions.player)
  const items = suggestionsFor(playback, suggestions)
  if (items.length === 0) return null

  return (
    <section aria-labelledby={`${hintId}-heading`} className="card suggestions">
      <header className="card__header">
        <h2 id={`${hintId}-heading`} className="card__title">
          Suggestions
        </h2>
      </header>
      <ul className="suggestions__list">
        {items.map((s) => (
          <li key={s.id}>
            <button type="button" disabled aria-describedby={hintId} className="suggestion">
              {s.label}
            </button>
          </li>
        ))}
      </ul>
      <p id={hintId} className="suggestions-hint">
        Available when controls are enabled
      </p>
    </section>
  )
}
