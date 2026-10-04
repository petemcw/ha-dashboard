import { useNow } from '../../../infrastructure/clock/clock'
import type { AttentionItem } from '../attention/types'
import { greetingFor } from './greeting'
import { houseStatus } from './houseStatus'

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

type HouseSignProps = {
  // False until HA has sent the entity map; before that the house has no status yet.
  loaded: boolean
  urgent: AttentionItem[]
  chores: AttentionItem[]
  onOpenSettings?: () => void
}

// The timber sign at the top of the home screen: who we are, the time of day, and the
// house's state in one sentence, big enough to read from across the room.
export function HouseSign({ loaded, urgent, chores, onOpenSettings }: HouseSignProps) {
  const now = useNow()
  return (
    <header className="sign">
      <div className="sign__bar">
        <span className="sign__brand">
          <span className="sign__badge">
            <img src="/maple_frontier_logo.svg" alt="" width={28} height={28} />
          </span>
          Maple Frontier
        </span>
        <button
          type="button"
          className="icon-button sign__settings"
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
      <p className="sign__greeting">{greetingFor(now)}</p>
      <p className="sign__status" data-urgent={urgent.length > 0 ? '' : undefined}>
        {loaded ? houseStatus(urgent, chores) : 'Connecting to the house…'}
      </p>
      <p className="sign__date">{formatDate(now)}</p>
    </header>
  )
}
