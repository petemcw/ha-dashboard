import type { EntityStatus } from '../../../domains/entityStatus'
import type { SunViewModel } from '../../../domains/sun/types'
import type { WeatherViewModel } from '../../../domains/weather/types'
import { conditionLabel } from '../../../domains/weather/viewModel'
import type { ForecastEntry } from '../../../infrastructure/ha/forecast'
import { formatClock, formatHour } from '../formatClock'

const HOURS_SHOWN = 7
const HOUR_MS = 3_600_000
const DASH = '–'

export type HourViewModel = {
  key: string
  label: string
  // HA's condition value, for the icon.
  condition?: string
  conditionLabel?: string
  temperatureText: string
}

export type StatViewModel = { label: string; value: string }

export type TodayViewModel = {
  status: EntityStatus
  condition?: string
  conditionLabel?: string
  temperatureText: string
  highLowText?: string
  stats: StatViewModel[]
  hours: HourViewModel[]
  sunsetText?: string
}

type Input = {
  weather: WeatherViewModel
  sun: SunViewModel
  daily: ForecastEntry[] | undefined
  hourly: ForecastEntry[] | undefined
  now: Date
  // For tests; the app follows the browser's locale.
  locale?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const toDate = (iso: string) => new Date(iso)
const validDate = (d: Date) => !Number.isNaN(d.getTime())

const deg = (n: number | undefined) => (n === undefined ? DASH : `${Math.round(n)}°`)

// A bare date, or midnight UTC: some integrations write the forecast's calendar day this
// way. Read as an instant, it would land on the previous evening west of UTC and make
// tomorrow's entry look like today's.
const CALENDAR_DAY = /^(\d{4}-\d{2}-\d{2})(?:T00:00(?::00(?:\.0+)?)?(?:Z|[+-]00:?00))?$/

// The day a daily entry is for. Any other datetime is a real instant (met.no sends local
// noon in UTC; others send local midnight with an offset), so it is read in local time.
function forecastDay(datetime: string): string | undefined {
  const calendarDay = CALENDAR_DAY.exec(datetime)?.[1]
  if (calendarDay) return calendarDay
  const d = toDate(datetime)
  return validDate(d) ? localDay(d) : undefined
}

function stats(weather: WeatherViewModel): StatViewModel[] {
  const { humidity, windSpeed, windSpeedUnit, uvIndex } = weather
  const wind =
    windSpeed === undefined
      ? DASH
      : `${Math.round(windSpeed)}${windSpeedUnit ? ` ${windSpeedUnit}` : ''}`
  return [
    { label: 'Humidity', value: humidity === undefined ? DASH : `${Math.round(humidity)}%` },
    { label: 'Wind', value: wind },
    { label: 'UV', value: uvIndex === undefined ? DASH : String(uvIndex) },
  ]
}

export function todayViewModel({
  weather,
  sun,
  daily,
  hourly,
  now,
  locale,
}: Input): TodayViewModel {
  // Some integrations start the daily list at tomorrow late in the day; never show that as today's.
  const today = daily?.find((e) => forecastDay(e.datetime) === localDay(now))
  const hours = (hourly ?? [])
    .filter((e) => {
      const d = toDate(e.datetime)
      return validDate(d) && d.getTime() + HOUR_MS > now.getTime()
    })
    .slice(0, HOURS_SHOWN)
    .map((e, i): HourViewModel => {
      const d = toDate(e.datetime)
      return {
        key: e.datetime,
        label: i === 0 && d.getTime() <= now.getTime() ? 'Now' : formatHour(d, locale),
        condition: e.condition,
        conditionLabel: e.condition ? conditionLabel(e.condition) : undefined,
        temperatureText: deg(e.temperature),
      }
    })
  const hasHighLow = today?.temperature !== undefined || today?.templow !== undefined
  return {
    status: weather.status,
    condition: weather.condition,
    conditionLabel: weather.conditionLabel,
    temperatureText: deg(weather.temperature),
    highLowText: hasHighLow
      ? `High ${deg(today?.temperature)} · Low ${deg(today?.templow)}`
      : undefined,
    stats: stats(weather),
    hours,
    sunsetText: sun.nextSetting ? `Sunset ${formatClock(sun.nextSetting, locale)}` : undefined,
  }
}
