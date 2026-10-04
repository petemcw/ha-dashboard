import type { ReactNode } from 'react'
import './Chip.css'

export type ChipTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'leaf'

type ChipProps = {
  // Sets the text colour and fill. Neutral is muted text on a sunken fill.
  tone?: ChipTone
  // Soft is a tinted fill for a status; outline is a quieter tag with a visible border.
  variant?: 'soft' | 'outline'
  // A status light before the text, in the tone's colour.
  dot?: boolean
  // 'li' when the chip is one item of a list of chips.
  as?: 'span' | 'li'
  children: ReactNode
}

// A small pill for a count, a status, or a tag. Decoration only: the text carries the
// meaning, so the tone never has to.
export function Chip({
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  as: Tag = 'span',
  children,
}: ChipProps) {
  const className = ['chip', `chip--${tone}`, `chip--${variant}`, dot && 'chip--dot']
    .filter(Boolean)
    .join(' ')
  return <Tag className={className}>{children}</Tag>
}
