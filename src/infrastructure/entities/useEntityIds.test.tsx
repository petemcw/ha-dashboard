import { act, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { sensorState } from '../../domains/sensor/factories'
import { entityStore } from './entityStore'
import { useEntityIds } from './useEntityIds'

const isSensor = (e: { entity_id: string }) => e.entity_id.startsWith('sensor.')
const seed = (...states: ReturnType<typeof sensorState>[]) =>
  entityStore.setEntities(Object.fromEntries(states.map((e) => [e.entity_id, e])))

afterEach(() => entityStore.reset())

describe('entity id selector', () => {
  it('does not re-render a predicate subscriber when an unrelated entity changes', () => {
    seed(sensorState({ entity_id: 'sensor.a' }), sensorState({ entity_id: 'light.x', state: 'on' }))
    let renders = 0
    function Probe() {
      renders++
      useEntityIds(isSensor)
      return null
    }
    render(<Probe />)
    const before = renders
    act(() =>
      seed(
        sensorState({ entity_id: 'sensor.a' }),
        sensorState({ entity_id: 'light.x', state: 'off' }),
      ),
    )
    expect(renders).toBe(before)
    act(() => seed(sensorState({ entity_id: 'sensor.a' }), sensorState({ entity_id: 'sensor.b' })))
    expect(renders).toBe(before + 1)
  })

  it('does not rescan the entities when a subscriber re-renders without an update', () => {
    seed(sensorState({ entity_id: 'sensor.a' }), sensorState({ entity_id: 'light.x' }))
    let calls = 0
    const counting = (e: { entity_id: string }) => (calls++, isSensor(e))
    const { rerender } = renderHook(() => useEntityIds(counting))
    const before = calls
    rerender()
    rerender()
    expect(calls).toBe(before)
  })

  it('scans once per update for every subscriber sharing a predicate', () => {
    seed(sensorState({ entity_id: 'sensor.a' }))
    let calls = 0
    const counting = (e: { entity_id: string }) => (calls++, isSensor(e))
    const results: string[][] = []
    function Probe() {
      results.push(useEntityIds(counting))
      return null
    }
    render(
      <>
        <Probe />
        <Probe />
      </>,
    )
    calls = 0
    act(() =>
      seed(
        sensorState({ entity_id: 'sensor.a' }),
        sensorState({ entity_id: 'sensor.b' }),
        sensorState({ entity_id: 'light.x' }),
      ),
    )
    expect(calls).toBe(3)
    expect(results.at(-1)).toEqual(['sensor.a', 'sensor.b'])
    expect(results.at(-1)).toBe(results.at(-2))
  })

  it('keeps the same sorted array when the matching set is unchanged', () => {
    seed(sensorState({ entity_id: 'sensor.b' }), sensorState({ entity_id: 'sensor.a' }))
    const { result } = renderHook(() => useEntityIds(isSensor))
    const first = result.current
    expect(first).toEqual(['sensor.a', 'sensor.b'])
    act(() =>
      seed(
        sensorState({ entity_id: 'sensor.a', state: '7' }),
        sensorState({ entity_id: 'sensor.b' }),
      ),
    )
    expect(result.current).toBe(first)
  })

  it('matches nothing, without scanning, for a null predicate', () => {
    seed(sensorState({ entity_id: 'sensor.a' }))
    const { result } = renderHook(() => useEntityIds(null))
    const first = result.current
    expect(first).toEqual([])
    act(() => seed(sensorState({ entity_id: 'sensor.b' })))
    expect(result.current).toBe(first)
  })

  it('returns the matching ids and recomputes when the predicate changes', () => {
    seed(sensorState({ entity_id: 'sensor.a' }), sensorState({ entity_id: 'light.x' }))
    const { result, rerender } = renderHook(({ p }) => useEntityIds(p), {
      initialProps: { p: isSensor as (e: { entity_id: string }) => boolean },
    })
    expect(result.current).toEqual(['sensor.a'])
    rerender({ p: (e) => e.entity_id.startsWith('light.') })
    expect(result.current).toEqual(['light.x'])
  })
})
