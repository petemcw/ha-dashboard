import { useEffect, useState } from 'react'
import { getConnection } from '../ha/connection'
import { subscribeAppData, type AppDataScope } from './appData'

type AppData = { value: unknown; loaded: boolean }

const NOT_LOADED: AppData = { value: null, loaded: false }

// `loaded` turns true with the first value from HA. Writers must wait for it, or they
// could overwrite data they haven't read yet.
export function useAppData(scope: AppDataScope, key: string, connect = getConnection): AppData {
  const [data, setData] = useState<AppData>(NOT_LOADED)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => Promise<void>) | undefined
    connect().then(
      (conn) =>
        subscribeAppData(conn, scope, key, (value) => {
          if (!cancelled) setData({ value, loaded: true })
        }).then((unsub) => {
          if (cancelled) void unsub()
          else unsubscribe = unsub
        }),
      // The connection banner reports it; stay unloaded rather than claim "nothing stored".
      () => {},
    )
    return () => {
      cancelled = true
      void unsubscribe?.()
    }
  }, [scope, key, connect])

  return data
}
