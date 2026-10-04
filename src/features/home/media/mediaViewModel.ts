import type { MediaPlayerPlayback, MediaPlayerViewModel } from '../../../domains/media_player/types'

export type MediaPlayerChip = { entity_id: string; label: string }

export type MediaCardViewModel = {
  featured?: MediaPlayerViewModel & { room: string }
  chips: MediaPlayerChip[]
  playingCount: number
}

const PLAYBACK_LABEL: Record<MediaPlayerPlayback, string> = {
  playing: 'Playing',
  paused: 'Paused',
  idle: 'Idle',
  off: 'Off',
  standby: 'Off',
  other: 'Idle',
  unavailable: 'Unavailable',
  unknown: 'Unavailable',
  missing: 'Missing',
}

// A missing player has no friendly_name, so read one off the entity id.
function nameOf(player: MediaPlayerViewModel): string {
  if (player.friendlyName) return player.friendlyName
  return player.entity_id
    .replace(/^media_player\./, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// The first player that's playing is featured, else the first that's paused; the rest
// (including a second playing one) become state chips.
export function mediaCardViewModel(players: MediaPlayerViewModel[]): MediaCardViewModel {
  const featured =
    players.find((p) => p.playback === 'playing') ?? players.find((p) => p.playback === 'paused')
  return {
    featured: featured && { ...featured, room: nameOf(featured) },
    chips: players
      .filter((p) => p !== featured)
      .map((p) => ({
        entity_id: p.entity_id,
        label: `${nameOf(p)} · ${PLAYBACK_LABEL[p.playback]}`,
      })),
    playingCount: players.filter((p) => p.playback === 'playing').length,
  }
}
