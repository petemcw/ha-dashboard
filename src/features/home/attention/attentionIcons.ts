import { createElement } from 'react'
import {
  AirVent,
  ArrowDownToLine,
  BatteryLow,
  Check,
  CircleArrowUp,
  CircleQuestionMark,
  DoorOpen,
  Fan,
  Heater,
  Lightbulb,
  Power,
  Printer,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { ActionIcon, AttentionIcon, AttentionItem } from './types'

// Icons are imported by name so the bundle carries only these; never `icons` or
// `DynamicIcon`, which pull in the whole set. Lucide has no garage glyph, so a warehouse
// stands in for the garage badge.
export function badgeIcon(name: AttentionIcon): LucideIcon {
  switch (name) {
    case 'garage':
      return Warehouse
    case 'door':
      return DoorOpen
    case 'heater':
      return Heater
    case 'light':
      return Lightbulb
    case 'fan':
      return Fan
    case 'power':
      return Power
    case 'battery':
      return BatteryLow
    case 'update':
      return CircleArrowUp
    case 'filter':
      return AirVent
    case 'toner':
      return Printer
    case 'missing':
      return CircleQuestionMark
  }
}

export function actionIcon(name: ActionIcon): LucideIcon {
  switch (name) {
    case 'power':
      return Power
    case 'close-garage':
      return ArrowDownToLine
    case 'check':
      return Check
    case 'cart':
      return ShoppingCart
  }
}

// A left-on rule picks its own badge; every other kind has one fixed glyph.
const itemIcon = (item: AttentionItem): AttentionIcon =>
  item.kind === 'left-on' ? item.icon : item.kind

// Components, so a row renders a glyph without building a component during render.
export const BadgeGlyph = ({ item }: { item: AttentionItem }) =>
  createElement(badgeIcon(itemIcon(item)), { 'aria-hidden': true, size: 18 })

export const ActionGlyph = ({ name }: { name: ActionIcon }) =>
  createElement(actionIcon(name), { 'aria-hidden': true, size: 18 })
