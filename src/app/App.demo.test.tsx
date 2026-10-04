import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entityStore } from '../infrastructure/entities/entityStore'
import { resetConnection } from '../infrastructure/ha/connection'
import { connectionStatus } from '../infrastructure/ha/connectionStatus'
import { KIOSK_MODE_KEY, LONG_LIVED_TOKEN_KEY, TOKENS_KEY } from '../infrastructure/storageKeys'

const lib = vi.hoisted(() => ({
  createLongLivedTokenAuth: vi.fn(),
  getAuth: vi.fn(),
}))
vi.mock('home-assistant-js-websocket', async (orig) => ({
  ...(await orig<typeof import('home-assistant-js-websocket')>()),
  ...lib,
}))

const fetchMock = vi.fn()

// One page load per test: ?demo is decided once per module instance.
async function loadDemoApp(search = '?demo') {
  vi.resetModules()
  vi.stubGlobal('location', {
    pathname: '/',
    search,
    origin: 'https://dash.example',
    replace: vi.fn(),
  })
  const connection = await import('../infrastructure/ha/connection')
  const { installDemo } = await import('./demo/installDemo')
  if (search.includes('demo')) installDemo()
  const { default: App } = await import('./App')
  return { App, connection }
}

beforeEach(() => {
  vi.stubEnv('VITE_HA_URL', '')
  fetchMock.mockRejectedValue(new Error('no network in demo mode'))
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  resetConnection()
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('demo mode', () => {
  it('shows people in demo mode without fetching config.json', async () => {
    const { App } = await loadDemoApp()
    render(<App />)
    expect(await screen.findByRole('region', { name: 'People' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('connects to the fake HA without fetching config.json or reading stored tokens in demo mode', async () => {
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'stored')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const { App } = await loadDemoApp()
    render(<App />)
    await screen.findByRole('region', { name: 'People' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(lib.getAuth).not.toHaveBeenCalled()
    expect(lib.createLongLivedTokenAuth).not.toHaveBeenCalled()
    const keys = getItem.mock.calls.map(([k]) => k)
    expect(keys).not.toContain(LONG_LIVED_TOKEN_KEY)
    expect(keys).not.toContain(TOKENS_KEY)
  })

  it('uses the placeholder home config instead of loading home.json in demo mode', async () => {
    const { App } = await loadDemoApp()
    render(<App />)
    // testHomeConfig's favorites section renders from the placeholder config.
    expect(await screen.findByRole('region', { name: 'Favorites' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalledWith('/home.json', expect.anything())
    expect(screen.queryByText(/needs a home.json/)).not.toBeInTheDocument()
  })

  it('shows a Demo badge in demo mode', async () => {
    const { App } = await loadDemoApp()
    render(<App />)
    expect(await screen.findByText('Demo')).toBeVisible()
  })

  it('hides sign out and kiosk token settings in demo mode', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    const { App } = await loadDemoApp()
    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Kiosk token' })).not.toBeInTheDocument()
  })

  it('ignores ?kiosk when ?demo is present', async () => {
    const { App } = await loadDemoApp('?demo&kiosk')
    render(<App />)
    expect(await screen.findByRole('region', { name: 'People' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/long-lived access token/i)).not.toBeInTheDocument()
    expect(localStorage.getItem(KIOSK_MODE_KEY)).toBeNull()
  })

  it('leaves demo mode on the next load without ?demo', async () => {
    await loadDemoApp()
    const { App } = await loadDemoApp('')
    render(<App />)
    expect(screen.queryByText('Demo')).not.toBeInTheDocument()
    // The real app asks for config.json to find HA.
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/config.json', expect.anything()),
    )
  })
})
