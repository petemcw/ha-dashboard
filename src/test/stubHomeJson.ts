import { vi } from 'vitest'
import { testHomeConfig } from '../config/testHomeConfig'

// Serves /home.json from a stubbed fetch. Pass a status to simulate a server that has
// none, or any body to serve it as the file's content. Undo with vi.unstubAllGlobals().
export function stubHomeJson(body: unknown = testHomeConfig, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      url === '/home.json'
        ? Promise.resolve(new Response(JSON.stringify(body), { status }))
        : Promise.reject(new Error(`unexpected fetch ${url}`)),
    ),
  )
}
