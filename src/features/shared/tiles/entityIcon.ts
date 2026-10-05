import type { HassEntity } from 'home-assistant-js-websocket'
import { domainIcon } from '../icons/domainIcons'
import { iconForHa } from '../icons/haIcons'

// Decorative: the entity's own HA icon when it sets one (HA only puts `icon` in attributes
// then), else the default for its HA domain.
export function entityIcon(entityId: string, entity?: HassEntity): string {
  return iconForHa(entity?.attributes.icon as string | undefined, domainIcon(entityId))
}
