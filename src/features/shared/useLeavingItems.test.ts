import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LEAVE_MS, useLeavingItems, type Shown } from './useLeavingItems'

type Item = { id: string; title?: string }
const a: Item = { id: 'a' }
const b: Item = { id: 'b' }
const c: Item = { id: 'c' }
const keyOf = (item: Item) => item.id
const ids = (shown: Shown<Item>[]) =>
  shown.map(({ item, leaving }) => (leaving ? `${item.id} (leaving)` : item.id))

function renderItems(items: Item[], animate = true) {
  return renderHook((props) => useLeavingItems(props.items, keyOf, props.animate), {
    initialProps: { items, animate },
  })
}

describe('useLeavingItems', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('keeps a removed item in its place, marked leaving, until it has had time to leave', () => {
    const hook = renderItems([a, b, c])
    hook.rerender({ items: [a, c], animate: true })
    expect(ids(hook.result.current)).toEqual(['a', 'b (leaving)', 'c'])

    act(() => vi.advanceTimersByTime(LEAVE_MS - 1))
    expect(ids(hook.result.current)).toEqual(['a', 'b (leaving)', 'c'])
    act(() => vi.advanceTimersByTime(1))
    expect(ids(hook.result.current)).toEqual(['a', 'c'])
  })

  it('drops a removed item at once when motion is off', () => {
    const hook = renderItems([a, b], false)
    hook.rerender({ items: [a], animate: false })
    expect(ids(hook.result.current)).toEqual(['a'])
  })

  it('shows a removed item as it last was', () => {
    const hook = renderItems([{ id: 'a', title: 'Garage door open' }])
    hook.rerender({ items: [], animate: true })
    expect(hook.result.current).toEqual([
      { item: { id: 'a', title: 'Garage door open' }, leaving: true },
    ])
  })

  it('stops an item from leaving when it comes back', () => {
    const hook = renderItems([a, b])
    hook.rerender({ items: [a], animate: true })
    hook.rerender({ items: [a, b], animate: true })
    expect(ids(hook.result.current)).toEqual(['a', 'b'])
    act(() => vi.advanceTimersByTime(LEAVE_MS))
    expect(ids(hook.result.current)).toEqual(['a', 'b'])
  })

  it('lets items removed at different times each leave on their own schedule', () => {
    const hook = renderItems([a, b, c])
    hook.rerender({ items: [b, c], animate: true })
    act(() => vi.advanceTimersByTime(LEAVE_MS / 2))
    hook.rerender({ items: [c], animate: true })
    expect(ids(hook.result.current)).toEqual(['a (leaving)', 'b (leaving)', 'c'])

    act(() => vi.advanceTimersByTime(LEAVE_MS / 2))
    expect(ids(hook.result.current)).toEqual(['b (leaving)', 'c'])
    act(() => vi.advanceTimersByTime(LEAVE_MS / 2))
    expect(ids(hook.result.current)).toEqual(['c'])
  })
})
