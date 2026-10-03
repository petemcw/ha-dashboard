import { useMemo } from 'react'
import type { HassEntity } from 'home-assistant-js-websocket'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { binarySensorViewModel } from '../../../domains/binary_sensor/viewModel'
import { lightViewModel } from '../../../domains/light/viewModel'
import { switchViewModel } from '../../../domains/switch/viewModel'
import { sensorViewModel } from '../../../domains/sensor/viewModel'
import { updateViewModel } from '../../../domains/update/viewModel'
import { useNow } from '../../../infrastructure/clock/clock'
import { useEntitiesById } from '../../../infrastructure/entities/useEntitiesById'
import { useEntityIds } from '../../../infrastructure/entities/useEntityIds'
import { batteryRule } from './batteryRule'
import { leftOnRule } from './leftOnRule'
import { mergeResults, type RuleResult } from './ruleResult'
import { filterRule, tonerLowRule } from './thresholdRule'
import { updateRule } from './updateRule'

// Every battery sensor, whatever the integration; the config ignore list trims it.
const isBatterySensor = (e: HassEntity) =>
  e.entity_id.startsWith('sensor.') && e.attributes.device_class === 'battery'

// Which domain's view model reads each left-on entity.
const VIEW_MODELS = {
  binary_sensor: binarySensorViewModel,
  switch: switchViewModel,
  light: lightViewModel,
} as const

// Composes every attention rule from the configured entities and the battery sensors.
export function useAttentionItems(): RuleResult {
  const {
    leftOnRules,
    updateRules,
    tonerRule,
    filterRules,
    batteryRule: batteryConfig,
  } = useHomeConfig()
  const now = useNow()
  // Every entity a configured rule reads, in one stable list for one subscription.
  const ruleEntityIds = useMemo(
    () => [...leftOnRules, ...updateRules, tonerRule, ...filterRules].map((r) => r.entity_id),
    [leftOnRules, updateRules, tonerRule, filterRules],
  )
  const entities = useEntitiesById(ruleEntityIds)
  const batteries = useEntitiesById(useEntityIds(isBatterySensor))
  const sensor = (id: string) => sensorViewModel(id, entities[id])

  return mergeResults([
    ...leftOnRules.map((rule) => {
      const domain = rule.entity_id.split('.')[0] as keyof typeof VIEW_MODELS
      const vm = VIEW_MODELS[domain](rule.entity_id, entities[rule.entity_id])
      return leftOnRule(rule, vm, now)
    }),
    ...updateRules.map((rule) =>
      updateRule(rule, updateViewModel(rule.entity_id, entities[rule.entity_id])),
    ),
    batteryRule(
      batteryConfig,
      Object.entries(batteries).map(([id, e]) => sensorViewModel(id, e)),
    ),
    tonerLowRule(tonerRule, sensor(tonerRule.entity_id)),
    ...filterRules.map((rule) => filterRule(rule, sensor(rule.entity_id))),
  ])
}
