import type { Connection } from 'home-assistant-js-websocket'

export type ForecastType = 'hourly' | 'daily'

// A raw entry as HA's weather platform pushes it. Only `datetime` and `condition` are
// guaranteed; the rest depends on the integration and the forecast type.
export type ForecastEntry = {
  datetime: string
  condition?: string
  temperature?: number
  templow?: number
  precipitation_probability?: number
  [attribute: string]: unknown
}

// The library resubscribes after a reconnect and HA pushes a fresh forecast then, so there
// is no timer or `ready` handler here. A null or malformed forecast is dropped so the
// caller keeps the last good one.
export function subscribeForecast(
  conn: Connection,
  entityId: string,
  type: ForecastType,
  onForecast: (forecast: ForecastEntry[]) => void,
): Promise<() => Promise<void>> {
  return conn.subscribeMessage<{ forecast?: unknown } | undefined>(
    (event) => {
      if (Array.isArray(event?.forecast)) onForecast(event.forecast as ForecastEntry[])
    },
    { type: 'weather/subscribe_forecast', entity_id: entityId, forecast_type: type },
  )
}
