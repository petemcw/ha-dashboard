import { sunState } from '../src/domains/sun/factories.ts'
import { weatherState } from '../src/domains/weather/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

const WEATHER = 'weather.forecast_home'

// Local-time entries relative to now, so "today" and "next seven hours" hold on any day.
const startOfHour = new Date()
startOfHour.setMinutes(0, 0, 0)
const hours = Array.from({ length: 9 }, (_, i) => ({
  datetime: new Date(startOfHour.getTime() + i * 3_600_000).toISOString(),
  condition: 'cloudy',
  temperature: 40 + i,
}))
const midnight = new Date()
midnight.setHours(12, 0, 0, 0)
const daily = [
  { datetime: midnight.toISOString(), temperature: 61, templow: 44, condition: 'sunny' },
]
const sunset = new Date()
sunset.setHours(18, 52, 0, 0)

// The sunset and hour labels are locale-formatted; pin the locale the expectations use.
test.use({ locale: 'en-US' })

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      weatherState('partlycloudy', { entity_id: WEATHER }),
      sunState(sunset.toISOString()),
    ],
    forecasts: { [WEATHER]: { hourly: hours, daily } },
  },
})

test('shows current conditions, high and low, stats, hours, and sunset on the Today card', async ({
  page,
}) => {
  await page.goto('/')
  const today = page.getByRole('region', { name: 'Today' })
  await expect(today.getByText('54°')).toBeVisible()
  await expect(today.getByText('Partly cloudy')).toBeVisible()
  await expect(today.getByText('High 61° · Low 44°')).toBeVisible()
  await expect(today.getByText('Humidity')).toBeVisible()
  await expect(today.getByText('62%')).toBeVisible()
  await expect(today.getByText('Sunset 6:52 pm')).toBeVisible()
  await expect(today.getByRole('listitem')).toHaveCount(7)
  await expect(today.getByRole('listitem').first()).toContainText('Now')
})

test('keeps the forecast through a dropped socket, then takes updates on the new one', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const today = page.getByRole('region', { name: 'Today' })
  const hourItems = today.getByRole('listitem')
  await expect(hourItems.first()).toContainText('40°')

  mockHa.drop()
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible()
  // The last good forecast stays up while the socket is down.
  await expect(hourItems).toHaveCount(7)
  await expect(hourItems.first()).toContainText('40°')
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeHidden()

  // The old socket is closed, so these can only arrive on the resubscribed forecast.
  const warmer = (by: number) => hours.map((h) => ({ ...h, temperature: h.temperature + by }))
  mockHa.setForecast(WEATHER, 'hourly', warmer(20))
  await expect(hourItems.first()).toContainText('60°')
  mockHa.setForecast(WEATHER, 'daily', [{ ...daily[0], temperature: 66, templow: 49 }])
  await expect(today.getByText('High 66° · Low 49°')).toBeVisible()
})

test.describe('without forecasts', () => {
  test.use({
    haOptions: {
      entities: [...calmHouse(), weatherState('partlycloudy', { entity_id: WEATHER })],
    },
  })

  test('shows current conditions only, and no sunset when the sun is missing', async ({ page }) => {
    await page.goto('/')
    const today = page.getByRole('region', { name: 'Today' })
    await expect(today.getByText('Partly cloudy')).toBeVisible()
    await expect(today.getByRole('listitem')).toHaveCount(0)
    await expect(today.getByText(/High/)).toHaveCount(0)
    await expect(today.getByText(/Sunset/)).toHaveCount(0)
  })
})
