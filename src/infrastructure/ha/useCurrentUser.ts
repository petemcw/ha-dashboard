import { useEffect, useState } from 'react'
import { fetchCurrentUser, type CurrentUser } from './currentUser'
import { getConnection } from './connection'

// undefined until HA answers (or if it never does): callers treat that as "not an admin",
// so admin-only controls stay hidden rather than flash and fail.
export function useCurrentUser(connect = getConnection): CurrentUser | undefined {
  const [user, setUser] = useState<CurrentUser>()
  useEffect(() => {
    let cancelled = false
    connect()
      .then(fetchCurrentUser)
      .then(
        (u) => {
          if (!cancelled) setUser(u)
        },
        () => {},
      )
    return () => {
      cancelled = true
    }
  }, [connect])
  return user
}
