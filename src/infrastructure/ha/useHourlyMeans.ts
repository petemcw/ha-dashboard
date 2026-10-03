import { useEffect, useState } from 'react'
import { getConnection } from './connection'
import { fetchHourlyMeans } from './statistics'

const REFRESH_MS = 15 * 60_000

const NONE: Record<string, number[]> = {}

// Long-term statistics aren't pushed, so refetch on a timer and after a reconnect
// (the history may have grown while the socket was down). Live values come from the
// entity store instead, never from here.
export function useHourlyMeans(
  statisticIds: string[],
  hours: number,
  connect = getConnection,
): Record<string, number[]> {
  const [means, setMeans] = useState(NONE)
  const key = statisticIds.join(',')

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    connect().then(
      (conn) => {
        if (cancelled) return
        const load = () => {
          fetchHourlyMeans(conn, key.split(','), hours).then(
            (next) => {
              if (!cancelled) setMeans(next)
            },
            // Keep the last good series; the next tick or reconnect retries.
            () => {},
          )
        }
        load()
        const timer = setInterval(load, REFRESH_MS)
        conn.addEventListener('ready', load)
        cleanup = () => {
          clearInterval(timer)
          conn.removeEventListener('ready', load)
        }
      },
      () => {},
    )
    return () => {
      cancelled = true
      cleanup()
    }
  }, [key, hours, connect])

  return means
}
