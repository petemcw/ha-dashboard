import { describe, expect, it } from 'vitest'
import { entityState } from '../../../domains/factories'
import { cryptoViewModel } from './cryptoViewModel'

const coin = (symbol: string, state: string) =>
  entityState({
    entity_id: `sensor.${symbol.toLowerCase()}_exchange_rate`,
    state,
    attributes: { unit_of_measurement: 'USD' },
  })

describe('crypto view model', () => {
  it('shows each coin current price in US dollars', () => {
    expect(cryptoViewModel('BTC', coin('BTC', '67432.4'), []).price).toBe('$67,432')
    expect(cryptoViewModel('ETH', coin('ETH', '3120.5'), []).price).toBe('$3,121')
    expect(cryptoViewModel('SOL', coin('SOL', '142.5'), []).price).toBe('$142.50')
  })

  it('computes the 24-hour change from the oldest hourly mean', () => {
    const up = cryptoViewModel('BTC', coin('BTC', '101'), [100, 90, 95])
    expect(up.changeText).toBe('+1.0%')
    const down = cryptoViewModel('BTC', coin('BTC', '99.2'), [100, 110])
    expect(down.changeText).toBe('−0.8%')
  })

  it('appends the live price as the last sparkline point', () => {
    expect(cryptoViewModel('BTC', coin('BTC', '95'), [100, 90]).points).toEqual([100, 90, 95])
  })

  it('shows a dash and no change while the price is unavailable', () => {
    for (const state of ['unavailable', 'unknown']) {
      const vm = cryptoViewModel('BTC', coin('BTC', state), [100, 90])
      expect(vm.price).toBe('—')
      expect(vm.changeText).toBeUndefined()
      expect(vm.points).toEqual([])
    }
  })

  it('shows the price without a sparkline when there are no statistics', () => {
    const vm = cryptoViewModel('BTC', coin('BTC', '100'), [])
    expect(vm.price).toBe('$100')
    expect(vm.changeText).toBeUndefined()
    expect(vm.points).toEqual([])
  })

  it('reports a missing entity as missing', () => {
    expect(cryptoViewModel('BTC', undefined, [1, 2])).toMatchObject({ missing: true, price: '—' })
  })
})
