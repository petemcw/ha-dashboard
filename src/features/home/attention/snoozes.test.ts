import { describe, expect, it } from 'vitest'
import { addSnooze, cleanup, isSnoozed, parseSnoozes, removeSnooze } from './snoozes'

const NOW = new Date('2026-10-03T12:00:00Z')
const stored = (snoozes: Record<string, { until: string; by: string }>) => ({
  version: 1,
  snoozes,
})

describe('parseSnoozes', () => {
  it('treats an unset value as no snoozes that may be written', () => {
    expect(parseSnoozes(null)).toEqual({ snoozes: {}, writable: true })
  })

  it('ignores a stored value with an unknown version and refuses to overwrite it', () => {
    const value = { version: 2, snoozes: { a: { until: '2027-01-01T00:00:00Z', by: 'u' } } }
    expect(parseSnoozes(value)).toEqual({ snoozes: {}, writable: false })
  })

  it.each([['junk'], [42], [{ version: 1 }], [{ version: 1, snoozes: [] }]])(
    'treats malformed value %j as no snoozes that must not be overwritten',
    (value) => {
      expect(parseSnoozes(value)).toEqual({ snoozes: {}, writable: false })
    },
  )

  it('drops an entry with a bad until but keeps the rest', () => {
    const value = stored({
      a: { until: 'nonsense', by: 'u' },
      b: { until: '2026-10-04T00:00:00Z', by: 'u' },
    })
    expect(parseSnoozes(value).snoozes).toEqual({ b: { until: '2026-10-04T00:00:00Z', by: 'u' } })
  })
})

describe('isSnoozed', () => {
  const { snoozes } = parseSnoozes(stored({ a: { until: '2026-10-03T12:00:01Z', by: 'u' } }))

  it('hides an item snoozed until a time in the future', () => {
    expect(isSnoozed(snoozes, 'a', NOW)).toBe(true)
  })

  it('shows an item again once its snooze has expired', () => {
    expect(isSnoozed(snoozes, 'a', new Date('2026-10-03T12:00:01Z'))).toBe(false)
  })

  it('does not snooze an item with no entry', () => {
    expect(isSnoozed(snoozes, 'b', NOW)).toBe(false)
  })
})

describe('addSnooze and removeSnooze', () => {
  it('adds a snooze keeping the others, and removes one', () => {
    const { snoozes } = parseSnoozes(stored({ a: { until: '2026-10-05T00:00:00Z', by: 'u' } }))
    const added = addSnooze(snoozes, 'b', new Date('2026-10-10T12:00:00Z'), 'user-1')
    expect(added).toEqual(
      stored({
        a: { until: '2026-10-05T00:00:00Z', by: 'u' },
        b: { until: '2026-10-10T12:00:00.000Z', by: 'user-1' },
      }),
    )
    expect(removeSnooze(parseSnoozes(added).snoozes, 'a')).toEqual(
      stored({ b: { until: '2026-10-10T12:00:00.000Z', by: 'user-1' } }),
    )
  })
})

describe('cleanup', () => {
  const { snoozes } = parseSnoozes(
    stored({
      resolved: { until: '2026-10-09T00:00:00Z', by: 'u' },
      expired: { until: '2026-10-01T00:00:00Z', by: 'u' },
      active: { until: '2026-10-09T00:00:00Z', by: 'u' },
    }),
  )

  it('drops snoozes whose item resolved or whose time has passed', () => {
    expect(cleanup(snoozes, ['resolved'], NOW)).toEqual(
      stored({ active: { until: '2026-10-09T00:00:00Z', by: 'u' } }),
    )
  })

  it('returns null when nothing changed, so nobody writes', () => {
    expect(cleanup(snoozes, [], new Date('2026-09-30T00:00:00Z'))).toBeNull()
  })
})
