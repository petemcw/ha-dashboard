import type { Connection } from 'home-assistant-js-websocket'

type Listener = () => void
type EntityEvent = { a?: Record<string, unknown>; r?: string[] }

// A fake Connection at the library boundary. The real subscribeEntities runs on
// top of it, so tests exercise the same collection and event-merge code as production.
export function createFakeConnection() {
  // Subscriptions are routed by message type, so a registry-event subscription never
  // steals the entity events.
  let onEvent: ((ev: EntityEvent) => void) | undefined
  const eventSubs = new Map<string, Set<(ev: unknown) => void>>()
  const eventSubscribeCalls: string[] = []
  const unsubscribed: string[] = []
  const eventSubscriptions = { reject: false }
  const listeners = new Map<string, Set<Listener>>()
  // Messages sent with sendMessagePromise, each left pending until the test answers it.
  const sent: {
    message: Record<string, unknown>
    resolve: (v?: unknown) => void
    reject: (e: unknown) => void
    settled: boolean
  }[] = []
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
    sendMessagePromise: (message: Record<string, unknown>) =>
      new Promise((resolve, reject) => {
        const entry = { message, settled: false } as (typeof sent)[number]
        entry.resolve = (v) => {
          entry.settled = true
          resolve(v)
        }
        entry.reject = (e) => {
          entry.settled = true
          reject(e)
        }
        sent.push(entry)
      }),
    subscribeMessage: (cb: (ev: EntityEvent) => void) => {
      onEvent = cb
      return Promise.resolve(() => {})
    },
    subscribeEvents: (cb: (ev: unknown) => void, eventType: string) => {
      eventSubscribeCalls.push(eventType)
      if (eventSubscriptions.reject) return Promise.reject(new Error('unknown subscription'))
      if (!eventSubs.has(eventType)) eventSubs.set(eventType, new Set())
      eventSubs.get(eventType)!.add(cb)
      return Promise.resolve(async () => {
        eventSubs.get(eventType)?.delete(cb)
        unsubscribed.push(eventType)
      })
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
    // Every message sent through sendMessagePromise, in order.
    sent: () => sent.map((s) => s.message),
    resolveSent: (index: number, result: unknown = null) => sent[index].resolve(result),
    rejectSent: (index: number, error: unknown) => sent[index].reject(error),
    // Answer every still-pending message of a type (a registry list, say).
    resolveType(type: string, result: unknown = null) {
      sent.filter((s) => !s.settled && s.message.type === type).forEach((s) => s.resolve(result))
    },
    rejectType(type: string, error: unknown = new Error('rejected')) {
      sent.filter((s) => !s.settled && s.message.type === type).forEach((s) => s.reject(error))
    },
    // How many times a message type has been sent.
    countSent: (type: string) => sent.filter((s) => s.message.type === type).length,
    eventSubscriptions,
    eventSubscribeCalls,
    unsubscribed,
    // Fire a HA event (e.g. area_registry_updated) at its subscribers.
    fireEvent(eventType: string, data: unknown = {}) {
      eventSubs.get(eventType)?.forEach((cb) => cb({ event_type: eventType, data }))
    },
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
