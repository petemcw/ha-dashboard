import { describe, expect, it } from 'vitest'
import { formatClock, formatHour } from './formatClock'

// Local-time dates, so the expectations hold in any timezone.
const at = (hour: number, minute = 0) => new Date(2026, 9, 3, hour, minute)

describe('formatClock', () => {
  it('writes a 12-hour locale with a small lowercase am/pm', () => {
    expect(formatClock(at(18, 52), 'en-US')).toBe('6:52 pm')
    expect(formatClock(at(0, 5), 'en-US')).toBe('12:05 am')
  })

  it('writes a 24-hour locale without am/pm', () => {
    expect(formatClock(at(18, 52), 'en-GB')).toBe('18:52')
    expect(formatClock(at(7, 5), 'de-DE')).toBe('7:05')
  })
})

describe('formatHour', () => {
  it('writes the compact hour with a one-letter am/pm in a 12-hour locale', () => {
    expect(formatHour(at(19), 'en-US')).toBe('7p')
    expect(formatHour(at(0), 'en-US')).toBe('12a')
    expect(formatHour(at(11), 'en-US')).toBe('11a')
  })

  it('writes the bare hour in a 24-hour locale', () => {
    expect(formatHour(at(19), 'en-GB')).toBe('19')
    expect(formatHour(at(19), 'de-DE')).toBe('19')
  })
})
