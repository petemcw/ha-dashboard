import type { HassEntity } from 'home-assistant-js-websocket'
import { filterRules, leftOnRules, tonerRule, updateRules } from '../../../config/home.ts'
import { entityState } from '../../../domains/factories.ts'
import { sensorState } from '../../../domains/sensor/factories.ts'

// Test fixture shared by Vitest and the Playwright mock (so explicit .ts imports and no
// browser globals). Every entity a configured attention rule reads, present and calm:
// nothing left on, no pending update, toner and filters well above their thresholds.
// Built from the config, so it follows when a rule is added. Tests override what they need.
export function calmHouse(): HassEntity[] {
  return [
    ...[...leftOnRules, ...updateRules].map((r) =>
      entityState({ entity_id: r.entity_id, state: 'off' }),
    ),
    sensorState({ entity_id: tonerRule.entity_id, state: '80' }),
    ...filterRules.map((r) => sensorState({ entity_id: r.entity_id, state: '60' })),
  ]
}
