import { Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { SnoozedDisclosure } from './SnoozedDisclosure'

// Takes the attention card's place when nothing needs attention but something is snoozed,
// so snoozed items aren't forgotten. `children` go under the bar: the list and any status.
export function SnoozedStrip({ children }: { children?: ReactNode }) {
  return (
    <section className="snoozed" aria-label="Snoozed">
      <div className="snoozed__bar">
        <Clock size={16} aria-hidden="true" />
        <SnoozedDisclosure.Summary />
        <SnoozedDisclosure.Toggle />
      </div>
      {children}
    </section>
  )
}
