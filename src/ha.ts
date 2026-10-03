import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
  getAuth,
  type Auth,
  type AuthData,
  type Connection,
} from 'home-assistant-js-websocket'
import { loadConfig } from './config'
import { LONG_LIVED_TOKEN_KEY, TOKENS_KEY } from './storageKeys'

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

async function connect(): Promise<Connection> {
  const { haUrl } = await loadConfig()
  try {
    const token = loadLongLivedToken()
    const auth = token ? createLongLivedTokenAuth(haUrl, token) : await oauth(haUrl)
    return await createConnection({ auth })
  } catch (err) {
    if (err === ERR_INVALID_AUTH) resetAuth()
    throw err
  }
}

// Forget the stored credentials and reload without query params, so getAuth
// sends the browser back to HA's login page.
export function resetAuth() {
  saveTokens(null)
  try {
    localStorage.removeItem(LONG_LIVED_TOKEN_KEY)
  } catch {
    // Storage blocked: nothing was stored.
  }
  location.replace(location.pathname)
}

// One connection per page load. Creating it inside a React effect would run twice
// under StrictMode and exchange the same auth code twice.
let pending: Promise<Connection> | undefined
export function getConnection(): Promise<Connection> {
  pending ??= connect()
  return pending
}

// The library throws bare numbers, not Errors.
export function describeError(err: unknown): string {
  switch (err) {
    case ERR_CANNOT_CONNECT:
      return "Can't reach Home Assistant."
    case ERR_INVALID_AUTH:
      return 'Login expired. Redirecting to Home Assistant…'
    case ERR_INVALID_HTTPS_TO_HTTP:
      return 'This page is HTTPS but the Home Assistant URL is HTTP.'
  }
  return err instanceof Error ? err.message : String(err)
}
