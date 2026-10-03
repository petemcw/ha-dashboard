import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeConnection } from '../test/fakeConnection'
import { stubHomeJson } from '../test/stubHomeJson'
import { entityStore } from '../infrastructure/entities/entityStore'
import { resetConnection } from '../infrastructure/ha/connection'
import { connectionStatus } from '../infrastructure/ha/connectionStatus'
import { LONG_LIVED_TOKEN_KEY } from '../infrastructure/storageKeys'
import App from './App'

const lib = vi.hoisted(() => ({
  createConnection: vi.fn(),
  createLongLivedTokenAuth: vi.fn(),
  getAuth: vi.fn(),
}))
vi.mock('home-assistant-js-websocket', async (orig) => ({
  ...(await orig<typeof import('home-assistant-js-websocket')>()),
  ...lib,
}))

beforeEach(() => {
  vi.stubEnv('VITE_HA_URL', 'https://ha.example')
  vi.stubGlobal('location', { pathname: '/', search: '', replace: vi.fn() })
  localStorage.clear()
  localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'tok')
  lib.createLongLivedTokenAuth.mockImplementation((_url: string, token: string) => ({ token }))
  lib.createConnection.mockImplementation(() =>
    Promise.resolve({ ...createFakeConnection().conn, close: vi.fn() }),
  )
})

afterEach(() => {
  resetConnection()
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('home.json at startup', () => {
  it('shows the connecting placeholder until home.json has loaded', async () => {
    stubHomeJson()
    render(<App />)
    expect(screen.getByText('Connecting…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains how to create home.json when the server has none', async () => {
    stubHomeJson({}, 404)
    render(<App />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('home.example.json')
    expect(alert).toHaveTextContent('HTTP 404')
    expect(screen.queryByRole('heading', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('names the invalid field when home.json has the wrong shape', async () => {
    stubHomeJson({
      ...JSON.parse(JSON.stringify((await import('../config/testHomeConfig')).testHomeConfig)),
      crypto: 3,
    })
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('crypto must be an array')
  })

  it('still asks a kiosk for its token when home.json is missing', async () => {
    localStorage.clear()
    vi.stubGlobal('location', { pathname: '/', search: '?kiosk', replace: vi.fn() })
    stubHomeJson({}, 404)
    render(<App />)
    expect(await screen.findByLabelText(/long-lived access token/i)).toBeInTheDocument()
  })
})
