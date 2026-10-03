export type MediaPlayerPlayback =
  | 'playing'
  | 'paused'
  | 'idle'
  | 'off'
  | 'standby'
  | 'other'
  | 'unavailable'
  | 'unknown'
  | 'missing'

export type MediaPlayerViewModel = {
  entity_id: string
  playback: MediaPlayerPlayback
}
