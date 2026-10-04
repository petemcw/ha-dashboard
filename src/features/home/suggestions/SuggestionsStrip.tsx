import { memo, useId } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { SuggestionButton } from './SuggestionButton'
import { suggestionsFor } from './suggestionRules'

// Hidden entirely when nothing is suggested.
function SuggestionsStripContent() {
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
            <SuggestionButton suggestion={s} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// HomeScreen re-renders on every clock tick and attention change; this section reads
// neither, so it only re-renders for its own data.
export const SuggestionsStrip = memo(SuggestionsStripContent)
