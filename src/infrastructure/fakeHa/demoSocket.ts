import type { ConnectionOptions, HaWebSocket } from 'home-assistant-js-websocket'
import { FAKE_HA_VERSION, type FakeHa } from './fakeHa.ts'

type Listener = (event: { data?: string }) => void

const OPEN = 1
const CLOSED = 3

// Stands in for the library's WebSocket, already authenticated: Connection only needs
// send/close, add/removeEventListener, readyState/OPEN, and haVersion. Everything is
// delivered on a later tick, because a reply from inside send() would re-enter
// Connection.sendMessage.
class DemoSocket {
  readonly OPEN = OPEN
  readonly haVersion = FAKE_HA_VERSION
  readyState = OPEN
  private listeners = new Map<string, Set<Listener>>()
  private client

  private ha: FakeHa

  constructor(ha: FakeHa) {
    this.ha = ha
    this.client = ha.connect((message) =>
      setTimeout(() => this.emit('message', { data: JSON.stringify(message) })),
    )
  }

  send(data: string) {
    const message = JSON.parse(data)
    setTimeout(() => {
      if (this.readyState === OPEN) this.ha.receive(this.client, message)
    })
  }

  close() {
    if (this.readyState === CLOSED) return
    this.readyState = CLOSED
    this.ha.disconnect(this.client)
    setTimeout(() => this.emit('close', {}))
  }

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  private emit(type: string, event: { data?: string }) {
    // A closed socket hears nothing more, as with a real one.
    if (type === 'message' && this.readyState !== OPEN) return
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event)
  }
}

// The `createSocket` option for createConnection. The library calls it again for every
// reconnect, so each call is a new client of the same fake HA.
export function createDemoSocket(ha: FakeHa): (options: ConnectionOptions) => Promise<HaWebSocket> {
  return async () => new DemoSocket(ha) as unknown as HaWebSocket
}
