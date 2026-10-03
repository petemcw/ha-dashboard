import type { HassEntity } from 'home-assistant-js-websocket'
import type { MediaPlayerPlayback, MediaPlayerViewModel } from './types'

const KNOWN: readonly MediaPlayerPlayback[] = [
  'playing',
  'paused',
  'idle',
  'off',
  'standby',
  'unavailable',
  'unknown',
]

// Anything HA reports that we don't model (buffering, on, ...) is 'other', so
// rules never treat an unfamiliar state as playing or paused.
export function mediaPlayerViewModel(
  entity: HassEntity | undefined,
  entityId = entity?.entity_id ?? '',
): MediaPlayerViewModel {
  if (!entity) return { entity_id: entityId, playback: 'missing' }
  const playback = KNOWN.find((p) => p === entity.state) ?? 'other'
  return { entity_id: entity.entity_id, playback }
}
