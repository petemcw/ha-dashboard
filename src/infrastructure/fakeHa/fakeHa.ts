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
  // Forecast entries per weather entity, served over `weather/subscribe_forecast`.
  forecasts?: Record<string, Forecasts>
  // Wait this long before a `call_service` changes state and answers, so a pending UI is
  // visible. Unset (the Playwright mock) answers at once.
  responseDelayMs?: number
  // Extra state changes a service call causes, which the generic switch/scene handling
  // doesn't know: return the entities to set. `house` reads the current state.
  onServiceCall?: (call: ServiceCall, house: FakeHouse) => HassEntity[] | void
  // Registries in HA's wire shapes; absent ones answer empty lists.
  areas?: unknown[]
  floors?: unknown[]
  devices?: unknown[]
  entityRegistry?: EntityRegistryDisplay
}

// `config/entity_registry/list_for_display`: abbreviated keys (`ei` entity_id, `ai` area_id,
// `di` device_id, ...), with entity categories as indexes into `entity_categories`.
export type EntityRegistryDisplay = {
  entity_categories: Record<number, string>
  entities: Record<string, unknown>[]
}
export type RegistryName = 'areas' | 'floors' | 'devices' | 'entityRegistry'

const EMPTY_ENTITY_REGISTRY: EntityRegistryDisplay = {
  entity_categories: { 0: 'config', 1: 'diagnostic' },
  entities: [],
}

const REGISTRY_LIST_MESSAGES: Record<string, RegistryName> = {
  'config/area_registry/list': 'areas',
  'config/floor_registry/list': 'floors',
  'config/device_registry/list': 'devices',
  'config/entity_registry/list_for_display': 'entityRegistry',
}

const REGISTRY_UPDATED_EVENTS: Record<RegistryName, string> = {
  areas: 'area_registry_updated',
  floors: 'floor_registry_updated',
  devices: 'device_registry_updated',
  entityRegistry: 'entity_registry_updated',
}

export type Forecasts = { hourly?: unknown[]; daily?: unknown[] }
export type ServiceCall = {
  domain: string
  service: string
  entityIds: string[]
  // `service_data` without `entity_id`, which is the target.
  serviceData: Record<string, unknown>
}
export type FakeHouse = { getState(entityId: string): HassEntity | undefined }

export const FAKE_HA_VERSION = '2026.9.4'

const DEFAULT_USER: FakeUser = { id: 'user-1', name: 'Test User', is_admin: true, is_owner: true }

// `subs` holds subscription ids per channel: the subscribe command, plus the key for app
// data, since HA's `{value}` events don't say which key they belong to.
export type FakeHaClient = { send: Send; subs: Map<string, number[]>; stalled: boolean }

const dataChannel = (type: string, key: string) => `${type} ${key}`
const forecastChannel = (entityId: string, type: string) =>
  `weather/subscribe_forecast ${entityId} ${type}`
const eventChannel = (eventType: string) => `subscribe_events ${eventType}`
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

// What each on/off service leaves the entity's state as.
const NEXT_ON_OFF_STATE = new Map<string, (state: string) => string>([
  ['turn_on', () => 'on'],
  ['turn_off', () => 'off'],
  ['toggle', (state) => (state === 'on' ? 'off' : 'on')],
])

type ServiceHandler = (entity: HassEntity, call: ServiceCall) => HassEntity

const onOff: ServiceHandler = (entity, call) => {
  const next = NEXT_ON_OFF_STATE.get(call.service)
  if (!next || entity.entity_id.split('.')[0] !== call.domain) return entity
  const now = new Date().toISOString()
  const state = next(entity.state)
  return {
    ...entity,
    state,
    last_updated: now,
    last_changed: state === entity.state ? entity.last_changed : now,
  }
}

// brightness_pct is 1-100; the entity reports brightness as 0-255. Setting a color
// temperature or color also switches the color mode, as HA does.
const light: ServiceHandler = (entity, call) => {
  const next = onOff(entity, call)
  if (call.service !== 'turn_on') return next
  const { brightness_pct: pct, color_temp_kelvin: kelvin, hs_color: hs } = call.serviceData
  const attributes: Record<string, unknown> = { ...next.attributes }
  if (typeof pct === 'number') attributes.brightness = Math.round((pct / 100) * 255)
  if (typeof kelvin === 'number') {
    attributes.color_temp_kelvin = kelvin
    attributes.color_mode = 'color_temp'
  }
  if (Array.isArray(hs)) {
    attributes.hs_color = hs
    attributes.color_mode = 'hs'
  }
  return { ...next, attributes }
}

const scene: ServiceHandler = (entity, call) => {
  if (call.service !== 'turn_on') return entity
  // A scene's state is the time it was last activated.
  const now = new Date().toISOString()
  return { ...entity, state: now, last_changed: now, last_updated: now }
}

// What each media_player service leaves the player's state as. Track changes leave it alone.
const NEXT_MEDIA_STATE = new Map([
  ['media_play', 'playing'],
  ['media_pause', 'paused'],
  ['turn_on', 'idle'],
  ['turn_off', 'off'],
])

