import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'

// Explicit services, never media_play_pause or toggle: the caller picks the direction from
// what the row showed at tap time, so a double delivery can't flip it back.
const send = (gateway: ServiceGateway, service: string, entityId: string) =>
  gateway.callService('media_player', service, undefined, { entity_id: entityId })

export const play = (gateway: ServiceGateway, entityId: string) =>
  send(gateway, 'media_play', entityId)
export const pause = (gateway: ServiceGateway, entityId: string) =>
  send(gateway, 'media_pause', entityId)
export const nextTrack = (gateway: ServiceGateway, entityId: string) =>
  send(gateway, 'media_next_track', entityId)
export const previousTrack = (gateway: ServiceGateway, entityId: string) =>
  send(gateway, 'media_previous_track', entityId)
export const setPower = (gateway: ServiceGateway, entityId: string, on: boolean) =>
  send(gateway, on ? 'turn_on' : 'turn_off', entityId)

// HA's volume_level is a 0-1 float; the slider works in whole percents.
export const setVolume = (gateway: ServiceGateway, entityId: string, percent: number) =>
  gateway.callService(
    'media_player',
    'volume_set',
    { volume_level: percent / 100 },
    { entity_id: entityId },
  )
