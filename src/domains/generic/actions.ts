import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'

// Declared here rather than imported from config: domains never depend on src/config/.
export type EntityAction = { domain: string; service: string; entity_id: string }

export const runEntityAction = (gateway: ServiceGateway, action: EntityAction) =>
  gateway.callService(action.domain, action.service, undefined, { entity_id: action.entity_id })
