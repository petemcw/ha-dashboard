import { useEffect, useState } from 'react'
import { getConnection } from './connection'
import { subscribeForecast, type ForecastEntry, type ForecastType } from './forecast'

// Not a copy of entity state: forecasts live only in this subscription, not in the entity
// store. Undefined until the first event, and after a rejected subscription (unknown
// entity, or one without that forecast type), so the card just shows no forecast.
export function useForecast(
  entityId: string,
  type: ForecastType,
  connect = getConnection,
): ForecastEntry[] | undefined {
  const [forecast, setForecast] = useState<{ key: string; entries: ForecastEntry[] }>()
  const key = `${entityId}/${type}`

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => Promise<void>) | undefined
    connect()
      .then((conn) =>
        subscribeForecast(conn, entityId, type, (entries) => {
          if (!cancelled) setForecast({ key, entries })
        }),
      )
      .then(
        (off) => {
          if (cancelled) void off()
          else unsubscribe = off
        },
        () => {},
      )
    return () => {
      cancelled = true
      void unsubscribe?.()
    }
  }, [entityId, type, key, connect])

  // A forecast for the previous entity must not show under the new one.
  return forecast?.key === key ? forecast.entries : undefined
}
