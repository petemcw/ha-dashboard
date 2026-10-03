import { describe, expect, it } from 'vitest'
import { binarySensorState } from '../../../domains/binary_sensor/factories'
import { updateState } from '../../../domains/update/factories'
import { updateViewModel } from '../../../domains/update/viewModel'
import { updateRule } from './updateRule'

describe('update rule', () => {
  it('lists a pending update with its installed and latest versions', () => {
    const entity = updateState({
      entity_id: 'update.router_firmware',
      state: 'on',
      attributes: { installed_version: '4.3.5', latest_version: '4.3.10' },
    })
    const result = updateRule(
      { id: 'update-firmware', entity_id: entity.entity_id, state: 'on' },
      updateViewModel(entity.entity_id, entity),
    )
    expect(result.items).toEqual([
      {
        id: 'update:update.router_firmware',
        tier: 'chore',
        title: 'update.router_firmware',
        detail: '4.3.5 → 4.3.10',
      },
    ])
  })

  it('lists the Home Assistant Docker image when its update sensor is on', () => {
    const entity = binarySensorState({
      entity_id: 'binary_sensor.docker_hub_update_available',
      state: 'on',
    })
    const result = updateRule(
      {
        id: 'ha-docker-image',
        label: 'Home Assistant Docker image',
        entity_id: entity.entity_id,
        state: 'on',
      },
      updateViewModel(entity.entity_id, entity),
    )
    expect(result.items.map((i) => i.title)).toEqual(['Home Assistant Docker image'])
  })

  it('resolves an update that is present and not pending, but not an unavailable one', () => {
    const rule = { id: 'u', entity_id: 'update.x', state: 'on' as const }
    const off = updateState({ entity_id: 'update.x' })
    const gone = updateState({ entity_id: 'update.x', state: 'unavailable' })
    expect(updateRule(rule, updateViewModel('update.x', off)).resolvedIds).toEqual([
      'update:update.x',
    ])
    expect(updateRule(rule, updateViewModel('update.x', gone))).toEqual({
      items: [],
      resolvedIds: [],
    })
    expect(updateRule(rule, updateViewModel('update.x', undefined)).items[0].id).toBe(
      'missing:update.x',
    )
  })
})
