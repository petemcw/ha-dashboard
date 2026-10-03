import type { Connection } from 'home-assistant-js-websocket'

type Listener = () => void
type EntityEvent = { a?: Record<string, unknown>; r?: string[] }

// A fake Connection at the library boundary. The real subscribeEntities runs on
// top of it, so tests exercise the same collection and event-merge code as production.
export function createFakeConnection() {
  let onEvent: ((ev: EntityEvent) => void) | undefined
  const listeners = new Map<string, Set<Listener>>()
  const heartbeat = { pings: 0, reconnects: [] as boolean[], answerPings: true }

  const conn = {
    haVersion: '2026.9.4',
    connected: true,
    closeRequested: false,
    // Resolves like HA's pong, or never when the socket is silently dead.
    ping: () => {
      heartbeat.pings++
      return heartbeat.answerPings ? Promise.resolve() : new Promise<void>(() => {})
    },
    reconnect: (force?: boolean) => {
      heartbeat.reconnects.push(force === true)
    },
    close: () => {
      ;(conn as { closeRequested: boolean }).closeRequested = true
    },
    subscribeMessage: (cb: (ev: EntityEvent) => void) => {
      onEvent = cb
      return Promise.resolve(() => {})
    },
    addEventListener: (type: string, l: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(l)
    },
    removeEventListener: (type: string, l: Listener) => listeners.get(type)?.delete(l),
  } as unknown as Connection

  return {
    conn,
    heartbeat,
    // Emit entities the way HA's subscribe_entities does: a full snapshot first,
    // and again after a reconnect.
    emit(entities: { entity_id: string; state: string; attributes?: Record<string, unknown> }[]) {
      const a: Record<string, unknown> = {}
      for (const e of entities) {
        a[e.entity_id] = { s: e.state, a: e.attributes ?? {}, c: 'ctx', lc: 0 }
      }
      onEvent!({ a })
    },
    // Send only the changed state of one entity (a compressed `c` event).
    change(entity_id: string, state: string) {
      onEvent!({ c: { [entity_id]: { '+': { s: state } } } } as unknown as EntityEvent)
    },
    dispatch(type: string) {
      listeners.get(type)?.forEach((l) => l())
    },
  }
}
