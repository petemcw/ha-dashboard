import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ERR_INVALID_AUTH } from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeConnection } from '../test/fakeConnection'
import { stubHomeJson } from '../test/stubHomeJson'
import { entityStore } from '../infrastructure/entities/entityStore'
import { resetConnection } from '../infrastructure/ha/connection'
import { connectionStatus } from '../infrastructure/ha/connectionStatus'
import { KIOSK_MODE_KEY, LONG_LIVED_TOKEN_KEY, TOKENS_KEY } from '../infrastructure/storageKeys'
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

const replace = vi.fn()
const TOKEN_FIELD = /long-lived access token/i

beforeEach(() => {
  vi.stubEnv('VITE_HA_URL', 'https://ha.example')
  vi.stubGlobal('location', { pathname: '/', search: '?kiosk', replace })
  stubHomeJson()
  localStorage.clear()
  lib.createLongLivedTokenAuth.mockImplementation((_url: string, token: string) => ({ token }))
  // The token 'revoked' is rejected; anything else connects.
  lib.createConnection.mockImplementation(({ auth }: { auth: { token: string } }) =>
    auth.token === 'revoked'
      ? Promise.reject(ERR_INVALID_AUTH)
      : Promise.resolve({ ...createFakeConnection().conn, close: vi.fn() }),
  )
})

afterEach(() => {
  // Unmount before resetting the connection: a still-mounted screen can otherwise open a
  // new one from this test's storage, and the next test would inherit it.
  cleanup()
  resetConnection()
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function paste(token: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(TOKEN_FIELD), token)
  await user.click(screen.getByRole('button', { name: 'Connect' }))
}

describe('kiosk token form', () => {
  it('shows the token form for ?kiosk when no credentials are stored', async () => {
    render(<App />)
    expect(await screen.findByLabelText(TOKEN_FIELD)).toHaveAttribute('type', 'password')
  })

  it('does not redirect to the Home Assistant login when ?kiosk is set', async () => {
    render(<App />)
    await screen.findByLabelText(TOKEN_FIELD)
    expect(lib.getAuth).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('stores the pasted token and connects with it', async () => {
    render(<App />)
    await paste('pasted-token')
    await screen.findByRole('heading', { name: 'Home' })
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBe('pasted-token')
    expect(lib.createLongLivedTokenAuth).toHaveBeenCalledWith('https://ha.example', 'pasted-token')
  })

  it('removes the kiosk parameter from the URL after saving', async () => {
    const replaceState = vi.spyOn(history, 'replaceState')
    render(<App />)
    await paste('pasted-token')
    await screen.findByRole('heading', { name: 'Home' })
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('clears a rejected token and shows the form again with an error', async () => {
    render(<App />)
    await paste('revoked')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Home Assistant rejected that token.',
    )
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
    expect(screen.getByLabelText(TOKEN_FIELD)).toHaveValue('')
    expect(replace).not.toHaveBeenCalled()
  })

  it('connects with a second token after the first was rejected, without a reload', async () => {
    render(<App />)
    await paste('revoked')
    await screen.findByRole('alert')
    await paste('good-token')
    await screen.findByRole('heading', { name: 'Home' })
    expect(lib.createLongLivedTokenAuth).toHaveBeenLastCalledWith(
      'https://ha.example',
      'good-token',
    )
  })

  it('never includes the token in error text', async () => {
    const { container } = render(<App />)
    await paste('revoked')
    await screen.findByRole('alert')
    expect(container).not.toHaveTextContent('revoked')
    expect(screen.getByLabelText(TOKEN_FIELD)).not.toHaveValue('revoked')
  })
})

describe('kiosk device', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { pathname: '/', search: '', replace })
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'old-token')
    localStorage.setItem(TOKENS_KEY, '{}')
  })

  it('replaces the stored token from the settings sheet', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Home' })
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.type(screen.getByLabelText(/new long-lived access token/i), 'new-token')
    await user.click(screen.getByRole('button', { name: 'Save token' }))
    await waitFor(() =>
      expect(lib.createLongLivedTokenAuth).toHaveBeenLastCalledWith(
        'https://ha.example',
        'new-token',
      ),
    )
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBe('new-token')
    expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
  })

  it('returns a kiosk device to the token form, not the Home Assistant login, when its token is rejected later', async () => {
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'revoked')
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('rejected that token')
    expect(replace).not.toHaveBeenCalled()
    expect(lib.getAuth).not.toHaveBeenCalled()
    await act(async () => {})
  })

  it('hides the kiosk token section on devices that are not kiosks', async () => {
    localStorage.clear()
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'tok')
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Home' })
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.queryByRole('button', { name: 'Save token' })).not.toBeInTheDocument()
  })
})
