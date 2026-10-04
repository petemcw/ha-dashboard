import type { LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'

type SectionCardProps = {
  title: string
  icon?: LucideIcon
  // Right-aligned header slot: a status chip or a link.
  chip?: ReactNode
  className?: string
  children?: ReactNode
}

// A home screen section: a boxed card named by its own visible heading, so the region a
// screen reader lands on and the heading a person reads are the same words.
export function SectionCard({ title, icon: Icon, chip, className, children }: SectionCardProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={['card', className].filter(Boolean).join(' ')}>
      <header className="card__header">
        <h2 id={headingId} className="card__title">
          {Icon && <Icon className="card__icon" size={14} aria-hidden="true" />}
          {title}
        </h2>
        {chip && <div className="card__chip">{chip}</div>}
      </header>
      {children}
    </section>
  )
}
