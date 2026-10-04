import { getConnection } from '../../../infrastructure/ha/connection'
import { useAttentionItems } from './useAttentionItems'
import { useSnoozes } from './useSnoozes'

// Attention items with snoozes applied. Called once per screen, in HomeScreen: a second
// useSnoozes would run a second admin cleanup writer, and calling it from the top of the
// screen starts loading snoozes before the first entity map, so a snoozed item doesn't
// flash into the card while they load.
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
