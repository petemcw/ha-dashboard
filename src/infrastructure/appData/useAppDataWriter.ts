import { useEffect, useRef, useState } from 'react'
import { getConnection } from '../ha/connection'
import { setAppData, type AppDataScope } from './appData'

export type AppDataWriter<T> = {
  pending: boolean
  // The last write was rejected. Nothing is applied locally, so the screen still shows
  // what HA has stored.
  failed: boolean
  write: (change: (current: T) => unknown) => void
}

// Every write is a read-modify-write of the whole value, so it only goes out when the
// caller says the stored value is safe to replace (`allowed`: loaded, a version this app
// understands, permitted for this user) and no other write is in flight. `change` gets
// the latest value the caller passed in, never a render-time copy a quick second tap
// could reuse.
export function useAppDataWriter<T>(
  scope: AppDataScope,
  key: string,
  current: T,
  allowed: boolean,
  connect = getConnection,
): AppDataWriter<T> {
  const latest = useRef(current)
  useEffect(() => {
    latest.current = current
  })
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const write = (change: (current: T) => unknown) => {
    if (!allowed || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setFailed(false)
    setAppData(scope, key, change(latest.current), connect)
      .catch(() => setFailed(true))
      .finally(() => {
        inFlight.current = false
        setPending(false)
      })
  }

  return { pending, failed, write }
}
