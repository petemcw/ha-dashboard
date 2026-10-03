// Which entities the home screen uses, and the thresholds that decide when they
// matter. Not secret. All IDs were verified against the live instance on 2026-10-03;
// see docs/feature-decisions.md. Features import from here; domains never do.

export type HaAction = {
  domain: string
  service: string
  entity_id: string
}

export type LeftOnRule = {
  id: string
  label: string
  entity_id: string
  // State that means "left on" (door: open).
  onState: 'on'
  minutes: number
  // Wired up by a later task; the rule carries it so the card can show it disabled.
  action: HaAction
}

export type FilterRule = {
  id: string
  label: string
  entity_id: string
  belowDays: number
  resetScript: string
}

export type UpdateRule = {
  id: string
  label?: string
  entity_id: string
  state: 'on'
}

export const leftOnRules: LeftOnRule[] = [
  {
    id: 'garage-door',
    label: 'Garage door',
    entity_id: 'binary_sensor.garage_door_status',
    onState: 'on',
    minutes: 10,
    action: {
      domain: 'switch',
      service: 'toggle',
      entity_id: 'switch.garage_door_switch_a0dd6c497c48',
    },
  },
  {
    id: 'garage-work-lights',
    label: 'Garage work lights',
    entity_id: 'switch.smart_plug_b725',
    onState: 'on',
    minutes: 30,
    action: { domain: 'switch', service: 'turn_off', entity_id: 'switch.smart_plug_b725' },
  },
  {
    id: 'space-heater',
    label: 'Space heater',
    entity_id: 'switch.space_heater',
    onState: 'on',
    minutes: 60,
    action: { domain: 'switch', service: 'turn_off', entity_id: 'switch.space_heater' },
  },
  {
    id: 'bed-lightstrip',
    label: 'Bed lightstrip',
    entity_id: 'light.master_bedroom_bed_lightstrip',
    onState: 'on',
    minutes: 30,
    action: {
      domain: 'light',
      service: 'turn_off',
      entity_id: 'light.master_bedroom_bed_lightstrip',
    },
  },
]

export const batteryRule = {
  threshold: 20,
  ignore: ['sensor.iphizzle_battery_level', 'sensor.ipad_battery_level'],
}

export const updateRules: UpdateRule[] = [
  {
    id: 'living-room-switch-firmware',
    entity_id: 'update.living_room_switch_a0dd6c2bcf74_firmware',
    state: 'on',
  },
  { id: 'update-firmware', entity_id: 'update.update_firmware', state: 'on' },
  {
    id: 'ha-docker-image',
    label: 'Home Assistant Docker image',
    entity_id: 'binary_sensor.docker_hub_update_available',
    state: 'on',
  },
]

export const tonerRule = {
  entity_id: 'sensor.family_room_printer_ink',
  below: 15,
  reorderUrl: 'https://www.amazon.com/dp/B00LJO8EQS',
}

export const filterRules: FilterRule[] = [
  {
    id: 'hvac-filter',
    label: 'HVAC filter',
    entity_id: 'sensor.hvac_filter_days_remaining',
    belowDays: 5,
    resetScript: 'script.set_hvac_filter_replacement_date',
  },
  {
    id: 'refrigerator-water-filter',
    label: 'Refrigerator water filter',
    entity_id: 'sensor.refrigerator_water_filter_days_remaining',
    belowDays: 5,
    resetScript: 'script.reset_refrigerator_water_filter_replacement_date',
  },
  {
    id: 'refrigerator-air-filter',
    label: 'Refrigerator air filter',
    entity_id: 'sensor.refrigerator_air_filter_days_remaining',
    belowDays: 5,
    resetScript: 'script.reset_refrigerator_air_filter_replacement_date',
  },
]

export const suggestions = {
  player: 'media_player.family_room_apple_tv',
  playing: {
    scene: 'scene.family_room_off_during_tv',
    label: 'Media viewing mood',
    transition: 5,
  },
  paused: {
    scene: 'scene.family_room_on_during_tv_paused',
    label: 'Bright up lights',
  },
}

export const people = [
  'person.alex_rivera',
  'person.sam_rivera',
  'person.jordan_rivera',
  'person.casey_rivera',
  'person.taylor_rivera',
  'person.morgan_rivera',
]

export const crypto = [
  { symbol: 'BTC', entity_id: 'sensor.btc_exchange_rate' },
  { symbol: 'ETH', entity_id: 'sensor.eth_exchange_rate' },
  { symbol: 'SOL', entity_id: 'sensor.sol_exchange_rate' },
]

export const favoriteDomains = [
  'light',
  'switch',
  'fan',
  'media_player',
  'cover',
  'climate',
  'lock',
  'scene',
  'script',
]
