import type { HassEntity } from 'home-assistant-js-websocket'

// A fake Home Assistant speaking the WebSocket message protocol, shared by the Playwright
// mock (e2e/haMock.ts) and demo mode. It is imported by e2e/ through tsconfig.node.json,
// so it uses explicit .ts extensions, `import type` for library types, and no browser or
// Playwright globals. Auth and serving config files stay in the adapters: demo mode has
// no auth step, and this core must not import src/config/.

export type FakeUser = { id: string; name: string; is_admin: boolean; is_owner: boolean }
export type StatisticPoint = { start: number; end: number; mean: number }
export type ClientMessage = { id?: number; type: string; [key: string]: unknown }
export type Send = (message: unknown) => void

export type FakeHaOptions = {
  user?: Partial<FakeUser>
  entities?: HassEntity[]
  statistics?: Record<string, StatisticPoint[]>
  // `domain.service` names that answer with an error, e.g. 'switch.turn_off'.
  failServices?: string[]
  // Per-user app data keyed like `frontend/get_user_data`.
  userData?: Record<string, unknown>
  // Wait this long before a `call_service` changes state and answers, so a pending UI is
  // visible. Unset (the Playwright mock) answers at once.
  responseDelayMs?: number
  // Extra state changes a service call causes, which the generic switch/scene handling
  // doesn't know: return the entities to set. `house` reads the current state.
  onServiceCall?: (call: ServiceCall, house: FakeHouse) => HassEntity[] | void
}

export type ServiceCall = { domain: string; service: string; entityIds: string[] }
export type FakeHouse = { getState(entityId: string): HassEntity | undefined }

export const FAKE_HA_VERSION = '2026.9.4'

const DEFAULT_USER: FakeUser = { id: 'user-1', name: 'Test User', is_admin: true, is_owner: true }

// `subs` holds subscription ids per channel: the subscribe command, plus the key for app
// data, since HA's `{value}` events don't say which key they belong to.
export type FakeHaClient = { send: Send; subs: Map<string, number[]>; stalled: boolean }

const dataChannel = (type: string, key: string) => `${type} ${key}`
const toEpoch = (iso: string) => Date.parse(iso) / 1000

function compress(e: HassEntity) {
  return {
    s: e.state,
    a: e.attributes,
    c: e.context.id,
    lc: toEpoch(e.last_changed),
    lu: toEpoch(e.last_updated),
  }
}

const SWITCHABLE = new Set(['light', 'switch', 'fan'])

// What each on/off service leaves the entity's state as.
const NEXT_ON_OFF_STATE = new Map<string, (state: string) => string>([
  ['turn_on', () => 'on'],
  ['turn_off', () => 'off'],
  ['toggle', (state) => (state === 'on' ? 'off' : 'on')],
])

export class FakeHa {
  user: FakeUser
  readonly userData = new Map<string, unknown>()
  readonly systemData = new Map<string, unknown>()
  statistics: Record<string, StatisticPoint[]>
  private entities = new Map<string, HassEntity>()
  private messages: ClientMessage[] = []
  private clients = new Set<FakeHaClient>()
  private failServices: string[]
  private responseDelayMs: number
  private onServiceCall: FakeHaOptions['onServiceCall']

  constructor(options: FakeHaOptions = {}) {
    this.user = { ...DEFAULT_USER, ...options.user }
    this.statistics = options.statistics ?? {}
    this.failServices = options.failServices ?? []
    this.responseDelayMs = options.responseDelayMs ?? 0
    this.onServiceCall = options.onServiceCall
    for (const [k, v] of Object.entries(options.userData ?? {})) this.userData.set(k, v)
    for (const e of options.entities ?? []) this.entities.set(e.entity_id, e)
  }

  // Every client message received, in order, including those a stalled client never gets
  // answered.
  sent(): ClientMessage[] {
    return [...this.messages]
  }

  getState(entityId: string): HassEntity | undefined {
    return this.entities.get(entityId)
  }

  connect(send: Send): FakeHaClient {
    const client: FakeHaClient = {
      send: (m) => {
        if (!client.stalled) send(m)
      },
      subs: new Map(),
      stalled: false,
    }
    this.clients.add(client)
    return client
  }

  disconnect(client: FakeHaClient) {
    client.subs.clear()
    this.clients.delete(client)
  }

  // Half-open: the clients connected now never hear anything again, but keep their
  // subscriptions. A client connected later works normally.
  stall() {
    for (const c of this.clients) c.stalled = true
  }

  setState(entity: HassEntity) {
    this.entities.set(entity.entity_id, entity)
    this.broadcastEntities({ c: { [entity.entity_id]: { '+': compress(entity) } } })
  }

  removeEntity(id: string) {
    this.entities.delete(id)
    this.broadcastEntities({ r: [id] })
  }

  receive(client: FakeHaClient, msg: ClientMessage) {
    this.messages.push(msg)
    if (client.stalled) return
    this.handle(client, msg)
  }

  private broadcastEntities(event: unknown) {
    for (const c of this.clients) {
      for (const id of c.subs.get('subscribe_entities') ?? []) {
        c.send({ id, type: 'event', event })
      }
    }
  }

  private notify(channel: string, value: unknown) {
    for (const c of this.clients) {
      for (const id of c.subs.get(channel) ?? []) c.send({ id, type: 'event', event: { value } })
    }
  }

