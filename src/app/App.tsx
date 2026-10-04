import { useEffect, useState } from 'react'
import { testHomeConfig } from '../config/testHomeConfig'
import { useLoadedHomeConfig, type HomeConfigState } from '../config/useLoadedHomeConfig'
import { resetConnection, saveKioskToken } from '../infrastructure/ha/connection'
import { isDemoMode } from '../infrastructure/ha/demoMode'
import { startSession } from '../infrastructure/ha/session'
import { useConnectionStatus } from '../infrastructure/ha/useConnectionStatus'
import { ServiceGatewayProvider } from '../infrastructure/serviceGateway/ServiceGatewayProvider'
import { webSocketGateway } from '../infrastructure/serviceGateway/serviceGateway'
import { AppShell } from './AppShell'
import { HomeConfigGate } from './HomeConfigGate'
import { KioskTokenForm } from './kiosk/KioskTokenForm'

// The demo house is the shared placeholder one: no /home.json, nothing real.
const DEMO_HOME_CONFIG: HomeConfigState = { kind: 'ready', config: testHomeConfig }

export default function App() {
  // Bumped to open a new connection after a token was saved, without a page reload.
  const [attempt, setAttempt] = useState(0)
  const status = useConnectionStatus()
  const demo = isDemoMode()
  const loadedHomeConfig = useLoadedHomeConfig(!demo)
  const homeConfig = demo ? DEMO_HOME_CONFIG : loadedHomeConfig
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
    <ServiceGatewayProvider gateway={webSocketGateway}>
      <HomeConfigGate state={homeConfig}>
        <AppShell onTokenSaved={reconnect} />
      </HomeConfigGate>
    </ServiceGatewayProvider>
  )
}
