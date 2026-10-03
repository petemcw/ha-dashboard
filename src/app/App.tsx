import { useEffect, useState } from 'react'
import { useLoadedHomeConfig } from '../config/useLoadedHomeConfig'
import { resetConnection, saveKioskToken } from '../infrastructure/ha/connection'
import { startSession } from '../infrastructure/ha/session'
import { useConnectionStatus } from '../infrastructure/ha/useConnectionStatus'
import { AppShell } from './AppShell'
import { HomeConfigGate } from './HomeConfigGate'
import { KioskTokenForm } from './kiosk/KioskTokenForm'

export default function App() {
  // Bumped to open a new connection after a token was saved, without a page reload.
  const [attempt, setAttempt] = useState(0)
  const status = useConnectionStatus()
  const homeConfig = useLoadedHomeConfig()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => startSession(), [attempt])

  const reconnect = () => {
    resetConnection()
    setAttempt((n) => n + 1)
  }

  if (status.kind === 'needs-token') {
    return (
      <KioskTokenForm
        error={status.error}
        onSubmit={(token) => {
          saveKioskToken(token)
          reconnect()
        }}
      />
    )
  }
  return (
    <HomeConfigGate state={homeConfig}>
      <AppShell onTokenSaved={reconnect} />
    </HomeConfigGate>
  )
}
