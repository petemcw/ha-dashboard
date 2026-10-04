import type { ReactNode } from 'react'
import { useNow } from '../../../infrastructure/clock/clock'
import { greetingFor } from './greeting'

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

// The locale decides 12 or 24 hour. The am/pm marker, when there is one, is split out so
// it can sit small beside the digits.
function timeParts(d: Date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).formatToParts(d)
  const period = parts.find((p) => p.type === 'dayPeriod')?.value.toLowerCase()
  const digits = parts
    .filter((p) => p.type !== 'dayPeriod')
    .map((p) => p.value)
    .join('')
    .trim()
  return { digits, period }
}

type HeaderBarProps = {
  onOpenSettings?: () => void
  // Who's home, between the greeting and the clock.
  people?: ReactNode
  // Buttons set just before Settings (the theme toggle). Passed in because features
  // can't import from src/app/.
  tools?: ReactNode
}

// The slim bar pinned to the top of the home screen: who we are, who is home, the time,
// and the tools. The attention card, not the header, says what needs doing.
export function HeaderBar({ onOpenSettings, people, tools }: HeaderBarProps) {
  const now = useNow()
  const { digits, period } = timeParts(now)

  return (
    <header className="header-bar">
      <div className="header-bar__brand">
        <span className="header-bar__logo">
          <img src="/maple_frontier_logo.svg" alt="" width={28} height={28} />
        </span>
        <div className="header-bar__text">
          <span className="header-bar__name">Maple Frontier</span>
          <p className="header-bar__greeting">{greetingFor(now)}</p>
        </div>
      </div>
      {people}
      <div className="header-bar__clock">
        <time className="header-bar__time" dateTime={now.toISOString()}>
          <span>{digits}</span>
          {period && <small>{period}</small>}
        </time>
        <span className="header-bar__date">{formatDate(now)}</span>
      </div>
      <div className="header-bar__tools">
        {tools}
        <button
          type="button"
          className="icon-button"
          aria-label="Settings"
          aria-haspopup="dialog"
          onClick={onOpenSettings}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.1.1-1.4-.1-1.4 2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.4-1.4L14.2 2h-4.4l-.4 2.6a7.6 7.6 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.6-.1 1.4.1 1.4-2 1.6 2 3.4 2.4-1c.7.6 1.5 1 2.4 1.4l.4 2.6h4.4l.4-2.6c.9-.4 1.7-.8 2.4-1.4l2.4 1 2-3.4-2-1.6Z"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
