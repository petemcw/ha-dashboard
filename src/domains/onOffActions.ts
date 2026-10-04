import type { ServiceGateway } from '../infrastructure/serviceGateway/serviceGateway'

// The on/off action for every domain whose tile toggles (light, switch, fan), as onOff.ts
// is their shared view model. The HA domain comes from the entity ID.
// Always an explicit turn_on or turn_off, never toggle: the caller picks the direction
// from what the tile showed at tap time, so a double delivery can't flip it back.
export function setOnOff(gateway: ServiceGateway, entityId: string, on: boolean) {
  const domain = entityId.split('.')[0]
  return gateway.callService(domain, on ? 'turn_on' : 'turn_off', undefined, {
    entity_id: entityId,
  })
}
