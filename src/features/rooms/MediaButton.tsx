import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'
import { ActionButton } from '../shared/ActionButton'
import { ConfirmAnnouncement } from '../shared/ConfirmAnnouncement'
import { Icon } from '../shared/icons/Icon'
import { useConfirmArm, type Confirm } from '../shared/useConfirmArm'
import type { MediaPlayerControl } from './useMediaPlayer'

// One icon button on a room media player. With `confirm` (a confirm-listed player), the first
// tap arms and only the second sends, as on tiles.
export function MediaButton({
  control,
  icon,
  label,
  send,
  confirm,
}: {
  control: Pick<MediaPlayerControl, 'enabled' | 'pending' | 'run'>
  icon: string
  // "Pause Kitchen speaker": names the button after what it does and which player.
  label: string
  send: (gateway: ServiceGateway) => Promise<unknown>
  confirm?: Confirm
}) {
  const { armed, onPress, buttonProps } = useConfirmArm({
    disabled: !control.enabled,
    onConfirm: () => control.run(send),
    required: confirm !== undefined,
  })
  const name = armed && confirm ? `Confirm: ${confirm.action}` : label
  return (
    <>
      <ActionButton
        className="media-button"
        aria-label={name}
        disabled={!control.enabled}
        pending={control.pending}
        onPress={onPress}
        {...buttonProps}
      >
        <Icon path={icon} size={22} />
      </ActionButton>
      {confirm && <ConfirmAnnouncement text={armed ? name : ''} />}
    </>
  )
}
