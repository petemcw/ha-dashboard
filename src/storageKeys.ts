// localStorage keys. Kept dependency-free so the Playwright tests can import them.

// OAuth tokens saved by home-assistant-js-websocket's getAuth.
export const TOKENS_KEY = 'ha-dashboard:tokens'

// A long-lived access token stored on the device, for kiosks and headless tests.
// When present it's used instead of the OAuth login.
export const LONG_LIVED_TOKEN_KEY = 'ha-dashboard:long-lived-token'
