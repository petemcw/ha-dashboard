import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createFakeConnection } from '../../test/fakeConnection'
import { startSession } from '../ha/session'
import { entityStore } from './entityStore'
import { useEntitiesLoaded, useEntity } from './useEntity'

function startFake() {
  const fake = createFakeConnection()
  const stop = startSession(() => Promise.resolve(fake.conn))
  return { fake, stop }
}

// startSession attaches once getConnection() resolves.
const connected = () => act(async () => {})

afterEach(() => entityStore.reset())

describe('entity store', () => {
  it('gives a selector subscriber the current state of its entity', async () => {
    const { fake } = startFake()
    await connected()
    const { result } = renderHook(() => useEntity('light.kitchen'))
    act(() => fake.emit([{ entity_id: 'light.kitchen', state: 'on' }]))
    expect(result.current?.state).toBe('on')
    act(() => fake.change('light.kitchen', 'off'))
    expect(result.current?.state).toBe('off')
  })

  it('re-renders a component only when the entity it reads changes', async () => {
    const { fake } = startFake()
    await connected()
    let renders = 0
    function Kitchen() {
      renders++
      return <p>{useEntity('light.kitchen')?.state}</p>
    }
    render(<Kitchen />)
    act(() =>
      fake.emit([
        { entity_id: 'light.kitchen', state: 'on' },
        { entity_id: 'light.den', state: 'on' },
      ]),
    )
    const before = renders
    act(() => fake.change('light.den', 'off'))
    expect(renders).toBe(before)
    act(() => fake.change('light.kitchen', 'off'))
    expect(renders).toBe(before + 1)
    expect(screen.getByText('off')).toBeInTheDocument()
  })

  it('reports an entity that is not in the map as missing', async () => {
    const { fake } = startFake()
    await connected()
    const { result } = renderHook(() => ({
      entity: useEntity('light.ghost'),
      loaded: useEntitiesLoaded(),
    }))
    act(() => fake.emit([{ entity_id: 'light.kitchen', state: 'on' }]))
    expect(result.current).toEqual({ entity: undefined, loaded: true })
  })

  it('does not report entities as missing before the first entity snapshot arrives', async () => {
    startFake()
    await connected()
    const { result } = renderHook(() => ({
      entity: useEntity('light.kitchen'),
      loaded: useEntitiesLoaded(),
    }))
    expect(result.current.loaded).toBe(false)
  })
})
