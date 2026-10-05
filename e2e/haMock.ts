import type { Page, WebSocketRoute } from '@playwright/test'
import { testHomeConfig } from '../src/config/testHomeConfig.ts'
import {
  FAKE_HA_VERSION,
  FakeHa,
  type ClientMessage,
  type FakeHaClient,
  type FakeHaOptions,
} from '../src/infrastructure/fakeHa/fakeHa.ts'

export const MOCK_HA_URL = 'http://ha.mock.test'
export const WEBSOCKET_URL = /\/api\/websocket$/

export type SentMessage = ClientMessage

// The Playwright mock answers at once and has no demo side effects.
export type HaMockOptions = Pick<
  FakeHaOptions,
  | 'user'
  | 'entities'
  | 'statistics'
  | 'failServices'
  | 'forecasts'
  | 'areas'
  | 'floors'
  | 'devices'
  | 'entityRegistry'
> & {
  // Access tokens answered with auth_invalid.
  rejectTokens?: string[]
  // What /home.json serves; defaults to the shared test house. Any value, so a test can
  // serve an invalid file.
  homeConfig?: unknown
  // Serve a 404 for /home.json, as a server where the owner hasn't created one.
  homeConfigMissing?: boolean
}

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

// An in-test Home Assistant on the WebSocket wire: the shared fake HA core, plus
// Playwright's WebSocketRoute, the auth handshake, and the served config files. State
// lives in the core, not on the socket, so it survives drop() and reconnects.
export class HaMock extends FakeHa {
  private routes: { ws: WebSocketRoute; client: FakeHaClient }[] = []
  private unreachable = false
  // Tokens the app presented in `auth` messages, in order.
  readonly authTokens: string[] = []
  private rejectTokens: string[]
  private homeConfig: unknown
  private homeConfigMissing: boolean

  constructor(options: HaMockOptions = {}) {
    super(options)
    this.rejectTokens = options.rejectTokens ?? []
    this.homeConfig = 'homeConfig' in options ? options.homeConfig : testHomeConfig
    this.homeConfigMissing = options.homeConfigMissing ?? false
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

  // Closes the page side, so the library opens a new socket.
  drop() {
    for (const { ws, client } of this.routes) {
      this.disconnect(client)
      void ws.close()
    }
    this.routes = []
  }

  // While unreachable, every new socket is closed at once, like HA being down.
  setReachable(reachable: boolean) {
    this.unreachable = !reachable
  }

  private accept(ws: WebSocketRoute) {
    if (this.unreachable) return void ws.close()
    const send = (msg: unknown) => ws.send(JSON.stringify(msg))
    const client = this.connect(send)
    this.routes.push({ ws, client })
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as SentMessage
      if (msg.type === 'auth') {
        const token = String(msg.access_token)
        this.authTokens.push(token)
        if (this.rejectTokens.includes(token)) {
          return send({ type: 'auth_invalid', message: 'Invalid access token' })
        }
        return send({ type: 'auth_ok', ha_version: FAKE_HA_VERSION })
      }
      this.receive(client, msg)
    })
    send({ type: 'auth_required', ha_version: FAKE_HA_VERSION })
  }
}
