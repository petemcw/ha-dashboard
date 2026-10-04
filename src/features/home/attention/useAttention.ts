import { getConnection } from '../../../infrastructure/ha/connection'
import { useAttentionItems } from './useAttentionItems'
import { useSnoozes } from './useSnoozes'

// Attention items with snoozes applied. Called once per screen and passed down: both the
// house sign and the attention section read it, and a second useSnoozes would run a
// second admin cleanup writer.
export function useAttention(connect: typeof getConnection = getConnection) {
  const { items: all, resolvedIds } = useAttentionItems()
  const snoozing = useSnoozes(resolvedIds, connect)
  const items = all.filter((i) => !snoozing.isSnoozed(i.id))
  return {
    items,
    urgent: items.filter((i) => i.tier === 'urgent'),
    chores: items.filter((i) => i.tier === 'chore'),
    snoozed: all.filter((i) => snoozing.isSnoozed(i.id)),
    snoozing,
  }
}

export type Attention = ReturnType<typeof useAttention>
