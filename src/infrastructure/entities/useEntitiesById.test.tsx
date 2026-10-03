import { act, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { sensorState } from '../../domains/sensor/factories'
import { entityStore } from './entityStore'
import { useEntitiesById } from './useEntitiesById'

const a = sensorState({ entity_id: 'sensor.a', state: '1' })
const b = sensorState({ entity_id: 'sensor.b', state: '2' })
const seed = (...states: ReturnType<typeof sensorState>[]) =>
  entityStore.setEntities(Object.fromEntries(states.map((e) => [e.entity_id, e])))

afterEach(() => entityStore.reset())

describe('entities by id', () => {
  it('maps each id to its entity, and an id HA lacks to undefined', () => {
    seed(a)
    const ids = ['sensor.a', 'sensor.gone']
    const { result } = renderHook(() => useEntitiesById(ids))
    expect(result.current).toEqual({ 'sensor.a': a, 'sensor.gone': undefined })
  })

  it('re-renders only when one of its entities changes', () => {
    seed(a, b)
    const ids = ['sensor.a']
    let renders = 0
    function Probe() {
      renders++
      useEntitiesById(ids)
      return null
    }
    render(<Probe />)
    const before = renders
    act(() => seed(a, sensorState({ entity_id: 'sensor.b', state: '3' })))
    expect(renders).toBe(before)
    act(() => seed(sensorState({ entity_id: 'sensor.a', state: '4' }), b))
    expect(renders).toBe(before + 1)
  })
})
