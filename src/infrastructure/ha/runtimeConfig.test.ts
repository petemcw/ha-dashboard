import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from './runtimeConfig'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('runtime config', () => {
  it('reads the Home Assistant URL from config.json when VITE_HA_URL is not set', async () => {
    vi.stubEnv('VITE_HA_URL', '')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ haUrl: 'https://ha.example' }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadConfig()).resolves.toEqual({ haUrl: 'https://ha.example' })
    expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-cache' })
  })

  it('prefers VITE_HA_URL in dev', async () => {
    vi.stubEnv('VITE_HA_URL', 'http://dev.example')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadConfig()).resolves.toEqual({ haUrl: 'http://dev.example' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails with the HTTP status when config.json cannot be loaded', async () => {
    vi.stubEnv('VITE_HA_URL', '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await expect(loadConfig()).rejects.toThrow('HTTP 404')
  })
})

describe('shared runtime config', () => {
  const okResponse = () =>
    new Response(JSON.stringify({ haUrl: 'https://ha.example' }), { status: 200 })

  it('fetches config.json once for every caller', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_HA_URL', '')
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()))
    vi.stubGlobal('fetch', fetchMock)
    const { getConfig } = await import('./runtimeConfig')
    await Promise.all([getConfig(), getConfig()])
    await getConfig()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('tries again after a failed fetch instead of keeping the failure', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_HA_URL', '')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockImplementation(() => Promise.resolve(okResponse()))
    vi.stubGlobal('fetch', fetchMock)
    const { getConfig } = await import('./runtimeConfig')
    await expect(getConfig()).rejects.toThrow('HTTP 503')
    await expect(getConfig()).resolves.toEqual({ haUrl: 'https://ha.example' })
  })
})
