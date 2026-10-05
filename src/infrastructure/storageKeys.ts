// localStorage keys. Kept dependency-free so the Playwright tests can import them.

// OAuth tokens saved by home-assistant-js-websocket's getAuth.
export const TOKENS_KEY = 'ha-dashboard:tokens'

// A long-lived access token stored on the device, for kiosks and headless tests.
// When present it's used instead of the OAuth login.
export const LONG_LIVED_TOKEN_KEY = 'ha-dashboard:long-lived-token'

// Set when a token is saved through the kiosk form. While set, a missing or rejected
// token returns to the token form instead of HA's OAuth login.
export const KIOSK_MODE_KEY = 'ha-dashboard:kiosk-mode'

// Per-device theme override: 'light' or 'dark'. Absent means follow the system.
export const THEME_KEY = 'ha-dashboard:theme'

// Per-device room pick: 'auto' or an area id. Absent means Auto.
export const ROOM_SELECTION_KEY = 'ha-dashboard:room'
