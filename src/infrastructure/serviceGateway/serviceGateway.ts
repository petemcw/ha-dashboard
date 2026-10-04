import { callService } from 'home-assistant-js-websocket'
import { getConnection } from '../ha/connection'
import { connectionStatus } from '../ha/connectionStatus'

export type ServiceTarget = { entity_id: string | string[] }

export type ServiceGateway = {
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: ServiceTarget,
  ): Promise<void>
}

// connection-lost: the socket dropped with the call in flight, so HA may or may not have
// run it. rejected: HA refused it, or we never sent it. Nothing ran.
export class ServiceCallError extends Error {
  readonly kind: 'connection-lost' | 'rejected'
  constructor(kind: 'connection-lost' | 'rejected') {
    super(kind)
    this.kind = kind
  }
}

// The library's ERR_CONNECTION_LOST. It arrives bare while disconnected, or wrapped in an
// error result for a call that was in flight when the socket closed.
const ERR_CONNECTION_LOST = 3

function isConnectionLost(error: unknown): boolean {
  if (error === ERR_CONNECTION_LOST) return true
  const code = (error as { error?: { code?: unknown } } | null)?.error?.code
  return code === ERR_CONNECTION_LOST
}

// The only code that sends HA actions. It checks the status itself because after a
// suspend/resume the library queues calls instead of rejecting them, and a stale tap
// would then fire later. Never log `data` or `target`.
export function createWebSocketGateway(connect = getConnection): ServiceGateway {
  return {
    async callService(domain, service, data, target) {
      if (connectionStatus.get().kind !== 'connected') throw new ServiceCallError('rejected')
      const conn = await connect()
      try {
        await callService(conn, domain, service, data, target)
      } catch (error) {
        throw new ServiceCallError(isConnectionLost(error) ? 'connection-lost' : 'rejected')
      }
    },
  }
}

export const webSocketGateway = createWebSocketGateway()
