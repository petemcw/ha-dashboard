import { useEffect, useRef, useState } from 'react'

// How long a removed item stays on screen while it animates out.
export const LEAVE_MS = 260

export type Shown<T> = { item: T; leaving: boolean }

// A leaving entry keeps its object identity from one merge to the next, so its removal
// timer is started once and isn't pushed back when something else changes.
type Entry<T> = { item: T; leaving: boolean }

// Keeps an item that drops out of `items` on screen for LEAVE_MS, in its old place and
// marked leaving, so the component can animate it out instead of cutting it. The kept copy
// is the item as it last was: a frozen picture for its exit, never live state, so the
// component must make it inert. With `animate` off, removals happen at once.
export function useLeavingItems<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  animate: boolean,
): Shown<T>[] {
  const [entries, setEntries] = useState<Entry<T>[]>(() => live(items))
  const [seen, setSeen] = useState(items)
  let current = entries
  // Adjusted during render rather than in an effect, so there is no frame where a removed
  // item has already gone.
  if (!sameItems(items, seen)) {
    current = animate ? merge(entries, items, keyOf) : live(items)
    setSeen(items)
    setEntries(current)
  }

  const timers = useRef(new Map<Entry<T>, ReturnType<typeof setTimeout>>())
  useEffect(() => {
    for (const entry of entries) {
      if (!entry.leaving || timers.current.has(entry)) continue
      const timer = setTimeout(() => {
        timers.current.delete(entry)
        setEntries((all) => all.filter((e) => e !== entry))
      }, LEAVE_MS)
      timers.current.set(entry, timer)
    }
  }, [entries])
  useEffect(() => {
    const pending = timers.current
    // Cleared as well as stopped: StrictMode remounts in development, and the effect above
    // must start the timers again then.
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return current
}

const live = <T>(items: readonly T[]): Entry<T>[] => items.map((item) => ({ item, leaving: false }))

// Callers often rebuild the array every render; only a real change needs a merge.
function sameItems<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((item, i) => item === b[i])
}

// The new items in their new order, with each leaving item put back after the entry it
// followed before.
function merge<T>(previous: Entry<T>[], items: readonly T[], keyOf: (item: T) => string) {
  const next = live(items)
  const present = new Set(items.map(keyOf))
  previous.forEach((entry, index) => {
    if (present.has(keyOf(entry.item))) return
    const before = previous
      .slice(0, index)
      .findLast((e) => next.some((n) => keyOf(n.item) === keyOf(e.item)))
    const at = before ? next.findIndex((n) => keyOf(n.item) === keyOf(before.item)) + 1 : 0
    next.splice(at, 0, entry.leaving ? entry : { item: entry.item, leaving: true })
  })
  return next
}
