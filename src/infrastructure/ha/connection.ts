import {
  createConnection,
  createLongLivedTokenAuth,
  createSocket,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
  getAuth,
  type Auth,
  type AuthData,
  type Connection,
} from 'home-assistant-js-websocket'
import { connectionStatus } from './connectionStatus'
import { loadConfig } from './runtimeConfig'
import { KIOSK_MODE_KEY, LONG_LIVED_TOKEN_KEY, TOKENS_KEY } from '../storageKeys'

function saveTokens(data: AuthData | null) {
  try {
    if (data) localStorage.setItem(TOKENS_KEY, JSON.stringify(data))
    else localStorage.removeItem(TOKENS_KEY)
  } catch {
    // Storage blocked (private mode): the user just logs in again next load.
  }
}

async function loadTokens(): Promise<AuthData | null> {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? (JSON.parse(raw) as AuthData) : null
  } catch {
    return null
  }
}

function loadLongLivedToken(): string | null {
  try {
    return localStorage.getItem(LONG_LIVED_TOKEN_KEY)
  } catch {
    return null
  }
}

async function oauth(hassUrl: string): Promise<Auth> {
  const auth = await getAuth({ hassUrl, saveTokens, loadTokens })
  // getAuth leaves auth_callback/code/state in the URL. A reload would replay
  // the single-use code and fail, so drop them once the tokens are saved.
  if (new URLSearchParams(location.search).has('auth_callback')) {
    history.replaceState(null, '', location.pathname)
  }
  return auth
}

function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the kiosk has to be set up again after a reload.
  }
}

function removeItem(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing was stored.
  }
}

// Thrown by getConnection when a kiosk has no credentials, so the UI shows the token form.
export const ERR_KIOSK_TOKEN_REQUIRED = 'kiosk_token_required'

// The ?kiosk intent is remembered for the page load: saving a token removes the
// parameter from the URL, but a rejected token must still return to the form.
let kioskThisLoad = false
export function isKioskDevice(): boolean {
  if (new URLSearchParams(location.search).has('kiosk')) kioskThisLoad = true
  return kioskThisLoad || isKioskMode()
}

// The per-device flag a saved kiosk token leaves behind.
export function isKioskMode(): boolean {
  try {
    return localStorage.getItem(KIOSK_MODE_KEY) !== null
  } catch {
    return false
  }
}

const RETRY_DELAY_MS = 1000

// The library's own setupRetry hides failed attempts from us, so the UI couldn't say it
// is retrying. Retry here instead: only an unreachable HA loops, anything else (such as
// invalid auth) rejects at once.
async function createSocketWithRetry(options: Parameters<typeof createSocket>[0]) {
  for (;;) {
    try {
      return await createSocket({ ...options, setupRetry: 0 })
    } catch (err) {
      if (err !== ERR_CANNOT_CONNECT) throw err
      connectionStatus.set({ kind: 'connecting', retrying: true })
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
}

async function connect(): Promise<Connection> {
  const { haUrl } = await loadConfig()
  const kiosk = isKioskDevice()
  try {
    const token = loadLongLivedToken()
    if (kiosk && !token && !(await loadTokens())) throw ERR_KIOSK_TOKEN_REQUIRED
    const auth = token ? createLongLivedTokenAuth(haUrl, token) : await oauth(haUrl)
    // By default an unreachable HA at startup rejects once and the app sits on an error forever.
    return await createConnection({ auth, createSocket: createSocketWithRetry })
  } catch (err) {
    if (err === ERR_INVALID_AUTH) {
      // resetAuth reloads without ?kiosk, which would send a kiosk to the OAuth login.
      if (kiosk) forgetCredentials()
      else resetAuth()
    }
    throw err
  }
}

export function forgetCredentials() {
  saveTokens(null)
  removeItem(LONG_LIVED_TOKEN_KEY)
}

// Stores a kiosk token (first setup or replacement) and makes the device a kiosk.
// The caller opens a new connection with resetConnection.
export function saveKioskToken(token: string) {
  saveTokens(null)
  setItem(LONG_LIVED_TOKEN_KEY, token)
  setItem(KIOSK_MODE_KEY, '1')
  kioskThisLoad = true
  if (new URLSearchParams(location.search).has('kiosk')) {
    history.replaceState(null, '', location.pathname)
  }
}

// Forget the stored credentials and reload without query params, so getAuth
// sends the browser back to HA's login page.
export function resetAuth() {
  forgetCredentials()
  removeItem(KIOSK_MODE_KEY)
  location.replace(location.pathname)
}

let pending: Promise<Connection> | undefined

// Drop the failed or outdated connection so the next getConnection starts over.
export function resetConnection() {
  const old = pending
  pending = undefined
  old?.then(
    (conn) => conn.close(),
    () => {},
  )
}

// One connection per page load. Creating it inside a React effect would run twice
// under StrictMode and exchange the same auth code twice.
export function getConnection(): Promise<Connection> {
  pending ??= connect()
  return pending
}

// The library throws bare numbers, not Errors.
export function describeError(err: unknown): string {
  switch (err) {
    case ERR_CANNOT_CONNECT:
      return 'Can’t reach Home Assistant.'
    case ERR_INVALID_AUTH:
      return 'Login expired. Redirecting to Home Assistant…'
    case ERR_INVALID_HTTPS_TO_HTTP:
      return 'This page is HTTPS but the Home Assistant URL is HTTP.'
  }
  return err instanceof Error ? err.message : String(err)
}
