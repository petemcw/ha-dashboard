import type { LeftOnRule } from '../../../config/homeConfig'
import type { OnOffViewModel } from '../../../domains/onOff'
import { UNDECIDED, active, missingEntity, resolved, type RuleResult } from './ruleResult'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function leftOnRule(rule: LeftOnRule, vm: OnOffViewModel, now: Date): RuleResult {
  if (vm.status === 'missing') return missingEntity(rule.entity_id)
  if (vm.status !== 'ok') return UNDECIDED
  if (!vm.isOn) return resolved(rule.id)

  const elapsed = Math.floor((now.getTime() - (vm.onSince?.getTime() ?? now.getTime())) / 60_000)
  // On but under the duration: not active, and not resolved either (an HA restart
  // resets last_changed, which looks the same).
  if (elapsed < rule.minutes) return UNDECIDED

  const isDoor = rule.entity_id.startsWith('binary_sensor.')
  return active({
    id: rule.id,
    tier: 'urgent',
    title: rule.label,
    detail: `${isDoor ? 'Open' : 'On'} for ${formatDuration(elapsed)}`,
    action: {
      label: isDoor ? `Close ${rule.label.toLowerCase()}` : 'Turn off',
      enabled: false,
    },
  })
}
