import type { MediaPlayerPlayback } from '../../../domains/media_player/types'
import type { SuggestionsConfig } from '../../../config/homeConfig'

// `id` is the scene to activate.
export type Suggestion = { id: string; label: string; transition?: number }

// Dim only while playing, brighten only while paused; every other state
// (idle, off, standby, unavailable, unknown, missing, other) suggests nothing.
export function suggestionsFor(
  playback: MediaPlayerPlayback,
  config: SuggestionsConfig,
): Suggestion[] {
  if (playback === 'playing')
    return [
      {
        id: config.playing.scene,
        label: config.playing.label,
        transition: config.playing.transition,
      },
    ]
  if (playback === 'paused') return [{ id: config.paused.scene, label: config.paused.label }]
  return []
}
