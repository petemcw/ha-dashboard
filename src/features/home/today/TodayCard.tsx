import { Sun } from 'lucide-react'
import { SectionCard } from '../SectionCard'
import { STATUS_TEXT } from '../statusText'
import type { TodayViewModel } from './todayViewModel'

const deg = (n: number | undefined) => (n === undefined ? '–' : `${Math.round(n)}°`)

function Stat({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <span>{label}</span>
      <span>{value ?? '–'}</span>
    </div>
  )
}

export function TodayCard({ vm }: { vm: TodayViewModel }) {
  const { weather } = vm
  const Icon = weather.icon
  const hilo =
    vm.high !== undefined || vm.low !== undefined
      ? `High ${deg(vm.high)} · Low ${deg(vm.low)}`
      : undefined
  const wind =
    weather.wind_speed === undefined
      ? undefined
      : `${Math.round(weather.wind_speed)}${weather.wind_speed_unit ? ` ${weather.wind_speed_unit}` : ''}`
  return (
    <SectionCard
      title="Today"
      icon={Sun}
      className="today"
      chip={vm.sunsetText && <span className="today__sunset">{vm.sunsetText}</span>}
    >
      {weather.status !== 'ok' ? (
        <p className="today__status">{STATUS_TEXT[weather.status]}</p>
      ) : (
        <>
          <div className="today__main">
            <Icon className="today__icon" size={46} aria-hidden="true" />
            <div className="today__temp">{deg(weather.temperature)}</div>
            <div>
              <div className="today__cond">{weather.conditionLabel}</div>
              {hilo && <div className="today__hilo">{hilo}</div>}
            </div>
          </div>
          <div className="today__stats">
            <Stat
              label="Humidity"
              value={
                weather.humidity === undefined ? undefined : `${Math.round(weather.humidity)}%`
              }
            />
            <Stat label="Wind" value={wind} />
            <Stat label="UV" value={weather.uv_index?.toString()} />
          </div>
          {vm.hours.length > 0 && (
            <ul className="today__hourly" aria-label="Next hours">
              {vm.hours.map((h) => {
                const HourIcon = h.icon
                return (
                  <li key={h.key}>
                    <span className="today__hour">{h.label}</span>
                    {HourIcon && <HourIcon size={18} aria-label={h.conditionLabel} role="img" />}
                    <span>{deg(h.temperature)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </SectionCard>
  )
}
