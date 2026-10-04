import type { HassEntity } from 'home-assistant-js-websocket'
import { resolveEntityPicture } from '../entityPicture'
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

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined

// Anything HA reports that we don't model (buffering, on, ...) is 'other', so
// rules never treat an unfamiliar state as playing or paused. Artwork needs the HA URL
// (undefined until the runtime config loads); without it there is no artwork yet.
export function mediaPlayerViewModel(
  entity: HassEntity | undefined,
  entityId = entity?.entity_id ?? '',
  haUrl?: string,
): MediaPlayerViewModel {
  if (!entity) return { entity_id: entityId, playback: 'missing' }
  const playback = KNOWN.find((p) => p === entity.state) ?? 'other'
  const a = entity.attributes
  const volume = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : undefined
  return {
    entity_id: entity.entity_id,
    playback,
    friendlyName: text(a.friendly_name),
    title: text(a.media_title),
    artist: text(a.media_artist) ?? text(a.media_album_name) ?? text(a.app_name),
    artworkUrl: haUrl ? resolveEntityPicture(a.entity_picture, haUrl) : undefined,
    volumePercent: volume,
    muted: typeof a.is_volume_muted === 'boolean' ? a.is_volume_muted : undefined,
  }
}
