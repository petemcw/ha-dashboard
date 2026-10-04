import {
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
} from 'home-assistant-js-websocket'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KIOSK_MODE_KEY, LONG_LIVED_TOKEN_KEY, TOKENS_KEY } from '../storageKeys'

const lib = vi.hoisted(() => ({
  createConnection: vi.fn(),
  createLongLivedTokenAuth: vi.fn(),
  getAuth: vi.fn(),
}))
vi.mock('home-assistant-js-websocket', async (orig) => ({
  ...(await orig<typeof import('home-assistant-js-websocket')>()),
  ...lib,
}))

// One connection per page load, so each test gets a fresh module.
async function freshConnection() {
  vi.resetModules()
  return import('./connection')
}

const replace = vi.fn()

beforeEach(() => {
  vi.stubEnv('VITE_HA_URL', 'https://ha.example')
  vi.stubGlobal('location', { pathname: '/', search: '', replace })
  localStorage.clear()
  lib.createConnection.mockResolvedValue({ fake: 'connection' })
  lib.createLongLivedTokenAuth.mockReturnValue({ fake: 'token auth' })
  lib.getAuth.mockResolvedValue({ fake: 'oauth' })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('connection', () => {
  it('connects with a stored long-lived token instead of the Home Assistant login', async () => {
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'abc')
    const { getConnection } = await freshConnection()
    await getConnection()
    expect(lib.createLongLivedTokenAuth).toHaveBeenCalledWith('https://ha.example', 'abc')
    expect(lib.getAuth).not.toHaveBeenCalled()
    expect(lib.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { fake: 'token auth' } }),
    )
  })

  it('logs in through Home Assistant when no token is stored, and shares one connection', async () => {
    const { getConnection } = await freshConnection()
    const [a, b] = await Promise.all([getConnection(), getConnection()])
    expect(a).toBe(b)
    expect(lib.getAuth).toHaveBeenCalledTimes(1)
    expect(lib.getAuth.mock.calls[0][0].hassUrl).toBe('https://ha.example')
  })

  it('saves and reloads OAuth tokens through localStorage', async () => {
    const { getConnection } = await freshConnection()
    await getConnection()
    const { saveTokens, loadTokens } = lib.getAuth.mock.calls[0][0]
    saveTokens({ access_token: 'x' })
    expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toEqual({ access_token: 'x' })
    await expect(loadTokens()).resolves.toEqual({ access_token: 'x' })
    saveTokens(null)
    await expect(loadTokens()).resolves.toBeNull()
  })

  it('drops the OAuth callback params from the URL after login', async () => {
    const replaceState = vi.spyOn(history, 'replaceState')
    vi.stubGlobal('location', { pathname: '/', search: '?auth_callback=1&code=z', replace })
    const { getConnection } = await freshConnection()
    await getConnection()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('clears stored credentials when Home Assistant rejects them', async () => {
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'bad')
    localStorage.setItem(TOKENS_KEY, '{}')
    lib.createConnection.mockRejectedValue(ERR_INVALID_AUTH)
    const { getConnection } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_INVALID_AUTH)
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
    expect(replace).toHaveBeenCalledWith('/')
  })

  it('keeps stored credentials when Home Assistant is merely unreachable', async () => {
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'ok')
    lib.createConnection.mockRejectedValue(ERR_CANNOT_CONNECT)
    const { getConnection } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_CANNOT_CONNECT)
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBe('ok')
  })

  it('treats blocked storage as nothing stored', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { getConnection } = await freshConnection()
    await getConnection()
    const { loadTokens } = lib.getAuth.mock.calls[0][0]
    await expect(loadTokens()).resolves.toBeNull()
    vi.restoreAllMocks()
  })

  it('describes the library error codes in words', async () => {
    const { describeError } = await freshConnection()
    expect(describeError(ERR_CANNOT_CONNECT)).toBe('Can’t reach Home Assistant.')
    expect(describeError(ERR_INVALID_AUTH)).toMatch(/Login expired/)
    expect(describeError(ERR_INVALID_HTTPS_TO_HTTP)).toMatch(/HTTPS/)
    expect(describeError(new Error('boom'))).toBe('boom')
    expect(describeError('odd')).toBe('odd')
  })
})

