import { mdiPause, mdiPlay, mdiSkipNext, mdiSkipPrevious, mdiVolumeOff } from '@mdi/js'
import {
  nextTrack,
  pause,
  play,
  previousTrack,
  setVolume,
} from '../../domains/media_player/actions'
import { ActionError } from '../shared/ActionError'
import { Artwork } from '../shared/Artwork'
import { Icon } from '../shared/icons/Icon'
import { SliderTrack } from '../shared/Slider'
import { useSliderGesture } from '../shared/useSliderGesture'
import { MediaButton } from './MediaButton'
import type { MediaPlayerControl } from './useMediaPlayer'

function VolumeSlider({ control }: { control: MediaPlayerControl }) {
  const { player, name, entityId, enabled, pending, run } = control
  const gesture = useSliderGesture({
    value: player.volumePercent ?? 0,
    disabled: !enabled,
    pending,
    onCommit: (percent) => run((gateway) => setVolume(gateway, entityId, percent)),
  })
  return (
    <div className="media-row__volume">
      <SliderTrack gesture={gesture} label={`${name} volume`} disabled={!enabled} />
      {player.muted === true && <Icon path={mdiVolumeOff} size={20} title="Muted" />}
    </div>
  )
}

// A playing or paused player: artwork, what's on, transport, and volume. Play and pause honor
// the confirm list; skipping a track is harmless. A confirm-listed player gets no slider,
// which would be a one-gesture way in.
export function MediaPlayerRow({ control }: { control: MediaPlayerControl }) {
  const { player, name, entityId } = control
  const { supports } = player
  return (
    <li className="media-row" aria-label={name}>
      <Artwork key={player.artworkUrl ?? ''} url={player.artworkUrl} />
      <div className="media-row__text">
        <div className="media-row__title">{player.title ?? 'Unknown title'}</div>
        {player.artist && <div className="media-row__artist">{player.artist}</div>}
      </div>
      <div className="media-row__buttons">
        {supports.previous && (
          <MediaButton
            control={control}
            icon={mdiSkipPrevious}
            label={`Previous track on ${name}`}
            send={(gateway) => previousTrack(gateway, entityId)}
          />
        )}
        {player.playback === 'playing' && supports.pause && (
          <MediaButton
            control={control}
            icon={mdiPause}
            label={`Pause ${name}`}
            confirm={control.confirm(`pause ${name}`)}
            send={(gateway) => pause(gateway, entityId)}
          />
        )}
        {player.playback === 'paused' && supports.play && (
          <MediaButton
            control={control}
            icon={mdiPlay}
            label={`Play ${name}`}
            confirm={control.confirm(`play ${name}`)}
            send={(gateway) => play(gateway, entityId)}
          />
        )}
        {supports.next && (
          <MediaButton
            control={control}
            icon={mdiSkipNext}
            label={`Next track on ${name}`}
            send={(gateway) => nextTrack(gateway, entityId)}
          />
        )}
      </div>
      {supports.volumeSet && !control.confirmListed && <VolumeSlider control={control} />}
      <ActionError failure={control.failure} />
    </li>
  )
}
