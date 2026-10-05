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

// What the player can do, from HA's supported_features bits. Controls show only these.
export type MediaPlayerSupports = {
  pause: boolean
  play: boolean
  previous: boolean
  next: boolean
  volumeSet: boolean
  turnOn: boolean
  turnOff: boolean
}

export type MediaPlayerViewModel = {
  entity_id: string
  playback: MediaPlayerPlayback
  supports: MediaPlayerSupports
  friendlyName?: string
  title?: string
  artist?: string
  artworkUrl?: string
  volumePercent?: number
  muted?: boolean
}
