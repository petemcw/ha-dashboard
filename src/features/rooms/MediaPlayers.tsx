import { mdiPause, mdiPlay, mdiPower, mdiSkipNext, mdiSkipPrevious, mdiVolumeOff } from '@mdi/js'
import {
  nextTrack,
  pause,
  play,
  previousTrack,
  setPower,
  setVolume,
} from '../../domains/media_player/actions'
import type { MediaPlayerViewModel } from '../../domains/media_player/types'
import { mediaPlayerViewModel } from '../../domains/media_player/viewModel'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useHaUrl } from '../../infrastructure/ha/useHaUrl'
import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'
import { useAction } from '../../infrastructure/serviceGateway/useAction'
import { ActionButton } from '../shared/ActionButton'
import { Artwork } from '../shared/Artwork'
import { ActionError } from '../shared/ActionError'
import { ConfirmAnnouncement } from '../shared/ConfirmAnnouncement'
import { Icon } from '../shared/icons/Icon'
import { SliderTrack } from '../shared/Slider'
import { useSliderGesture } from '../shared/useSliderGesture'
import { useConfirmArm } from '../shared/useConfirmArm'
import { useConfirmListed } from '../shared/tiles/useConfirmListed'
import { STATUS_TEXT } from '../shared/statusText'
import './MediaPlayers.css'

type MediaButtonProps = {
  icon: string
  // "Pause Kitchen speaker": names the button after what it does and which player.
  label: string
  // Set for a confirm-listed player: the first tap arms, only the second sends.
  confirm: boolean
  disabled: boolean
  pending: boolean
  onPress: () => void
}

function MediaButton({ icon, label, confirm, disabled, pending, onPress }: MediaButtonProps) {
  const {
    armed,
    onPress: press,
    buttonProps,
  } = useConfirmArm({ disabled, onConfirm: onPress, required: confirm })
  const name = armed ? `Confirm: ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label
  return (
    <>
      <ActionButton
        className="media-button"
        aria-label={name}
        disabled={disabled}
        pending={pending}
        onPress={press}
        {...buttonProps}
      >
        <Icon path={icon} size={22} />
      </ActionButton>
      {confirm && <ConfirmAnnouncement text={armed ? name : ''} />}
    </>
  )
}

function VolumeSlider({
  name,
  percent,
  muted,
  disabled,
  pending,
  onCommit,
}: {
  name: string
  percent: number
  muted: boolean
  disabled: boolean
  pending: boolean
  onCommit: (percent: number) => void
}) {
  const gesture = useSliderGesture({ value: percent, disabled, pending, onCommit })
  return (
    <div className="media-row__volume">
      <SliderTrack gesture={gesture} label={`${name} volume`} disabled={disabled} />
      {muted && <Icon path={mdiVolumeOff} size={20} title="Muted" />}
    </div>
  )
}

// The power button a collapsed player offers, if any. off and standby are not on yet; idle
// and anything else HA calls on (on, buffering) already are. unavailable, unknown, and missing
// can't be commanded at all.
function powerAction({ playback, supports }: MediaPlayerViewModel) {
  switch (playback) {
    case 'off':
    case 'standby':
      return supports.turnOn ? { on: true, verb: 'Turn on' } : undefined
    case 'idle':
    case 'other':
      return supports.turnOff ? { on: false, verb: 'Turn off' } : undefined
    default:
      return undefined
  }
}

function MediaPlayer({ entityId }: { entityId: string }) {
  const haUrl = useHaUrl()
  const entity = useEntity(entityId)
  const confirmListed = useConfirmListed(entityId)
  // An error clears when HA reports a new state for the player.
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  const p = mediaPlayerViewModel(entity, entityId, haUrl)
  const name = p.friendlyName ?? entityId
  // Power and play/pause honor the confirm list; skipping a track is harmless.
  const button = (
    icon: string,
    label: string,
    action: (g: ServiceGateway) => Promise<unknown>,
    confirm = false,
  ) => (
    <MediaButton
      icon={icon}
      label={label}
      confirm={confirm && confirmListed}
      disabled={!enabled}
      pending={pending}
      onPress={() => run(action)}
    />
  )
  const isActive = p.playback === 'playing' || p.playback === 'paused'
  if (!isActive) {
    const power = powerAction(p)
    const unreachable =
      p.playback === 'unavailable' || p.playback === 'unknown' || p.playback === 'missing'
        ? p.playback
        : undefined
    return (
      <li className="media-chip chip chip--neutral chip--outline" aria-label={name}>
        <span>{name}</span>
        {unreachable && <span className="media-chip__status">{STATUS_TEXT[unreachable]}</span>}
        {power &&
          button(mdiPower, `${power.verb} ${name}`, (g) => setPower(g, entityId, power.on), true)}
        <ActionError failure={failure} />
      </li>
    )
  }
  return (
    <li className="media-row" aria-label={name}>
      <Artwork key={p.artworkUrl ?? ''} url={p.artworkUrl} />
      <div className="media-row__text">
        <div className="media-row__title">{p.title ?? 'Unknown title'}</div>
        {p.artist && <div className="media-row__artist">{p.artist}</div>}
      </div>
      <div className="media-row__buttons">
        {p.supports.previous &&
          button(mdiSkipPrevious, `Previous track on ${name}`, (g) => previousTrack(g, entityId))}
        {p.playback === 'playing' &&
          p.supports.pause &&
          button(mdiPause, `Pause ${name}`, (g) => pause(g, entityId), true)}
        {p.playback === 'paused' &&
          p.supports.play &&
          button(mdiPlay, `Play ${name}`, (g) => play(g, entityId), true)}
        {p.supports.next &&
          button(mdiSkipNext, `Next track on ${name}`, (g) => nextTrack(g, entityId))}
      </div>
      {p.supports.volumeSet && !confirmListed && (
        <VolumeSlider
          name={name}
          percent={p.volumePercent ?? 0}
          muted={p.muted === true}
          disabled={!enabled}
          pending={pending}
          onCommit={(percent) => run((g) => setVolume(g, entityId, percent))}
        />
      )}
      <ActionError failure={failure} />
    </li>
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
