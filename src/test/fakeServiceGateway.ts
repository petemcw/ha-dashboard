import type { ServiceGateway, ServiceTarget } from '../infrastructure/serviceGateway/serviceGateway'

export type RecordedCall = {
  domain: string
  service: string
  data?: Record<string, unknown>
  target?: ServiceTarget
}

// Records every call and leaves it pending until the test resolves or rejects it.
export function createFakeServiceGateway() {
  const calls: RecordedCall[] = []
  const settlers: { resolve: () => void; reject: (e: unknown) => void }[] = []
  const gateway: ServiceGateway = {
    callService: (domain, service, data, target) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ domain, service, data, target })
        settlers.push({ resolve, reject })
      }),
  }
  return {
    gateway,
    calls,
    resolve: (index = calls.length - 1) => settlers[index].resolve(),
    reject: (error: unknown, index = calls.length - 1) => settlers[index].reject(error),
  }
}
