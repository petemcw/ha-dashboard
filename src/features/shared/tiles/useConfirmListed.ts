import { useHomeConfig } from '../../../config/useHomeConfig'

// Whether home.json's `confirm` list names this entity, by exact entity_id. Tiles and the
// controls on them (drag, details, media buttons) share this one answer, so none of them
// is a one-gesture way around the list.
export function useConfirmListed(entityId: string): boolean {
  return useHomeConfig().confirm.includes(entityId)
}
