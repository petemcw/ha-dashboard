import type { ReactNode } from 'react'
import { HomeConfigProvider } from '../config/HomeConfigProvider'
import type { HomeConfigState } from '../config/useLoadedHomeConfig'
import './HomeConfigGate.css'

// Holds the app back until home.json is in hand: every home screen section reads it.
export function HomeConfigGate({
  state,
  children,
}: {
  state: HomeConfigState
  children: ReactNode
}) {
  if (state.kind === 'loading') {
    return (
      <main className="home">
        <p className="home__connecting">Connecting…</p>
      </main>
    )
  }
  if (state.kind === 'failed') {
    return (
      <main className="home">
        <p role="alert" className="panel setup-error">
          This dashboard needs a home.json that lists your entities. Copy home.example.json to
          home.json, edit it, and serve it as /home.json (see deploy/compose.yml). {state.message}
        </p>
      </main>
    )
  }
  return <HomeConfigProvider config={state.config}>{children}</HomeConfigProvider>
}
