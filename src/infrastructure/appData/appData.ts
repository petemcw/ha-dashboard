import type { Connection } from 'home-assistant-js-websocket'
import { getConnection } from '../ha/connection'

// HA's frontend storage comes in two scopes with the same protocol:
// - user: kept per logged-in user, so the value follows the user to any device.
// - system: shared by every user and device. Only admins may write it; others get an
//   `unauthorized` rejection.
export type AppDataScope = 'user' | 'system'

// Spelled out rather than built from the scope, so a search for a message type finds it.
const MESSAGES = {
  user: { subscribe: 'frontend/subscribe_user_data', set: 'frontend/set_user_data' },
  system: { subscribe: 'frontend/subscribe_system_data', set: 'frontend/set_system_data' },
} as const

// subscribe sends `{value}` immediately and again after every set (also from other
// devices); the library re-subscribes after a reconnect. value is null when unset.
export function subscribeAppData(
  conn: Connection,
  scope: AppDataScope,
  key: string,
  onValue: (value: unknown) => void,
): Promise<() => Promise<void>> {
  return conn.subscribeMessage<{ value: unknown }>((ev) => onValue(ev.value), {
    type: MESSAGES[scope].subscribe,
    key,
  })
}

export async function setAppData(
  scope: AppDataScope,
  key: string,
  value: unknown,
  connect: () => Promise<Connection> = getConnection,
) {
  const conn = await connect()
  await conn.sendMessagePromise({ type: MESSAGES[scope].set, key, value })
}
