import { useMemo } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { useHomeConfig } from '../../config/useHomeConfig'
import { readEntityNow } from '../../infrastructure/entities/readEntityNow'
import { useEntityIds } from '../../infrastructure/entities/useEntityIds'
import { useRegistries } from '../../infrastructure/registries/useRegistries'
import { buildRooms, type RoomsModel } from './roomModel'

// Module constant: useEntityIds shares one scan per predicate.
const anyEntity = (_entity: HassEntity) => true

// Read at build time without subscribing, so a light changing state doesn't rebuild rooms.
const nameOf = (entityId: string) =>
  (readEntityNow(entityId)?.attributes.friendly_name as string | undefined) ?? entityId

// undefined while the registries load or failed, so callers render nothing.
export function useRooms(): RoomsModel | undefined {
  const state = useRegistries()
  const config = useHomeConfig()
  const liveIds = useEntityIds(anyEntity)
  const registries = state.kind === 'ready' ? state.registries : undefined
  return useMemo(
    () => (registries ? buildRooms(registries, new Set(liveIds), config.rooms, nameOf) : undefined),
    [registries, liveIds, config.rooms],
  )
}
