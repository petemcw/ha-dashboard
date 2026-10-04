import { entityState } from '../src/domains/factories.ts'
import { expect, test } from './fixtures.ts'

const coin = (symbol: string, state: string) =>
  entityState({
    entity_id: `sensor.${symbol}_exchange_rate`,
    state,
    attributes: { unit_of_measurement: 'USD' },
  })

const hourly = (...means: number[]) =>
  means.map((mean, i) => ({ start: i * 3_600_000, end: (i + 1) * 3_600_000, mean }))

test.use({
  haOptions: {
    entities: [coin('btc', '101'), coin('eth', '3000'), coin('sol', '142.5')],
    statistics: {
      'sensor.btc_exchange_rate': hourly(100, 98, 99),
      'sensor.eth_exchange_rate': hourly(2000, 2500),
    },
  },
})

test('shows prices, signed change and a sparkline, then follows a live price change', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const row = page.getByRole('region', { name: 'Crypto' })
  await expect(row).toContainText('BTC $101 +1.0%')
  await expect(row).toContainText('ETH $3,000 +50.0%')
  // SOL has no statistics: price only.
  await expect(row).toContainText('SOL $142.50')
  await expect(row.locator('.crypto-spark svg[aria-hidden="true"]')).toHaveCount(2)

  const statsCalls = () =>
    mockHa.sent().filter((m) => m.type === 'recorder/statistics_during_period').length
  const before = statsCalls()
  mockHa.setState(coin('btc', '110'))
  await expect(row).toContainText('BTC $110 +10.0%')
  expect(statsCalls()).toBe(before)
  await page.screenshot({ path: 'e2e/screenshots/crypto.png' })
})

test('shows a dash while the price is unavailable', async ({ page, mockHa }) => {
  await page.goto('/')
  const row = page.getByRole('region', { name: 'Crypto' })
  await expect(row).toContainText('BTC $101')
  mockHa.setState(coin('btc', 'unavailable'))
  await expect(row).toContainText('BTC —')
})
