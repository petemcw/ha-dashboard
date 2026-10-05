import type { HassEntity } from 'home-assistant-js-websocket'
import type { RoomsConfig } from '../../config/homeConfig'
import { useHomeConfig } from '../../config/useHomeConfig'
import { readEntityNow } from '../../infrastructure/entities/readEntityNow'
import { useEntityIds } from '../../infrastructure/entities/useEntityIds'
import type { Registries } from '../../infrastructure/registries/registries'
import { useRegistries } from '../../infrastructure/registries/useRegistries'
import { buildRooms, type RoomsModel } from './roomModel'

// Module constant: useEntityIds shares one scan per predicate.
const anyEntity = (_entity: HassEntity) => true

// Read at build time without subscribing, so a light changing state doesn't rebuild rooms.
const nameOf = (entityId: string) =>
  (readEntityNow(entityId)?.attributes.friendly_name as string | undefined) ?? entityId

// The last build, shared by every caller: the selector and the room card both need rooms,
// and they get the same inputs (the registry store's object, useEntityIds' shared array, the
// one config), so one build per change serves both instead of one each.
let last:
  { registries: Registries; liveIds: string[]; config: RoomsConfig; model: RoomsModel } | undefined

function roomsFor(registries: Registries, liveIds: string[], config: RoomsConfig) {
  if (last?.registries === registries && last.liveIds === liveIds && last.config === config) {
    return last.model
  }
  const model = buildRooms(registries, new Set(liveIds), config, nameOf)
  last = { registries, liveIds, config, model }
  return model
}

// undefined while the registries load or failed, so callers render nothing.
export function useRooms(): RoomsModel | undefined {
  const state = useRegistries()
  const config = useHomeConfig()
  const liveIds = useEntityIds(anyEntity)
  return state.kind === 'ready' ? roomsFor(state.registries, liveIds, config.rooms) : undefined
}
