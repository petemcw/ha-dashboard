import type { HassEntity } from 'home-assistant-js-websocket'
import { testHomeConfig } from '../../config/testHomeConfig'
import { binarySensorState } from '../../domains/binary_sensor/factories'
import { fanState } from '../../domains/fan/factories'
import { lightState } from '../../domains/light/factories'
import { mediaPlayer } from '../../domains/media_player/factories'
import { personState } from '../../domains/person/factories'
import { sceneState } from '../../domains/scene/factories'
import { scriptState } from '../../domains/script/factories'
import { batterySensorState, sensorState } from '../../domains/sensor/factories'
import { switchState } from '../../domains/switch/factories'
import { calmHouse } from '../../features/home/attention/factories'
import { FAVORITES_KEY, serializeFavorites } from '../../features/home/favorites/favoritesValue'
import type {
  FakeHaOptions,
  FakeHouse,
  ServiceCall,
  StatisticPoint,
} from '../../infrastructure/fakeHa/fakeHa'

// A generic placeholder house for demo mode. It lives in the app, not infrastructure,
// because it is built from domain factories. People have no entity_picture, so the demo
// never requests an image from anywhere.

const MINUTE = 60
const HOUR = 3600
const CRYPTO_PRICES = { BTC: 64000, ETH: 3200, SOL: 150 }
const DEMO_FILTER_DAYS_REMAINING = '3'
const REPLACED_FILTER_DAYS_REMAINING = '90'

export const FAVORITE_IDS = [
  'light.living_room_lamp',
  'switch.porch_plug',
  'fan.bedroom_fan',
  'scene.living_room_bright',
  'script.good_night',
]

export function demoEntities(now: number = Date.now()): HassEntity[] {
  const since = (seconds: number) => Math.floor(now / 1000) - seconds
  const { suggestions, crypto, filterRules } = testHomeConfig
  const overrides: HassEntity[] = [
    personState({ entity_id: 'person.alex_rivera', friendly_name: 'Alex Rivera', state: 'home' }),
    personState({ entity_id: 'person.sam_lee', friendly_name: 'Sam Lee', state: 'not_home' }),
    personState({ entity_id: 'person.jo_park', friendly_name: 'Jo Park', state: 'home' }),
    // Past the rule's 10 minutes, and the heater past its 60.
    binarySensorState({
      entity_id: 'binary_sensor.garage_door',
      state: 'on',
      last_changed: since(25 * MINUTE),
    }),
    switchState({ entity_id: 'switch.garage_door_opener' }),
    switchState({
      entity_id: 'switch.space_heater',
      state: 'on',
      last_changed: since(2 * HOUR),
      attributes: { friendly_name: 'Space heater' },
    }),
    sensorState({ entity_id: filterRules[0].entity_id, state: DEMO_FILTER_DAYS_REMAINING }),
    batterySensorState({
      entity_id: 'sensor.hallway_sensor_battery',
      state: '12',
      attributes: { friendly_name: 'Hallway sensor battery' },
    }),
    mediaPlayer('playing', { entity_id: suggestions.player }),
    lightState({
      entity_id: 'light.living_room_lamp',
      state: 'off',
      attributes: { friendly_name: 'Living room lamp', supported_color_modes: ['brightness'] },
    }),
    switchState({ entity_id: 'switch.porch_plug', attributes: { friendly_name: 'Porch plug' } }),
    fanState({ entity_id: 'fan.bedroom_fan', attributes: { friendly_name: 'Bedroom fan' } }),
    sceneState({
      entity_id: suggestions.playing.scene,
      attributes: { friendly_name: 'Living room movie' },
    }),
    sceneState({
      entity_id: suggestions.paused.scene,
      attributes: { friendly_name: 'Living room bright' },
    }),
    scriptState({ entity_id: 'script.good_night', attributes: { friendly_name: 'Good night' } }),
    ...filterRules.map((r) =>
      scriptState({ entity_id: r.resetScript, attributes: { friendly_name: r.label } }),
    ),
    ...crypto.map((c) =>
      sensorState({
        entity_id: c.entity_id,
        state: String(CRYPTO_PRICES[c.symbol as keyof typeof CRYPTO_PRICES]),
      }),
    ),
  ]
  // Calm defaults for everything the rules read, then the demo's own on top.
  const byId = new Map(calmHouse().map((e) => [e.entity_id, e]))
  for (const e of overrides) byId.set(e.entity_id, e)
  return [...byId.values()]
}

export function demoStatistics(now: number = Date.now()): Record<string, StatisticPoint[]> {
  const HOUR_MS = HOUR * 1000
  return Object.fromEntries(
    testHomeConfig.crypto.map((c) => {
      const price = CRYPTO_PRICES[c.symbol as keyof typeof CRYPTO_PRICES]
      return [
        c.entity_id,
        Array.from({ length: 24 }, (_, i) => ({
          start: now - (24 - i) * HOUR_MS,
          end: now - (23 - i) * HOUR_MS,
          mean: price * (0.96 + 0.04 * Math.sin(i / 3) + i * 0.0015),
        })),
      ]
    }),
  )
}

const DEMO_RESPONSE_DELAY_MS = 600

// What a tap does beyond flipping the target, so the demo looks like the real house: the
// garage opener closes the door sensor, and a reset script refills its filter.
function demoServiceEffects(call: ServiceCall, house: FakeHouse): HassEntity[] {
  const { leftOnRules, filterRules } = testHomeConfig
  const touches = (id: string) => call.entityIds.includes(id)
  const set = (entityId: string, state: string) => {
    const entity = house.getState(entityId)
    return entity ? [{ ...entity, state, last_changed: new Date().toISOString() }] : []
  }
  const opened = leftOnRules.filter(
    (r) => r.entity_id.startsWith('binary_sensor.') && touches(r.action.entity_id),
  )
  const reset = filterRules.filter((r) => call.domain === 'script' && touches(r.resetScript))
  return [
    ...opened.flatMap((r) => set(r.entity_id, 'off')),
    ...reset.flatMap((r) => set(r.entity_id, REPLACED_FILTER_DAYS_REMAINING)),
  ]
}

export function demoHouse(now: number = Date.now()): FakeHaOptions {
  return {
    entities: demoEntities(now),
    statistics: demoStatistics(now),
    responseDelayMs: DEMO_RESPONSE_DELAY_MS,
    onServiceCall: demoServiceEffects,
    userData: { [FAVORITES_KEY]: serializeFavorites(FAVORITE_IDS) },
  }
}
