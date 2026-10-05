import type { OnOffViewModel } from '../../../domains/onOff'
import { STATUS_TEXT } from '../statusText'

// A toggle tile's state line: HA's trouble if there is any, else on or off. `onText` lets a
// light add its brightness.
export const onOffText = (entity: OnOffViewModel, onText = 'On') =>
  entity.status !== 'ok' ? STATUS_TEXT[entity.status] : entity.isOn ? onText : 'Off'

// A light's "on", with its brightness when HA reports one.
export const lightOnText = (percent: number | undefined) =>
  percent === undefined ? 'On' : `On, ${percent}%`
