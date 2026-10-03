import type { Page, WebSocketRoute } from '@playwright/test'
import type { HassEntity } from 'home-assistant-js-websocket'
import { testHomeConfig } from '../src/config/testHomeConfig.ts'

export const MOCK_HA_URL = 'http://ha.mock.test'
const HA_VERSION = '2026.9.4'
export const WEBSOCKET_URL = /\/api\/websocket$/

export type MockUser = { id: string; name: string; is_admin: boolean; is_owner: boolean }
export type StatisticPoint = { start: number; end: number; mean: number }
export type SentMessage = { id?: number; type: string; [key: string]: unknown }

const DEFAULT_USER: MockUser = { id: 'user-1', name: 'Test User', is_admin: true, is_owner: true }

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

export type HaMockOptions = {
  user?: Partial<MockUser>
  entities?: HassEntity[]
  statistics?: Record<string, StatisticPoint[]>
  // Access tokens answered with auth_invalid.
  rejectTokens?: string[]
  // What /home.json serves; defaults to the shared test house. Any value, so a test can
  // serve an invalid file.
  homeConfig?: unknown
  // Serve a 404 for /home.json, as a server where the owner hasn't created one.
  homeConfigMissing?: boolean
}

// `subs` holds subscription ids per channel: the subscribe command, plus the key for
// app data, since HA's `{value}` events don't say which key they belong to.
type Socket = { ws: WebSocketRoute; subs: Map<string, number[]>; stalled: boolean }

const dataChannel = (type: string, key: string) => `${type} ${key}`

export type Reply = {
  id: number
  type: string
  success?: boolean
  result?: unknown
  error?: { code: string; message: string }
}

// A second client on the mock, opened from inside the page: "another device", or a raw
// protocol check that bypasses the app. Authenticates, sends `message` as id 1, and
// resolves with the mock's reply to it. Mock only: the URL is the mock's.
export function sendFromAnotherClient(
  page: Page,
  message: { type: string; [key: string]: unknown },
) {
  return page.evaluate(
    ([url, msg]) =>
      new Promise<Reply>((resolve, reject) => {
        const ws = new WebSocket(url)
        ws.onerror = () => reject(new Error('socket error'))
        ws.onmessage = (ev) => {
          const reply = JSON.parse(String(ev.data))
          if (reply.type === 'auth_required') {
            ws.send(JSON.stringify({ type: 'auth', access_token: 'x' }))
          }
          if (reply.type === 'auth_ok') ws.send(JSON.stringify({ id: 1, ...msg }))
          if (reply.id === 1) {
            ws.close()
            resolve(reply)
          }
        }
      }),
    [`${MOCK_HA_URL.replace(/^http/, 'ws')}/api/websocket`, message] as const,
  )
}

// An in-test Home Assistant speaking the real WebSocket wire protocol. State lives on
// the mock, not on the socket, so it survives drop() and reconnects.
export class HaMock {
  user: MockUser
  readonly userData = new Map<string, unknown>()
  readonly systemData = new Map<string, unknown>()
  statistics: Record<string, StatisticPoint[]>
  private entities = new Map<string, HassEntity>()
  private messages: SentMessage[] = []
  private sockets: Socket[] = []
  private unreachable = false
  // Tokens the app presented in `auth` messages, in order.
  readonly authTokens: string[] = []
  private rejectTokens: string[]
  private homeConfig: unknown
  private homeConfigMissing: boolean

  constructor(options: HaMockOptions = {}) {
    this.user = { ...DEFAULT_USER, ...options.user }
    this.statistics = options.statistics ?? {}
    this.rejectTokens = options.rejectTokens ?? []
    this.homeConfig = 'homeConfig' in options ? options.homeConfig : testHomeConfig
    this.homeConfigMissing = options.homeConfigMissing ?? false
    for (const e of options.entities ?? []) this.entities.set(e.entity_id, e)
  }

  async install(page: Page) {
    await page.route('**/config.json', (route) => route.fulfill({ json: { haUrl: MOCK_HA_URL } }))
    await page.route('**/home.json', (route) =>
      this.homeConfigMissing
        ? route.fulfill({ status: 404, body: 'not found' })
        : route.fulfill({ json: this.homeConfig }),
    )
    // Anything else aimed at the HA origin (person pictures, REST) never leaves the box.
    await page.route(`${MOCK_HA_URL}/**`, (route) => route.fulfill({ status: 404, body: 'mock' }))
    await page.routeWebSocket(WEBSOCKET_URL, (ws) => this.accept(ws))
  }

  sent(): SentMessage[] {
    return [...this.messages]
  }

  setState(entity: HassEntity) {
    this.entities.set(entity.entity_id, entity)
    this.broadcastEntities({ c: { [entity.entity_id]: { '+': compress(entity) } } })
  }

  removeEntity(id: string) {
    this.entities.delete(id)
    this.broadcastEntities({ r: [id] })
  }

  // Closes the page side, so the library opens a new socket.
  drop() {
    for (const s of this.sockets) void s.ws.close()
    this.sockets = []
  }

  // While unreachable, every new socket is closed at once, like HA being down.
  setReachable(reachable: boolean) {
    this.unreachable = !reachable
  }

  // Half-open socket: the sockets open now never answer again, but nothing is closed.
  // A socket opened later (the app's reconnect) works normally.
  stall() {
    for (const s of this.sockets) s.stalled = true
  }

  private broadcastEntities(event: unknown) {
    for (const s of this.sockets) {
      if (s.stalled) continue
      for (const id of s.subs.get('subscribe_entities') ?? []) {
        s.ws.send(JSON.stringify({ id, type: 'event', event }))
      }
    }
  }

  private accept(ws: WebSocketRoute) {
    if (this.unreachable) return void ws.close()
    const socket: Socket = { ws, subs: new Map(), stalled: false }
    this.sockets.push(socket)
    const send = (msg: unknown) => ws.send(JSON.stringify(msg))
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as SentMessage
      if (msg.type === 'auth') {
        const token = String(msg.access_token)
        this.authTokens.push(token)
        if (this.rejectTokens.includes(token)) {
          return send({ type: 'auth_invalid', message: 'Invalid access token' })
        }
        return send({ type: 'auth_ok', ha_version: HA_VERSION })
      }
      this.messages.push(msg)
      if (!socket.stalled) this.handle(socket, msg, send)
    })
    send({ type: 'auth_required', ha_version: HA_VERSION })
  }

  private handle(socket: Socket, msg: SentMessage, send: (m: unknown) => void) {
    const id = msg.id!
    const ok = (result: unknown = null) => send({ id, type: 'result', success: true, result })
    const fail = (code: string, message = code) =>
      send({ id, type: 'result', success: false, error: { code, message } })
    const subscribe = (channel: string, initial?: unknown) => {
      socket.subs.set(channel, [...(socket.subs.get(channel) ?? []), id])
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
        for (const [type, ids] of socket.subs) {
          socket.subs.set(
            type,
            ids.filter((sub) => sub !== msg.subscription),
          )
        }
        return ok()
      default:
        return fail('unknown_command', `Unknown command: ${msg.type}`)
    }
  }

  private notify(channel: string, value: unknown) {
    for (const s of this.sockets) {
      for (const id of s.subs.get(channel) ?? []) {
        s.ws.send(JSON.stringify({ id, type: 'event', event: { value } }))
      }
    }
  }

  private statisticsFor(ids: string[] = Object.keys(this.statistics)) {
    return Object.fromEntries(
      ids.filter((i) => i in this.statistics).map((i) => [i, this.statistics[i]]),
    )
  }
}
