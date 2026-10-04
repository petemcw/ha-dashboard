import type { Connection } from 'home-assistant-js-websocket'

export type ForecastType = 'hourly' | 'daily'

// An entry as HA's weather platform pushes it, keeping only the fields the dashboard reads.
// Only `datetime` is guaranteed; the rest depends on the integration and the forecast type.
export type ForecastEntry = {
  datetime: string
  condition?: string
  temperature?: number
  templow?: number
  precipitation_probability?: number
}

const NUMBER_FIELDS = ['temperature', 'templow', 'precipitation_probability'] as const

// HA sends null for a value the provider doesn't have, so null reads as absent. Any other
// wrong type means the entry can't be trusted, and it is dropped rather than crash the card.
function toEntry(raw: unknown): ForecastEntry | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.datetime !== 'string') return undefined
  const entry: ForecastEntry = { datetime: r.datetime }
  if (r.condition != null) {
    if (typeof r.condition !== 'string') return undefined
    entry.condition = r.condition
  }
  for (const field of NUMBER_FIELDS) {
    const v = r[field]
    if (v == null) continue
    if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
    entry[field] = v
  }
  return entry
}

// The library resubscribes after a reconnect and HA pushes a fresh forecast then, so there
// is no timer or `ready` handler here. An event without a forecast list is dropped so the
// caller keeps the last good one.
export function subscribeForecast(
  conn: Connection,
  entityId: string,
  type: ForecastType,
  onForecast: (forecast: ForecastEntry[]) => void,
): Promise<() => Promise<void>> {
  return conn.subscribeMessage<{ forecast?: unknown } | undefined>(
    (event) => {
      if (!Array.isArray(event?.forecast)) return
      onForecast(event.forecast.map(toEntry).filter((e) => e !== undefined))
    },
    { type: 'weather/subscribe_forecast', entity_id: entityId, forecast_type: type },
  )
}