describe('kiosk connection', () => {
  const asKiosk = () => vi.stubGlobal('location', { pathname: '/', search: '?kiosk', replace })

  it('asks for a token instead of starting the Home Assistant login for ?kiosk', async () => {
    asKiosk()
    const { getConnection, ERR_KIOSK_TOKEN_REQUIRED } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_KIOSK_TOKEN_REQUIRED)
    expect(lib.getAuth).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('stores the pasted token, marks the device as a kiosk and connects with it', async () => {
    asKiosk()
    const replaceState = vi.spyOn(history, 'replaceState')
    const { getConnection, saveKioskToken, resetConnection } = await freshConnection()
    await expect(getConnection()).rejects.toBeDefined()
    saveKioskToken('pasted')
    resetConnection()
    await getConnection()
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBe('pasted')
    expect(localStorage.getItem(KIOSK_MODE_KEY)).toBe('1')
    expect(lib.createLongLivedTokenAuth).toHaveBeenCalledWith('https://ha.example', 'pasted')
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })

  it('removes only the token when a kiosk token is rejected, without the login redirect', async () => {
    asKiosk()
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'bad')
    lib.createConnection.mockRejectedValue(ERR_INVALID_AUTH)
    const { getConnection } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_INVALID_AUTH)
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it('opens a new connection with a second token after resetConnection', async () => {
    asKiosk()
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'bad')
    lib.createConnection.mockRejectedValueOnce(ERR_INVALID_AUTH)
    const { getConnection, saveKioskToken, resetConnection } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_INVALID_AUTH)
    saveKioskToken('good')
    resetConnection()
    await getConnection()
    expect(lib.createLongLivedTokenAuth).toHaveBeenLastCalledWith('https://ha.example', 'good')
  })

  it('treats a device with the kiosk flag as a kiosk without the parameter', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    const { getConnection, ERR_KIOSK_TOKEN_REQUIRED } = await freshConnection()
    await expect(getConnection()).rejects.toBe(ERR_KIOSK_TOKEN_REQUIRED)
  })

  it('keeps the kiosk intent for the page load after the parameter is removed', async () => {
    asKiosk()
    const { getConnection, saveKioskToken, resetConnection, isKioskDevice } =
      await freshConnection()
    await expect(getConnection()).rejects.toBeDefined()
    saveKioskToken('t')
    localStorage.clear()
    vi.stubGlobal('location', { pathname: '/', search: '', replace })
    resetConnection()
    expect(isKioskDevice()).toBe(true)
  })

  it('replaces the token and clears OAuth tokens when the kiosk token is changed', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'old')
    localStorage.setItem(TOKENS_KEY, '{}')
    const { saveKioskToken } = await freshConnection()
    saveKioskToken('new')
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBe('new')
    expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
  })

  it('does not treat OAuth-logged-in devices with ?kiosk as needing a token', async () => {
    asKiosk()
    localStorage.setItem(TOKENS_KEY, '{}')
    const { getConnection } = await freshConnection()
    await getConnection()
    expect(lib.getAuth).toHaveBeenCalled()
  })

  it('clears the token and the kiosk flag on sign out', async () => {
    localStorage.setItem(KIOSK_MODE_KEY, '1')
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 't')
    const { resetAuth } = await freshConnection()
    resetAuth()
    expect(localStorage.getItem(KIOSK_MODE_KEY)).toBeNull()
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
  })

  describe('demo mode', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { pathname: '/', search: '?demo', replace })
    })

    it('never runs the real connect in demo mode, even before the demo connection is installed', async () => {
      const { getConnection } = await freshConnection()
      await expect(getConnection()).rejects.toThrow(/demo/i)
      expect(lib.getAuth).not.toHaveBeenCalled()
      expect(lib.createLongLivedTokenAuth).not.toHaveBeenCalled()
      expect(lib.createConnection).not.toHaveBeenCalled()
    })

    it('uses the installed demo connection, shares it, and keeps it through resetConnection', async () => {
      const { getConnection, installDemoConnection, resetConnection } = await freshConnection()
      const demoConnect = vi.fn(async () => ({ close: vi.fn() }) as never)
      installDemoConnection(demoConnect)
      expect(await getConnection()).toBe(await getConnection())
      expect(demoConnect).toHaveBeenCalledTimes(1)
      resetConnection()
      await getConnection()
      expect(demoConnect).toHaveBeenCalledTimes(2)
      expect(lib.createConnection).not.toHaveBeenCalled()
    })
  })
})
