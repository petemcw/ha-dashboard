import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'

export const runScript = (gateway: ServiceGateway, scriptId: string) =>
  gateway.callService('script', 'turn_on', undefined, { entity_id: scriptId })
