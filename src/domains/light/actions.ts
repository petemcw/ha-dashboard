import { setOnOff } from '../onOffActions'
import type { ServiceGateway } from '../../infrastructure/serviceGateway/serviceGateway'

// Sets brightness with one light.turn_on (which also turns the light on). 0% is a
// turn_off: HA rejects brightness_pct 0 on some lights and treats it as off on others.
export function setBrightness(gateway: ServiceGateway, entityId: string, percent: number) {
  if (percent <= 0) return setOnOff(gateway, entityId, false)
  return gateway.callService(
    'light',
    'turn_on',
    { brightness_pct: Math.min(100, percent) },
    {
      entity_id: entityId,
    },
  )
}

// light.turn_on with a value also turns an off light on, so no separate on call is needed.
export function setColorTemp(gateway: ServiceGateway, entityId: string, kelvin: number) {
  return gateway.callService(
    'light',
    'turn_on',
    { color_temp_kelvin: kelvin },
    { entity_id: entityId },
  )
}

// hs is [hue 0-360, saturation 0-100].
export function setColor(gateway: ServiceGateway, entityId: string, hs: [number, number]) {
  return gateway.callService('light', 'turn_on', { hs_color: hs }, { entity_id: entityId })
}
