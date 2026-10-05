import { mdiClockOutline } from '@mdi/js'
import type { ReactNode } from 'react'
import { Icon } from '../../shared/icons/Icon'
import { SnoozedDisclosure } from './SnoozedDisclosure'

// Takes the attention card's place when nothing needs attention but something is snoozed,
// so snoozed items aren't forgotten. `children` go under the bar: the list and any status.
export function SnoozedStrip({ children }: { children?: ReactNode }) {
  return (
    <section className="snoozed" aria-label="Snoozed">
      <div className="snoozed__bar">
        <Icon path={mdiClockOutline} size={16} />
        <SnoozedDisclosure.Summary />
        <SnoozedDisclosure.Toggle />
      </div>
      {children}
    </section>
  )
}
