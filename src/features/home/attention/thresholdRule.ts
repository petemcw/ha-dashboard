import type { FilterRule, TonerRule } from '../../../config/homeConfig'
import type { SensorViewModel } from '../../../domains/sensor/types'
import { UNDECIDED, active, missingEntity, resolved, type RuleResult } from './ruleResult'
import type { AttentionItem } from './types'

type Threshold = {
  id: string
  kind: 'toner' | 'filter'
  below: number
  describe: (value: number) => Omit<AttentionItem, 'id' | 'tier' | 'kind' | 'icon'>
}

// Generic "numeric state below N" chore. Non-numeric states (the printer's ink sensor
// flaps to unavailable) are neither active nor resolved, so a snooze survives them.
function thresholdRule(t: Threshold, vm: SensorViewModel): RuleResult {
  if (vm.status === 'missing') return missingEntity(vm.entity_id)
  if (vm.numericValue === undefined) return UNDECIDED
  if (vm.numericValue >= t.below) return resolved(t.id)
  return active({
    id: t.id,
    tier: 'chore',
    kind: t.kind,
    icon: t.kind,
    ...t.describe(vm.numericValue),
  })
}

export const tonerLowRule = (config: TonerRule, vm: SensorViewModel) =>
  thresholdRule(
    {
      id: 'toner-low',
      kind: 'toner',
      below: config.below,
      describe: (value) => ({
        title: 'Printer toner',
        detail: `${value}% left`,
        action: { label: 'Reorder toner', icon: 'cart', href: config.reorderUrl },
      }),
    },
    vm,
  )

const plural = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`

function filterDetail(days: number) {
  if (days < 0) return `Overdue by ${plural(-days)}`
  if (days === 0) return 'Due today'
  return `${plural(days)} left`
}

export const filterRule = (config: FilterRule, vm: SensorViewModel) =>
  thresholdRule(
    {
      id: `filter-due:${config.entity_id}`,
      kind: 'filter',
      below: config.belowDays,
      describe: (days) => ({
        title: config.label,
        detail: filterDetail(days),
        action: {
          label: 'Mark replaced',
          icon: 'check',
          pendingLabel: 'Saving…',
          confirmLabel: 'Confirm mark replaced',
          script: config.resetScript,
          sensorId: config.entity_id,
        },
      }),
    },
    vm,
  )
