import { createConnection } from 'home-assistant-js-websocket'
import { installDemoConnection } from '../../infrastructure/ha/connection'
import { createDemoSocket } from '../../infrastructure/fakeHa/demoSocket'
import { FakeHa } from '../../infrastructure/fakeHa/fakeHa'
import { demoHouse } from './demoHouse'

// Hands the connection a fake HA to talk to. It runs the real library over an in-browser
// socket, so the real subscribeEntities and gateway sit on top of it unchanged.
export function installDemo() {
  const ha = new FakeHa(demoHouse())
  installDemoConnection(() => createConnection({ createSocket: createDemoSocket(ha) }))
}