const mediaPlayer: ServiceHandler = (entity, call) => {
  const level = call.serviceData.volume_level
  if (call.service === 'volume_set' && typeof level === 'number') {
    const now = new Date().toISOString()
    return {
      ...entity,
      attributes: { ...entity.attributes, volume_level: level },
      last_updated: now,
    }
  }
  const state = NEXT_MEDIA_STATE.get(call.service)
  if (!state || state === entity.state) return entity
  const now = new Date().toISOString()
  return { ...entity, state, last_changed: now, last_updated: now }
}

// What a service does to each entity it targets, keyed by HA domain. Control features add
// their own entry (brightness, media transport, ...) rather than editing one shared function.
const SERVICE_HANDLERS: Record<string, ServiceHandler> = {
  light,
  switch: onOff,
  fan: onOff,
  input_boolean: onOff,
  scene,
  media_player: mediaPlayer,
}

export class FakeHa {
  user: FakeUser
  readonly userData = new Map<string, unknown>()
  readonly systemData = new Map<string, unknown>()
  statistics: Record<string, StatisticPoint[]>
  private forecasts: Record<string, Forecasts>
  private entities = new Map<string, HassEntity>()
  private messages: ClientMessage[] = []
  private clients = new Set<FakeHaClient>()
  private failServices: string[]
  private responseDelayMs: number
  private onServiceCall: FakeHaOptions['onServiceCall']
  private registries: {
    areas: unknown[]
    floors: unknown[]
    devices: unknown[]
    entityRegistry: EntityRegistryDisplay
  }

  constructor(options: FakeHaOptions = {}) {
    this.user = { ...DEFAULT_USER, ...options.user }
    this.statistics = options.statistics ?? {}
    this.forecasts = structuredClone(options.forecasts ?? {})
    this.failServices = options.failServices ?? []
    this.responseDelayMs = options.responseDelayMs ?? 0
    this.onServiceCall = options.onServiceCall
    this.registries = {
      areas: structuredClone(options.areas ?? []),
      floors: structuredClone(options.floors ?? []),
      devices: structuredClone(options.devices ?? []),
      entityRegistry: structuredClone(options.entityRegistry ?? EMPTY_ENTITY_REGISTRY),
    }
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

  // Push a new forecast to everyone subscribed to it.
  setForecast(entityId: string, type: 'hourly' | 'daily', forecast: unknown[]) {
    this.forecasts[entityId] = { ...this.forecasts[entityId], [type]: forecast }
    for (const c of this.clients) {
      for (const id of c.subs.get(forecastChannel(entityId, type)) ?? []) {
        c.send({ id, type: 'event', event: { type, forecast } })
      }
    }
  }

  // Replace one registry and tell subscribers of its `*_registry_updated` event, as HA does
  // when an area, device, or entity changes.
  setRegistry<K extends RegistryName>(name: K, value: FakeHa['registries'][K]) {
    this.registries[name] = structuredClone(value)
    const event_type = REGISTRY_UPDATED_EVENTS[name]
    for (const c of this.clients) {
      for (const id of c.subs.get(eventChannel(event_type)) ?? []) {
        const event = {
          event_type,
          data: {},
          origin: 'LOCAL',
          time_fired: new Date().toISOString(),
        }
        c.send({ id, type: 'event', event })
      }
    }
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
      case 'weather/subscribe_forecast': {
        const entityId = String(msg.entity_id)
        const type = msg.forecast_type as 'hourly' | 'daily'
        if (!this.entities.has(entityId)) {
          return fail('invalid_entity_id', `Weather entity not found: ${entityId}`)
        }
        const forecast = this.forecasts[entityId]?.[type]
        if (!forecast) return fail('forecast_not_supported', `Entity does not support ${type}`)
        return subscribe(forecastChannel(entityId, type), { type, forecast })
      }
      case 'subscribe_events':
        return subscribe(eventChannel(String(msg.event_type)))
      case 'unsubscribe_events':
        // The library unsubscribes every subscription this way, whatever command opened it.
        for (const [type, ids] of client.subs) {
          client.subs.set(
            type,
            ids.filter((sub) => sub !== msg.subscription),
          )
        }
        return ok()
      default: {
        const registry = REGISTRY_LIST_MESSAGES[msg.type]
        if (registry) return ok(this.registries[registry])
        return fail('unknown_command', `Unknown command: ${msg.type}`)
      }
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
      this.applyServiceCall({ domain, service, entityIds: ids, serviceData: serviceDataOf(msg) })
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
      const next = SERVICE_HANDLERS[call.domain]?.(entity, call) ?? entity
      if (next !== entity) set(next)
    }
    for (const extra of this.onServiceCall?.(call, this) ?? []) set(extra)
    if (Object.keys(changed).length > 0) this.broadcastEntities({ c: changed })
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

function serviceDataOf(msg: ClientMessage): Record<string, unknown> {
  const { entity_id: _target, ...rest } = (msg.service_data ?? {}) as Record<string, unknown>
  return rest
}