  private handle(client: FakeHaClient, msg: ClientMessage) {
    const send = client.send
    const id = msg.id!
    const ok = (result: unknown = null) => send({ id, type: 'result', success: true, result })
    const fail = (code: string, message = code) =>
      send({ id, type: 'result', success: false, error: { code, message } })
    const subscribe = (channel: string, initial?: unknown) => {
      client.subs.set(channel, [...(client.subs.get(channel) ?? []), id])
      ok()
      if (initial !== undefined) send({ id, type: 'event', event: initial })
    }
    const key = msg.key as string

    switch (msg.type) {
      case 'supported_features':
        return ok()
      case 'ping':
        return send({ id, type: 'pong' })
      case 'auth/current_user':
        return ok(this.user)
      case 'subscribe_entities':
        return subscribe(msg.type, {
          a: Object.fromEntries([...this.entities].map(([k, e]) => [k, compress(e)])),
        })
      case 'call_service':
        return this.callService(msg, ok, fail)
      case 'frontend/get_user_data':
        return ok({ value: this.userData.get(key) ?? null })
      case 'frontend/subscribe_user_data':
        return subscribe(dataChannel(msg.type, key), { value: this.userData.get(key) ?? null })
      case 'frontend/set_user_data':
        this.userData.set(key, msg.value)
        ok()
        return this.notify(dataChannel('frontend/subscribe_user_data', key), this.userData.get(key))
      case 'frontend/get_system_data':
        return ok({ value: this.systemData.get(key) ?? null })
      case 'frontend/subscribe_system_data':
        return subscribe(dataChannel(msg.type, key), {
          value: this.systemData.get(key) ?? null,
        })
      case 'frontend/set_system_data':
        if (!this.user.is_admin) return fail('unauthorized', 'Unauthorized')
        this.systemData.set(key, msg.value)
        ok()
        return this.notify(
          dataChannel('frontend/subscribe_system_data', key),
          this.systemData.get(key),
        )
      case 'recorder/statistics_during_period':
        return ok(this.statisticsFor(msg.statistic_ids as string[] | undefined))
      case 'unsubscribe_events':
        // The library unsubscribes every subscription this way, whatever command opened it.
        for (const [type, ids] of client.subs) {
          client.subs.set(
            type,
            ids.filter((sub) => sub !== msg.subscription),
          )
        }
        return ok()
      default:
        return fail('unknown_command', `Unknown command: ${msg.type}`)
    }
  }

  // Enough for the dashboard's controls, not a full HA.
  private callService(
    msg: ClientMessage,
    ok: (result?: unknown) => void,
    fail: (code: string, message?: string) => void,
  ) {
    const domain = String(msg.domain)
    const service = String(msg.service)
    if (this.failServices.includes(`${domain}.${service}`)) {
      return fail('unknown_error', `${domain}.${service} failed`)
    }
    const ids = targetIds(msg)
    const missing = ids.find((i) => !this.entities.has(i))
    if (missing) return fail('not_found', `Entity not found: ${missing}`)

    // The library always sends `target`, and leaves out `service_data` when it's undefined.
    // HA sends the state change before the call's result; a delay holds back both.
    const respond = () => {
      this.applyServiceCall({ domain, service, entityIds: ids })
      ok({ context: { id: 'ctx', parent_id: null, user_id: null } })
    }
    if (this.responseDelayMs > 0) setTimeout(respond, this.responseDelayMs)
    else respond()
  }

  private applyServiceCall(call: ServiceCall) {
    const changed: Record<string, { '+': ReturnType<typeof compress> }> = {}
    const set = (next: HassEntity) => {
      this.entities.set(next.entity_id, next)
      changed[next.entity_id] = { '+': compress(next) }
    }
    for (const entityId of call.entityIds) {
      const entity = this.entities.get(entityId)!
      const next = this.applyService(entity, call.domain, call.service)
      if (next !== entity) set(next)
    }
    for (const extra of this.onServiceCall?.(call, this) ?? []) set(extra)
    if (Object.keys(changed).length > 0) this.broadcastEntities({ c: changed })
  }

  private applyService(entity: HassEntity, domain: string, service: string): HassEntity {
    const now = new Date().toISOString()
    if (domain === 'scene' && service === 'turn_on') {
      // A scene's state is the time it was last activated.
      return { ...entity, state: now, last_changed: now, last_updated: now }
    }
    if (!SWITCHABLE.has(domain) || entity.entity_id.split('.')[0] !== domain) return entity
    const next = NEXT_ON_OFF_STATE.get(service)
    if (!next) return entity
    const state = next(entity.state)
    return {
      ...entity,
      state,
      last_updated: now,
      last_changed: state === entity.state ? entity.last_changed : now,
    }
  }

  private statisticsFor(ids: string[] = Object.keys(this.statistics)) {
    return Object.fromEntries(
      ids.filter((i) => i in this.statistics).map((i) => [i, this.statistics[i]]),
    )
  }
}

function targetIds(msg: ClientMessage): string[] {
  const target = msg.target as { entity_id?: string | string[] } | undefined
  const data = msg.service_data as { entity_id?: string | string[] } | undefined
  const raw = target?.entity_id ?? data?.entity_id ?? []
  return Array.isArray(raw) ? raw : [raw]
}
