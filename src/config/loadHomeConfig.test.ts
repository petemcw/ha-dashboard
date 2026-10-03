import { afterEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from './testHomeConfig'
import { loadHomeConfig } from './loadHomeConfig'

afterEach(() => vi.unstubAllGlobals())

const serve = (body: unknown, init: { ok?: boolean; status?: number } = {}) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('loading home.json', () => {
  it('fetches /home.json without using a cached copy and returns the parsed config', async () => {
    const fetchMock = serve(testHomeConfig)
    await expect(loadHomeConfig()).resolves.toEqual(testHomeConfig)
    expect(fetchMock).toHaveBeenCalledWith('/home.json', { cache: 'no-cache' })
  })

  it('reports the HTTP status when the server has no home.json', async () => {
    serve({}, { ok: false, status: 404 })
    await expect(loadHomeConfig()).rejects.toThrow("Couldn't load /home.json (HTTP 404)")
  })

  it('names the invalid field when the file has the wrong shape', async () => {
    serve({ ...testHomeConfig, crypto: 'BTC' })
    await expect(loadHomeConfig()).rejects.toThrow('crypto must be an array')
  })

  it('says the file is not valid JSON when it cannot be parsed', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error('x')) }),
    )
    await expect(loadHomeConfig()).rejects.toThrow('/home.json is not valid JSON')
  })
})
