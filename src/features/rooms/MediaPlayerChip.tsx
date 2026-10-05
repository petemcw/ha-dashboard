import { mdiPower } from '@mdi/js'
import { setPower } from '../../domains/media_player/actions'
import type { MediaPlayerViewModel } from '../../domains/media_player/types'
import { ActionError } from '../shared/ActionError'
import { STATUS_TEXT } from '../shared/statusText'
import { MediaButton } from './MediaButton'
import type { MediaPlayerControl } from './useMediaPlayer'

// The power button a collapsed player offers, if any. off and standby are not on yet; idle
// and anything else HA calls on (on, buffering) already are. unavailable, unknown, and missing
// can't be commanded at all.
function powerAction({ playback, supports }: MediaPlayerViewModel) {
  switch (playback) {
    case 'off':
    case 'standby':
      return supports.turnOn ? { on: true, verb: 'turn on' } : undefined
    case 'idle':
    case 'other':
      return supports.turnOff ? { on: false, verb: 'turn off' } : undefined
    default:
      return undefined
  }
}

const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// A player that isn't playing or paused: its name, why it can't be reached if it can't, and
// a power button when it supports one. Power honors the confirm list.
export function MediaPlayerChip({ control }: { control: MediaPlayerControl }) {
  const { player, name, entityId } = control
  const power = powerAction(player)
  const unreachable =
    player.playback === 'unavailable' ||
    player.playback === 'unknown' ||
    player.playback === 'missing'
      ? player.playback
      : undefined
  return (
    <li className="media-chip chip chip--neutral chip--outline" aria-label={name}>
      <span>{name}</span>
      {unreachable && <span className="media-chip__status">{STATUS_TEXT[unreachable]}</span>}
      {power && (
        <MediaButton
          control={control}
          icon={mdiPower}
          label={`${capitalized(power.verb)} ${name}`}
          confirm={control.confirm(`${power.verb} ${name}`)}
          send={(gateway) => setPower(gateway, entityId, power.on)}
        />
      )}
      <ActionError failure={control.failure} />
    </li>
  )
}
