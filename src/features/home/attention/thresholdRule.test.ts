import { describe, expect, it } from 'vitest'
import { filterRules, tonerRule } from '../../../config/home'
import { sensorState } from '../../../domains/sensor/factories'
import { sensorViewModel } from '../../../domains/sensor/viewModel'
import { filterRule, tonerLowRule } from './thresholdRule'

const toner = (state: string) => {
  const s = sensorState({ entity_id: tonerRule.entity_id, state })
  return tonerLowRule(tonerRule, sensorViewModel(s.entity_id, s))
}
const filter = (state: string) => {
  const rule = filterRules[1]
  const s = sensorState({ entity_id: rule.entity_id, state })
  return filterRule(rule, sensorViewModel(s.entity_id, s))
}

describe('toner rule', () => {
  it('lists printer toner below 15 percent with a reorder link', () => {
    expect(toner('9').items).toEqual([
      {
        id: 'toner-low',
        tier: 'chore',
        title: 'Printer toner',
        detail: '9% left',
        action: { label: 'Reorder toner', href: tonerRule.reorderUrl },
      },
    ])
  })

  it('does not list printer toner while the sensor is unavailable', () => {
    expect(toner('unavailable').items).toEqual([])
  })

  it('does not report an unavailable toner sensor as resolved', () => {
    expect(toner('unavailable').resolvedIds).toEqual([])
    expect(toner('15').resolvedIds).toEqual(['toner-low'])
  })
})

describe('filter rule', () => {
  it('lists a filter with fewer than 5 days left', () => {
    const { items, resolvedIds } = filter('3')
    expect(items.map((i) => [i.id, i.title, i.detail])).toEqual([
      [`filter-due:${filterRules[1].entity_id}`, 'Refrigerator water filter', '3 days left'],
    ])
    expect(resolvedIds).toEqual([])
    expect(filter('5').resolvedIds).toEqual([`filter-due:${filterRules[1].entity_id}`])
  })

  it('says due today at zero days and singular at one', () => {
    expect(filter('0').items[0].detail).toBe('Due today')
    expect(filter('1').items[0].detail).toBe('1 day left')
  })

  it('shows an overdue filter as overdue by its number of days', () => {
    expect(filter('-117').items[0].detail).toBe('Overdue by 117 days')
  })

  it('renders Mark replaced as a disabled action', () => {
    expect(filter('2').items[0].action).toEqual({ label: 'Mark replaced', enabled: false })
  })
})
