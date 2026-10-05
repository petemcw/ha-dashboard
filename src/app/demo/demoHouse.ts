import type { HassEntity } from 'home-assistant-js-websocket'
import { testHomeConfig } from '../../config/testHomeConfig'
import { binarySensorState } from '../../domains/binary_sensor/factories'
import { fanState } from '../../domains/fan/factories'
import { lightState } from '../../domains/light/factories'
import { inputBooleanState } from '../../domains/input_boolean/factories'
import { mediaPlayer } from '../../domains/media_player/factories'
import { personState } from '../../domains/person/factories'
import { sunState } from '../../domains/sun/factories'
import { weatherState } from '../../domains/weather/factories'
import { updateState } from '../../domains/update/factories'
import { sceneState } from '../../domains/scene/factories'
import { scriptState } from '../../domains/script/factories'
import { batterySensorState, sensorState } from '../../domains/sensor/factories'
import { switchState } from '../../domains/switch/factories'
import { calmHouse } from '../../features/home/attention/factories'
import { FAVORITES_KEY, serializeFavorites } from '../../features/home/favorites/favoritesValue'
import {
  PLACEHOLDER_AREAS,
  PLACEHOLDER_FLOORS,
  placeRegistries,
} from '../../infrastructure/fakeHa/placeholderRegistries'
import type {
  FakeHaOptions,
  FakeHouse,
  Forecasts,
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

const iso = (ms: number) => new Date(ms).toISOString()

// The next time the local clock reads hour:minute, today or (once it has passed) tomorrow.
function nextLocal(now: number, hour: number, minute: number): Date {
  const at = new Date(now)
  at.setHours(hour, minute, 0, 0)
  if (at.getTime() <= now) at.setDate(at.getDate() + 1)
  return at
}

// The last time the local clock read hour:minute, today or (if not yet) yesterday.
function lastLocal(now: number, hour: number, minute: number): Date {
  const at = new Date(now)
  at.setHours(hour, minute, 0, 0)
  if (at.getTime() > now) at.setDate(at.getDate() - 1)
  return at
}

function demoToday(now: number): HassEntity[] {
  const { weather } = testHomeConfig
  if (!weather) return []
  return [
    weatherState('partlycloudy', { entity_id: weather.entity_id }),
    // An evening sunset, as in the mock-up. The card reads only next_setting, not the state.
    sunState(nextLocal(now, 18, 50).toISOString(), 'above_horizon', weather.sun),
  ]
}

function demoSystems(now: number): HassEntity[] {
  const { systems } = testHomeConfig
  if (!systems) return []
  const { status, uptime, accessPoints, backup, cpu } = systems
  const up = accessPoints?.upState ?? 'connected'
  const apIds = accessPoints?.entity_ids ?? []
  return [
    sensorState({ entity_id: status.entity_id, state: status.upState }),
    ...(uptime
      ? [sensorState({ entity_id: uptime.entity_id, state: iso(now - 19 * 24 * HOUR * 1000) })]
      : []),
    // One access point is down so the tile reads like "3/4".
    ...apIds.map((id, i) => sensorState({ entity_id: id, state: i === 0 ? 'disconnected' : up })),
    // A nightly backup, so the tile reads like "Today, 3:10 am".
    ...(backup
      ? [sensorState({ entity_id: backup, state: lastLocal(now, 3, 10).toISOString() })]
      : []),
    ...(cpu ?? []).map((c, i) =>
      sensorState({ entity_id: c.entity_id, state: String(18 + i * 31) }),
    ),
    updateState({ entity_id: 'update.demo_app', state: 'on' }),
    updateState({ entity_id: 'update.demo_firmware' }),
  ]
}

// The configured players in order: the first plays, the rest show as chips. No
// entity_picture anywhere, so the Media card shows its placeholder and requests nothing.
// Media player feature bits: pause 1, volume set 4, previous 16, next 32, turn on 128,
// turn off 256, play 16384.
const FULL_PLAYER = 1 + 4 + 16 + 32 + 128 + 256 + 16384

const DEMO_PLAYERS: { state: string; attributes: Record<string, unknown> }[] = [
  {
    state: 'playing',
    attributes: {
      friendly_name: 'Living room speaker',
      media_title: 'Demo Song',
      media_artist: 'Demo Band',
      volume_level: 0.3,
      supported_features: FULL_PLAYER,
    },
  },
  {
    state: 'off',
    attributes: { friendly_name: 'Kitchen speaker', supported_features: FULL_PLAYER },
  },
  { state: 'off', attributes: { friendly_name: 'Family room TV' } },
  { state: 'idle', attributes: { friendly_name: 'Receiver', supported_features: FULL_PLAYER } },
]

function demoMediaPlayers(): HassEntity[] {
  return (testHomeConfig.media?.players ?? []).map((id, i) => {
    const { state, attributes } = DEMO_PLAYERS[i] ?? { state: 'idle', attributes: {} }
    return mediaPlayer(state, { entity_id: id, attributes })
  })
}

// Entities that exist for the demo's rooms: the living room's header readings and one of
// each control kind, so the room card has something to dim, toggle, and play. Placed in
// areas by DEMO_PLACEMENT.
function demoRoomEntities(): HassEntity[] {
  const { rooms } = testHomeConfig
  const living = PLACEHOLDER_AREAS.find((a) => a.area_id === 'living_room')
  return [
    sensorState({
      entity_id: living?.temperature_entity_id ?? 'sensor.living_room_temperature',
      state: '71.5',
      attributes: { device_class: 'temperature', unit_of_measurement: '°F' },
    }),
    sensorState({
      entity_id: living?.humidity_entity_id ?? 'sensor.living_room_humidity',
      state: '42',
      attributes: { device_class: 'humidity', unit_of_measurement: '%' },
    }),
    // Dims and does color temperature and color.
    lightState({
      entity_id: 'light.living_room_strip',
      state: 'on',
      attributes: {
        friendly_name: 'Living room strip',
        supported_color_modes: ['color_temp', 'hs'],
        color_mode: 'color_temp',
        color_temp_kelvin: 3000,
        min_color_temp_kelvin: 2000,
        max_color_temp_kelvin: 6500,
        brightness: 200,
      },
    }),
    // Temperature only.
    lightState({
      entity_id: 'light.living_room_floor',
      attributes: {
        friendly_name: 'Living room floor lamp',
        supported_color_modes: ['color_temp'],
        color_mode: 'color_temp',
        color_temp_kelvin: 3500,
        min_color_temp_kelvin: 2200,
        max_color_temp_kelvin: 5000,
        brightness: 150,
      },
    }),
    // On and off only.
    lightState({
      entity_id: 'light.living_room_accent',
      attributes: { friendly_name: 'Living room accent', supported_color_modes: ['onoff'] },
    }),
    lightState({
      entity_id: 'light.kitchen_pendant',
      attributes: { friendly_name: 'Kitchen pendant', supported_color_modes: ['onoff'] },
    }),
    switchState({
      entity_id: 'switch.living_room_fountain',
      attributes: { friendly_name: 'Living room fountain' },
    }),
    inputBooleanState({
      entity_id: 'input_boolean.movie_night',
      attributes: { friendly_name: 'Movie night' },
    }),
    // Configured to be left out of the living room, so it never shows there.
    ...(rooms?.areas?.living_room?.remove ?? []).map((id) =>
      switchState({ entity_id: id, attributes: { friendly_name: 'Unused plug' } }),
    ),
  ]
}

// Which demo entities sit in which area. The suggestion scenes and the speakers are the
// ones the rest of the demo already seeds.
const DEMO_PLACEMENT: Record<string, string[]> = {
  living_room: [
    'light.living_room_lamp',
    'light.living_room_strip',
    'light.living_room_floor',
    'light.living_room_accent',
    'switch.living_room_fountain',
    'input_boolean.movie_night',
    'scene.living_room_movie',
    'scene.living_room_bright',
    'media_player.living_room_speaker',
    'media_player.receiver',
  ],
  kitchen: ['media_player.kitchen_speaker'],
  bedroom: ['fan.bedroom_fan'],
  garage: ['switch.garage_door_opener'],
  porch: ['switch.porch_plug'],
  storage: ['switch.unused_plug'],
}

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
    switchState({
      entity_id: 'switch.garage_door_opener',
      attributes: { friendly_name: 'Garage opener' },
    }),
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
    mediaPlayer('playing', {
      entity_id: suggestions.player,
      attributes: { media_title: 'Demo Track', media_artist: 'Demo Artist', volume_level: 0.4 },
    }),
    ...demoMediaPlayers(),
    ...demoToday(now),
    ...demoSystems(now),
    ...demoRoomEntities(),
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

function demoForecasts(now: number): Record<string, Forecasts> {
  const weather = testHomeConfig.weather
  if (!weather) return {}
  const conditions = ['partlycloudy', 'sunny', 'cloudy', 'rainy', 'partlycloudy']
  // From the start of this hour, as HA's providers send it, so the strip leads with "Now".
  const thisHour = lastLocal(now, new Date(now).getHours(), 0).getTime()
  const hourly = Array.from({ length: 12 }, (_, i) => ({
    datetime: iso(thisHour + i * HOUR * 1000),
    condition: conditions[i % conditions.length],
    temperature: 52 + Math.round(6 * Math.sin(i / 3)),
  }))
  const daily = Array.from({ length: 5 }, (_, i) => ({
    datetime: iso(now + i * 24 * HOUR * 1000),
    condition: conditions[i % conditions.length],
    temperature: 60 - i,
    templow: 44 - i,
  }))
  return { [weather.entity_id]: { hourly, daily } }
}

const { devices, entityRegistry } = placeRegistries(DEMO_PLACEMENT)

export function demoHouse(now: number = Date.now()): FakeHaOptions {
  return {
    entities: demoEntities(now),
    statistics: demoStatistics(now),
    responseDelayMs: DEMO_RESPONSE_DELAY_MS,
    onServiceCall: demoServiceEffects,
    forecasts: demoForecasts(now),
    areas: PLACEHOLDER_AREAS,
    floors: PLACEHOLDER_FLOORS,
    devices,
    entityRegistry,
    userData: { [FAVORITES_KEY]: serializeFavorites(FAVORITE_IDS) },
  }
}
