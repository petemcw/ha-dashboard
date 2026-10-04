import { Sparkles } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import type { MediaPlayerPlayback } from '../../../domains/media_player/types'
import { mediaPlayerViewModel } from '../../../domains/media_player/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { Chip } from '../../shared/Chip'
import { SectionCard } from '../SectionCard'
import { SuggestionButton } from './SuggestionButton'
import { suggestionsFor } from './suggestionRules'
import './SuggestionsStrip.css'

// Why there's a suggestion: the player's state. Only playing and paused suggest anything.
const PLAYER_CHIP: Partial<Record<MediaPlayerPlayback, ReactNode>> = {
  playing: (
    <Chip tone="leaf" dot>
      Playing
    </Chip>
  ),
  paused: <Chip>Paused</Chip>,
}

// Hidden entirely when nothing is suggested.
function SuggestionsStripContent() {
  const { suggestions } = useHomeConfig()
  const entity = useEntity(suggestions.player)
  const { playback } = mediaPlayerViewModel(entity, suggestions.player)
  const items = suggestionsFor(playback, suggestions)
  if (items.length === 0) return null

  return (
    <SectionCard
      title="Suggested"
      icon={Sparkles}
      className="suggestions"
      chip={PLAYER_CHIP[playback]}
    >
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
