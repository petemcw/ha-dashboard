import type { AttentionItem } from '../attention/types'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// One plain sentence for the sign: readable across a room, so it names a single urgent
// thing outright and only counts when there are several. Snoozed items are left out by
// the caller.
export function houseStatus(urgent: AttentionItem[], chores: AttentionItem[]): string {
  if (urgent.length === 0 && chores.length === 0) return 'All quiet at home.'
  let lead = 'Nothing urgent.'
  if (urgent.length === 1) {
    const [{ title, detail }] = urgent
    lead = detail ? `${title}: ${detail.charAt(0).toLowerCase()}${detail.slice(1)}.` : `${title}.`
  } else if (urgent.length > 1) {
    lead = `${urgent.length} things need you now.`
  }
  if (chores.length === 0) return lead
  return `${lead} ${plural(chores.length, 'chore', 'chores')} waiting.`
}
