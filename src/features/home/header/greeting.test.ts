import { describe, expect, it } from 'vitest'
import { greetingFor } from './greeting'

const at = (hour: number, minute = 0) => new Date(2026, 9, 3, hour, minute)

describe('greetingFor', () => {
  it.each([
    [at(4), 'Good morning'],
    [at(11, 59), 'Good morning'],
    [at(12), 'Good afternoon'],
    [at(16, 59), 'Good afternoon'],
    [at(17), 'Good evening'],
    [at(23, 30), 'Good evening'],
    [at(2), 'Good evening'],
  ])('greets %s with %s', (date, greeting) => {
    expect(greetingFor(date)).toBe(greeting)
  })
})
