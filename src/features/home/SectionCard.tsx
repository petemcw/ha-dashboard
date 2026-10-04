import { useId, type ReactNode } from 'react'

type SectionCardProps = {
  title: string
  // Small text beside the heading, such as a count.
  aside?: ReactNode
  className?: string
  children?: ReactNode
}

// A home screen section: a card named by its own visible heading, so the region a screen
// reader lands on and the heading a person reads are the same words.
export function SectionCard({ title, aside, className, children }: SectionCardProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={['card', className].filter(Boolean).join(' ')}>
      <header className="card__header">
        <h2 id={headingId} className="card__title">
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  )
}
