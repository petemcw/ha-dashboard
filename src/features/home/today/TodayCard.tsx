import { mdiWeatherSunny } from '@mdi/js'
import { Icon } from '../../shared/icons/Icon'
import { SectionCard } from '../../shared/SectionCard'
import { STATUS_TEXT } from '../../shared/statusText'
import type { TodayViewModel } from './todayViewModel'
import { weatherIcon } from './weatherIcon'
import './TodayCard.css'

// A weather icon in the mock-up's colours (see the tone rules in TodayCard.css).
function ConditionIcon({
  condition,
  size,
  className,
  label,
}: {
  condition: string
  size: number
  className?: string
  label?: string
}) {
  const { path, tone } = weatherIcon(condition)
  const classes = ['wx-icon', tone && `wx-icon--${tone}`, className].filter(Boolean).join(' ')
  return label ? (
    <Icon path={path} className={classes} size={size} title={label} />
  ) : (
    <Icon path={path} className={classes} size={size} />
  )
}

export function TodayCard({ vm }: { vm: TodayViewModel }) {
  return (
    <SectionCard
      title="Today"
      icon={mdiWeatherSunny}
      className="today"
      chip={vm.sunsetText && <span className="today__sunset">{vm.sunsetText}</span>}
    >
      {vm.status !== 'ok' ? (
        <p className="today__status">{STATUS_TEXT[vm.status]}</p>
      ) : (
        <>
          <div className="today__main">
            {vm.condition && (
              <ConditionIcon condition={vm.condition} size={46} className="today__icon" />
            )}
            <div className="today__temp">{vm.temperatureText}</div>
            <div>
              <div className="today__cond">{vm.conditionLabel}</div>
              {vm.highLowText && <div className="today__hilo">{vm.highLowText}</div>}
            </div>
          </div>
          <div className="today__stats">
            {vm.stats.map((s) => (
              <div key={s.label}>
                <span>{s.label}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
          {vm.hours.length > 0 && (
            <ul className="today__hourly" aria-label="Next hours">
              {vm.hours.map((h) => (
                <li key={h.key}>
                  <span className="today__hour">{h.label}</span>
                  {h.condition && (
                    <ConditionIcon condition={h.condition} size={18} label={h.conditionLabel} />
                  )}
                  <span>{h.temperatureText}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </SectionCard>
  )
}
