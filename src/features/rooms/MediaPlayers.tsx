import { MediaPlayerChip } from './MediaPlayerChip'
import { MediaPlayerRow } from './MediaPlayerRow'
import { useMediaPlayer } from './useMediaPlayer'
import './MediaPlayers.css'

// What is playing (or paused) gets a row; anything else, a chip.
function MediaPlayer({ entityId }: { entityId: string }) {
  const control = useMediaPlayer(entityId)
  const { playback } = control.player
  return playback === 'playing' || playback === 'paused' ? (
    <MediaPlayerRow control={control} />
  ) : (
    <MediaPlayerChip control={control} />
  )
}

// A room's media players: what is playing as rows, the rest as chips.
export function MediaPlayers({ entityIds }: { entityIds: string[] }) {
  return (
    <ul className="media-players-list">
      {entityIds.map((id) => (
        <MediaPlayer key={id} entityId={id} />
      ))}
    </ul>
  )
}
