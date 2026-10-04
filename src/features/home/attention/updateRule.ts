import type { UpdateRule } from '../../../config/homeConfig'
import type { UpdateViewModel } from '../../../domains/update/types'
import { UNDECIDED, active, missingEntity, resolved, type RuleResult } from './ruleResult'

export function updateRule(rule: UpdateRule, vm: UpdateViewModel): RuleResult {
  if (vm.status === 'missing') return missingEntity(rule.entity_id)
  if (vm.status !== 'ok') return UNDECIDED
  const id = `update:${rule.entity_id}`
  if (!vm.isPending) return resolved(id)
  const versions =
    vm.installedVersion && vm.latestVersion ? `${vm.installedVersion} → ${vm.latestVersion}` : ''
  return active({
    id,
    tier: 'chore',
    kind: 'update',
    title: rule.label ?? vm.friendlyName,
    detail: versions,
  })
}
