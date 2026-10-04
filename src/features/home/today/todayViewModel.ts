import type { LucideIcon } from 'lucide-react'
import type { SunViewModel } from '../../../domains/sun/types'
import type { WeatherViewModel } from '../../../domains/weather/types'
import { conditionInfo } from '../../../domains/weather/viewModel'
import type { ForecastEntry } from '../../../infrastructure/ha/forecast'
import { formatClock } from '../formatClock'

const HOURS_SHOWN = 7
const HOUR_MS = 3_600_000

export type HourViewModel = {
  key: string
  label: string
  icon?: LucideIcon
  conditionLabel?: string
  temperature?: number
}

export type TodayViewModel = {
  weather: WeatherViewModel
  high?: number
  low?: number
  hours: HourViewModel[]
  sunsetText?: string
}

type Input = {
  weather: WeatherViewModel
  sun: SunViewModel
  daily: ForecastEntry[] | undefined
  hourly: ForecastEntry[] | undefined
  now: Date
}

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const toDate = (iso: string) => new Date(iso)
const validDate = (d: Date) => !Number.isNaN(d.getTime())
const number = (v: unknown) => (typeof v === 'number' ? v : undefined)

// "7p", "12a": the compact hour the strip has room for.
function hourLabel(d: Date): string {
  const h = d.getHours()
  return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`
}

export function todayViewModel({ weather, sun, daily, hourly, now }: Input): TodayViewModel {
  // Some integrations start the daily list at tomorrow late in the day; never show that as today's.
  const today = daily?.find((e) => {
    const d = toDate(e.datetime)
    return validDate(d) && sameLocalDay(d, now)
  })
  const hours = (hourly ?? [])
    .filter((e) => {
      const d = toDate(e.datetime)
      return validDate(d) && d.getTime() + HOUR_MS > now.getTime()
    })
    .slice(0, HOURS_SHOWN)
    .map((e, i): HourViewModel => {
      const d = toDate(e.datetime)
      const info = e.condition ? conditionInfo(e.condition) : undefined
      return {
        key: e.datetime,
        label: i === 0 && d.getTime() <= now.getTime() ? 'Now' : hourLabel(d),
        icon: info?.icon,
        conditionLabel: info?.label,
        temperature: number(e.temperature),
      }
    })
  return {
    weather,
    high: number(today?.temperature),
    low: number(today?.templow),
    hours,
    sunsetText: sun.nextSetting ? `Sunset ${formatClock(sun.nextSetting)}` : undefined,
  }
}
