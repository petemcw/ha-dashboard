import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
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
  // Who's home, set beside the greeting.
  people?: ReactNode
}

// True once `target` has scrolled up under the sticky bar. Without IntersectionObserver
// (old browsers, jsdom) the bar simply never collapses.
function useScrolledUnder(
  target: RefObject<HTMLElement | null>,
  bar: RefObject<HTMLElement | null>,
) {
  const [under, setUnder] = useState(false)
  useEffect(() => {
    const el = target.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setUnder(!entry.isIntersecting), {
      rootMargin: `-${bar.current?.offsetHeight ?? 0}px 0px 0px 0px`,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, bar])
  return under
}

// The timber sign at the top of the home screen: who we are, the time of day, and the
// house's state in one sentence, big enough to read from across the room. Its top row
// stays pinned as a bar; once the sentence scrolls under it, the bar carries a one-line
// copy, like an iOS large title collapsing into the navigation bar.
export function HouseSign({ loaded, urgent, chores, onOpenSettings, people }: HouseSignProps) {
  const now = useNow()
  const barRef = useRef<HTMLElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const collapsed = useScrolledUnder(statusRef, barRef)
  const status = loaded ? houseStatus(urgent, chores) : 'Connecting to the house…'
  const isUrgent = urgent.length > 0

  return (
    <>
      <header ref={barRef} className="sign-bar" data-collapsed={collapsed ? '' : undefined}>
        <span className="sign__brand">
          <span className="sign__badge">
            <img src="/maple_frontier_logo.svg" alt="" width={28} height={28} />
          </span>
          <span className="sign__name">Maple Frontier</span>
        </span>
        {collapsed && (
          // A copy for the eye only: the full sentence below is what assistive tech reads.
          <span
            className="sign-bar__status"
            aria-hidden="true"
            data-urgent={isUrgent ? '' : undefined}
          >
            {status}
          </span>
        )}
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
      </header>
      <div className="sign">
        <div className="sign__text">
          <p className="sign__greeting">{greetingFor(now)}</p>
          <p ref={statusRef} className="sign__status" data-urgent={isUrgent ? '' : undefined}>
            {status}
          </p>
          <p className="sign__date">{formatDate(now)}</p>
        </div>
        {people}
      </div>
    </>
  )
}
