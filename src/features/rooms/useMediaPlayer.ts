import { mediaPlayerViewModel } from '../../domains/media_player/viewModel'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { useHaUrl } from '../../infrastructure/ha/useHaUrl'
import { useAction } from '../../infrastructure/serviceGateway/useAction'
import type { Confirm } from '../shared/useConfirmArm'
import { useConfirmListed } from '../shared/tiles/useConfirmListed'

// One room media player: its view model, its name, and one action state shared by all its
// buttons (an error clears when HA reports a new state for the player).
export function useMediaPlayer(entityId: string) {
  const haUrl = useHaUrl()
  const entity = useEntity(entityId)
  const confirmListed = useConfirmListed(entityId)
  const { enabled, pending, failure, run } = useAction({ clearKey: entity?.state })
  const player = mediaPlayerViewModel(entity, entityId, haUrl)
  return {
    entityId,
    player,
    name: player.friendlyName ?? entityId,
    confirmListed,
    enabled,
    pending,
    failure,
    run,
    // The two-tap guard for an action on a confirm-listed player; none for any other.
    confirm: (action: string): Confirm | undefined => (confirmListed ? { action } : undefined),
  }
}

export type MediaPlayerControl = ReturnType<typeof useMediaPlayer>
