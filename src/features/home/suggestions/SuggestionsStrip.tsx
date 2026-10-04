import { Sparkles } from 'lucide-react'
import { memo } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { SectionCard } from '../SectionCard'
import { SuggestionButton } from './SuggestionButton'
import { suggestionsFor } from './suggestionRules'

// Hidden entirely when nothing is suggested.
function SuggestionsStripContent() {
  const { suggestions } = useHomeConfig()
  const entity = useEntity(suggestions.player)
  const { playback } = mediaPlayerViewModel(entity, suggestions.player)
  const items = suggestionsFor(playback, suggestions)
  if (items.length === 0) return null

  return (
    <SectionCard title="Suggested" icon={Sparkles} className="suggestions">
      <ul className="suggestions__list">
        {items.map((s) => (
          <li key={s.id}>
            <SuggestionButton suggestion={s} />
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

// HomeScreen re-renders on every clock tick and attention change; this section reads
// neither, so it only re-renders for its own data.
export const SuggestionsStrip = memo(SuggestionsStripContent)
