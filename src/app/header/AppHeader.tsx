import { useNow } from '../../infrastructure/clock/clock'
import { greetingFor } from './greeting'

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

type AppHeaderProps = { settingsOpen: boolean; onOpenSettings: () => void }

export function AppHeader({ settingsOpen, onOpenSettings }: AppHeaderProps) {
  const now = useNow()
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img src="/maple_frontier_logo.svg" alt="" width={40} height={40} />
        <span className="app-header__name">Maple Frontier</span>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
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
      <div className="app-header__greeting">
        <p className="app-header__hello">{greetingFor(now)}</p>
        <p className="app-header__date">{formatDate(now)}</p>
      </div>
    </header>
  )
}
