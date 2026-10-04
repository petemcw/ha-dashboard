import { describe, expect, it } from 'vitest'
import type { AttentionItem } from '../attention/types'
import { houseStatus } from './houseStatus'

const item = (title: string, detail?: string, tier: AttentionItem['tier'] = 'urgent') =>
  ({ id: title, tier, title, detail }) as AttentionItem

describe('houseStatus', () => {
  it('says the house is quiet when nothing needs attention', () => {
    expect(houseStatus([], [])).toBe('All quiet at home.')
  })

  it('names the one urgent item and what is wrong with it', () => {
    expect(houseStatus([item('Garage door', 'Open for 45 min')], [])).toBe(
      'Garage door: open for 45 min.',
    )
  })

  it('counts urgent items when there is more than one', () => {
    expect(houseStatus([item('Garage door'), item('Space heater')], [])).toBe(
      '2 things need you now.',
    )
  })

  it('adds the chores after the urgent part', () => {
    const chores = [item('Toner', undefined, 'chore'), item('Filter', undefined, 'chore')]
    expect(houseStatus([item('Garage door', 'Open for 45 min')], chores)).toBe(
      'Garage door: open for 45 min. 2 chores waiting.',
    )
  })

  it('says nothing is urgent when there are only chores', () => {
    expect(houseStatus([], [item('Toner', undefined, 'chore')])).toBe(
      'Nothing urgent. 1 chore waiting.',
    )
  })
})
