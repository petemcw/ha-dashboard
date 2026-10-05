import { useId, type ReactNode, type Ref } from 'react'
import { Icon } from './icons/Icon'

type SectionCardProps = {
  title: string
  // An MDI path.
  icon?: string
  // Right-aligned header slot: a status chip or a link.
  chip?: ReactNode
  className?: string
  children?: ReactNode
  ref?: Ref<HTMLElement>
  // Set while the card animates out, so nothing in it can be tapped or focused.
  inert?: boolean
}

// A home screen section: a boxed card named by its own visible heading, so the region a
// screen reader lands on and the heading a person reads are the same words.
export function SectionCard({
  title,
  icon,
  chip,
  className,
  children,
  ref,
  inert,
}: SectionCardProps) {
  const headingId = useId()
  return (
    <section
      ref={ref}
      inert={inert}
      aria-labelledby={headingId}
      className={['card', className].filter(Boolean).join(' ')}
    >
      <header className="card__header">
        <h2 id={headingId} className="card__title">
          {icon && <Icon path={icon} className="card__icon" size={14} />}
          {title}
        </h2>
        {chip && <div className="card__chip">{chip}</div>}
      </header>
      {children}
    </section>
  )
}
