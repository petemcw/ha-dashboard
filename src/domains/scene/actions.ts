import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'

export const activateScene = (
  gateway: ServiceGateway,
  sceneId: string,
  { transition }: { transition?: number } = {},
) =>
  gateway.callService('scene', 'turn_on', transition === undefined ? undefined : { transition }, {
    entity_id: sceneId,
  })
