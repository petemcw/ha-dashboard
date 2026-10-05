import { mdiTuneVariant } from '@mdi/js'
import type { ReactNode } from 'react'
import { useNow } from '../../../infrastructure/clock/clock'
import { clockParts } from '../formatClock'
import { Icon } from '../../shared/icons/Icon'
import { greetingFor } from './greeting'
import './HeaderBar.css'

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

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
  // The same locale formatting as the times on the cards, with am/pm set small.
  const { digits, period } = clockParts(now)

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
          <Icon path={mdiTuneVariant} size={19} />
        </button>
      </div>
    </header>
  )
}
