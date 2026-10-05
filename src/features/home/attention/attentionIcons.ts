import {
  mdiAirFilter,
  mdiArrowCollapseDown,
  mdiArrowUpCircleOutline,
  mdiBatteryLow,
  mdiCart,
  mdiCheck,
  mdiDoorOpen,
  mdiFan,
  mdiGarage,
  mdiHelpCircleOutline,
  mdiLightbulb,
  mdiPower,
  mdiPrinter,
  mdiRadiator,
} from '@mdi/js'
import type { ActionIcon, AttentionIcon, AttentionItem } from './types'

// Icons are imported by name so the bundle carries only these; never the whole `@mdi/js`
// namespace, which defeats tree-shaking.
export function badgeIcon(name: AttentionIcon): string {
  switch (name) {
    case 'garage':
      return mdiGarage
    case 'door':
      return mdiDoorOpen
    case 'heater':
      return mdiRadiator
    case 'light':
      return mdiLightbulb
    case 'fan':
      return mdiFan
    case 'power':
      return mdiPower
    case 'battery':
      return mdiBatteryLow
    case 'update':
      return mdiArrowUpCircleOutline
    case 'filter':
      return mdiAirFilter
    case 'toner':
      return mdiPrinter
    case 'missing':
      return mdiHelpCircleOutline
  }
}

export function actionIcon(name: ActionIcon): string {
  switch (name) {
    case 'power':
      return mdiPower
    case 'close-garage':
      return mdiArrowCollapseDown
    case 'check':
      return mdiCheck
    case 'cart':
      return mdiCart
  }
}

// A left-on rule picks its own badge; every other kind has one fixed glyph.
export const itemIcon = (item: AttentionItem): AttentionIcon =>
  item.kind === 'left-on' ? item.icon : item.kind
