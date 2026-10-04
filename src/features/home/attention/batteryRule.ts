import type { BatteryRule } from '../../../config/homeConfig'
import type { SensorViewModel } from '../../../domains/sensor/types'
import { UNDECIDED, active, mergeResults, resolved, type RuleResult } from './ruleResult'

// Non-numeric states (unavailable, unknown) are neither active nor resolved.
export function batteryRule(config: BatteryRule, sensors: SensorViewModel[]): RuleResult {
  return mergeResults(
    sensors.map((s) => {
      if (config.ignore.includes(s.entity_id) || s.numericValue === undefined) return UNDECIDED
      const id = `battery-low:${s.entity_id}`
      if (s.numericValue >= config.threshold) return resolved(id)
      return active({
        id,
        tier: 'chore',
        kind: 'battery',
        title: s.friendlyName,
        detail: `${s.numericValue}%`,
      })
    }),
  )
}
