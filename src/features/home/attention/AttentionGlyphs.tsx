import { Icon } from '../../shared/icons/Icon'
import { actionIcon, badgeIcon, itemIcon } from './attentionIcons'
import type { ActionIcon, AttentionItem } from './types'

export const BadgeGlyph = ({ item }: { item: AttentionItem }) => (
  <Icon path={badgeIcon(itemIcon(item))} size={18} />
)

export const ActionGlyph = ({ name }: { name: ActionIcon }) => (
  <Icon path={actionIcon(name)} size={18} />
)
