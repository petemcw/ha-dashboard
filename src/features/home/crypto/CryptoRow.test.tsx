import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { entityState } from '../../../domains/factories'

const send = vi.fn()
vi.mock('../../../infrastructure/ha/connection', () => ({
  getConnection: () =>
    Promise.resolve({ sendMessagePromise: send, addEventListener() {}, removeEventListener() {} }),
}))

import { CryptoRow } from './CryptoRow'

const price = (symbol: string, state: string) =>
  entityState({ entity_id: `sensor.${symbol}_exchange_rate`, state })
const series = (...means: number[]) => means.map((mean, i) => ({ start: i, end: i + 1, mean }))

beforeEach(() => {
  send.mockResolvedValue({
    'sensor.btc_exchange_rate': series(100, 110),
    'sensor.eth_exchange_rate': series(10, 20),
  })
})
afterEach(() => {
  entityStore.reset()
  send.mockReset()
})

const load = (...entities: ReturnType<typeof price>[]) =>
  act(() => entityStore.setEntities(Object.fromEntries(entities.map((e) => [e.entity_id, e]))))

describe('crypto row', () => {
  it('reads each coin with price and signed change, and draws a sparkline when there is history', async () => {
    render(<CryptoRow />)
    load(price('btc', '105'), price('eth', '7.5'), price('sol', '142.5'))
    expect(await screen.findByText('+5.0%')).toBeInTheDocument()
    expect(screen.getByText('−25.0%')).toBeInTheDocument()
    expect(screen.getByText('$142.50')).toBeInTheDocument()
    expect(screen.getAllByTestId('sparkline')).toHaveLength(2)
  })

  it('updates the price when the entity changes without refetching statistics', async () => {
    render(<CryptoRow />)
    load(price('btc', '105'), price('eth', '7.5'), price('sol', '142.5'))
    await screen.findByText('+5.0%')
    const calls = send.mock.calls.length
    load(price('btc', '120'), price('eth', '7.5'), price('sol', '142.5'))
    expect(screen.getByText('$120')).toBeInTheDocument()
    expect(screen.getByText('+20.0%')).toBeInTheDocument()
    expect(send.mock.calls.length).toBe(calls)
  })
})
