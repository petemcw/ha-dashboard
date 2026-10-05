import type { HassEntity } from 'home-assistant-js-websocket'
import { resolveEntityPicture } from '../entityPicture'
import type { MediaPlayerPlayback, MediaPlayerSupports, MediaPlayerViewModel } from './types'

const KNOWN: readonly MediaPlayerPlayback[] = [
  'playing',
  'paused',
  'idle',
  'off',
  'standby',
  'unavailable',
  'unknown',
]

// HA's MediaPlayerEntityFeature bits.
const FEATURE = {
  pause: 1,
  volumeSet: 4,
  previous: 16,
  next: 32,
  turnOn: 128,
  turnOff: 256,
  play: 16384,
} satisfies Record<keyof MediaPlayerSupports, number>

function supportsOf(features: unknown): MediaPlayerSupports {
  const bits = typeof features === 'number' ? features : 0
  const has = (bit: number) => (bits & bit) !== 0
  return {
    pause: has(FEATURE.pause),
    play: has(FEATURE.play),
    previous: has(FEATURE.previous),
    next: has(FEATURE.next),
    volumeSet: has(FEATURE.volumeSet),
    turnOn: has(FEATURE.turnOn),
    turnOff: has(FEATURE.turnOff),
  }
}

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
  if (!entity) return { entity_id: entityId, playback: 'missing', supports: supportsOf(undefined) }
  const playback = KNOWN.find((p) => p === entity.state) ?? 'other'
  const a = entity.attributes
  const volume = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : undefined
  return {
    entity_id: entity.entity_id,
    playback,
    supports: supportsOf(a.supported_features),
    friendlyName: text(a.friendly_name),
    title: text(a.media_title),
    artist: text(a.media_artist) ?? text(a.media_album_name) ?? text(a.app_name),
    artworkUrl: haUrl ? resolveEntityPicture(a.entity_picture, haUrl) : undefined,
    volumePercent: volume,
    muted: typeof a.is_volume_muted === 'boolean' ? a.is_volume_muted : undefined,
  }
}
