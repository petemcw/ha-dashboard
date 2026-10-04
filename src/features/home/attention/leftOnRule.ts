import type { LeftOnIcon, LeftOnRule } from '../../../config/homeConfig'
import type { OnOffViewModel } from '../../../domains/onOff'
import { UNDECIDED, active, missingEntity, resolved, type RuleResult } from './ruleResult'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// Lights and fans say so in the badge; everything else is just "on".
function defaultIcon(rule: LeftOnRule): LeftOnIcon {
  if (rule.action.domain === 'light') return 'light'
  if (rule.action.domain === 'fan') return 'fan'
  return 'power'
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
  const isToggle = rule.action.service === 'toggle'
  const label = isDoor ? `Close ${rule.label.toLowerCase()}` : 'Turn off'
  return active({
    id: rule.id,
    tier: 'urgent',
    kind: 'left-on',
    icon: rule.icon ?? defaultIcon(rule),
    title: rule.label,
    detail: `${isDoor ? 'Open' : 'On'} for ${formatDuration(elapsed)}`,
    action: {
      icon: isDoor && isToggle ? 'close-garage' : 'power',
      label,
      pendingLabel: isDoor ? 'Closing…' : 'Turning off…',
      // A toggle is the one action that does the opposite on a double delivery. The confirm
      // names this rule's action, not a garage door: any toggle rule can land here.
      ...(isToggle && {
        confirmLabel: `Confirm ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
      }),
      ha: rule.action,
      sensorId: rule.entity_id,
      onState: rule.onState,
    },
  })
}
