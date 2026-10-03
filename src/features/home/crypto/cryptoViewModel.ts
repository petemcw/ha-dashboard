import type { HassEntity } from 'home-assistant-js-websocket'

export type CryptoViewModel = {
  symbol: string
  missing: boolean
  price: string
  // Signed text ("+1.2%"), so the direction never depends on color alone.
  changeText?: string
  direction?: 'up' | 'down' | 'flat'
  // Hourly means followed by the live price; empty when there's nothing to draw.
  points: number[]
}

const DASH = '—'
const MINUS = '−'

// Whole dollars for the big coins, cents for SOL.
const whole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function formatChange(percent: number): string {
  const rounded = Math.round(Math.abs(percent) * 10) / 10
  if (rounded === 0) return '0.0%'
  return `${percent > 0 ? '+' : MINUS}${rounded.toFixed(1)}%`
}

export function cryptoViewModel(
  symbol: string,
  entity: HassEntity | undefined,
  hourlyMeans: number[],
): CryptoViewModel {
  const unknown = { symbol, price: DASH, points: [] }
  if (!entity) return { ...unknown, missing: true }
  const value = Number(entity.state)
  if (entity.state.trim() === '' || !Number.isFinite(value)) return { ...unknown, missing: false }

  const price = (symbol === 'SOL' ? cents : whole).format(value)
  if (hourlyMeans.length === 0 || hourlyMeans[0] === 0) {
    return { symbol, missing: false, price, points: [] }
  }
  const percent = ((value - hourlyMeans[0]) / hourlyMeans[0]) * 100
  const changeText = formatChange(percent)
  return {
    symbol,
    missing: false,
    price,
    changeText,
    direction: changeText.startsWith('+') ? 'up' : changeText.startsWith(MINUS) ? 'down' : 'flat',
    points: [...hourlyMeans, value],
  }
}
