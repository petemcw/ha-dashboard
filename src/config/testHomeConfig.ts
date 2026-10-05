import type { HomeConfig } from './homeConfig.ts'

// Placeholder house shared by Vitest, calmHouse(), and the Playwright mock (so explicit
// .ts imports, `import type`, and no browser globals). Generic IDs only: the real house
// lives in the owner's home.json, which is not in the repo.
export const testHomeConfig: HomeConfig = {
  leftOnRules: [
    {
      id: 'garage-door',
      label: 'Garage door',
      entity_id: 'binary_sensor.garage_door',
      onState: 'on',
      minutes: 10,
      icon: 'garage',
      action: { domain: 'switch', service: 'toggle', entity_id: 'switch.garage_door_opener' },
    },
    {
      id: 'space-heater',
      label: 'Space heater',
      entity_id: 'switch.space_heater',
      onState: 'on',
      minutes: 60,
      icon: 'heater',
      action: { domain: 'switch', service: 'turn_off', entity_id: 'switch.space_heater' },
    },
    {
      id: 'bedroom-lightstrip',
      label: 'Bedroom lightstrip',
      entity_id: 'light.bedroom_lightstrip',
      onState: 'on',
      minutes: 30,
      action: { domain: 'light', service: 'turn_off', entity_id: 'light.bedroom_lightstrip' },
    },
  ],
  batteryRule: { threshold: 20, ignore: ['sensor.old_phone_battery_level'] },
  updateRules: [
    {
      id: 'router-firmware',
      label: 'Router firmware',
      entity_id: 'update.router_firmware',
      state: 'on',
    },
    {
      id: 'ha-docker-image',
      label: 'Home Assistant Docker image',
      entity_id: 'binary_sensor.docker_hub_update_available',
      state: 'on',
    },
  ],
  tonerRule: {
    entity_id: 'sensor.printer_ink',
    below: 15,
    reorderUrl: 'https://example.com/reorder-toner',
  },
  filterRules: [
    {
      id: 'furnace-filter',
      label: 'Furnace filter',
      entity_id: 'sensor.furnace_filter_days_remaining',
      belowDays: 5,
      resetScript: 'script.reset_furnace_filter',
    },
    {
      id: 'water-filter',
      label: 'Water filter',
      entity_id: 'sensor.water_filter_days_remaining',
      belowDays: 5,
      resetScript: 'script.reset_water_filter',
    },
  ],
  suggestions: {
    player: 'media_player.living_room_tv',
    playing: { scene: 'scene.living_room_movie', label: 'Media viewing mood', transition: 5 },
    paused: { scene: 'scene.living_room_bright', label: 'Bright up lights' },
  },
  crypto: [
    { symbol: 'BTC', entity_id: 'sensor.btc_exchange_rate' },
    { symbol: 'ETH', entity_id: 'sensor.eth_exchange_rate' },
    { symbol: 'SOL', entity_id: 'sensor.sol_exchange_rate' },
  ],
  weather: { entity_id: 'weather.forecast_home', sun: 'sun.sun' },
  systems: {
    status: { entity_id: 'sensor.gateway_state', upState: 'connected', label: 'Gateway' },
    uptime: { entity_id: 'sensor.gateway_boot_time', label: 'Gateway' },
    accessPoints: {
      entity_ids: [
        'sensor.office_ap_state',
        'sensor.hallway_ap_state',
        'sensor.garage_ap_state',
        'sensor.basement_ap_state',
      ],
      upState: 'connected',
    },
    backup: 'sensor.backup_last_successful_automatic_backup',
    cpu: [
      { label: 'Home Assistant', entity_id: 'sensor.processor_use' },
      { label: 'Gateway', entity_id: 'sensor.gateway_cpu_utilization' },
    ],
  },
  media: {
    players: [
      'media_player.living_room_speaker',
      'media_player.kitchen_speaker',
      'media_player.family_room_tv',
      'media_player.receiver',
    ],
  },
  rooms: {
    hidden: ['storage'],
    awayRoom: 'garage',
    areas: {
      living_room: { add: ['light.kitchen_pendant'], remove: ['switch.unused_plug'] },
    },
  },
  confirm: ['switch.garage_door_opener'],
}
