import { describe, expect, it } from 'vitest'

// Every non-test module under src/, as source text.
const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('one gateway', () => {
  it('no module outside the service gateway imports callService from home-assistant-js-websocket', () => {
    const importsCallService =
      /import\s*(?:type\s*)?\{[^}]*\bcallService\b[^}]*\}\s*from\s*['"]home-assistant-js-websocket['"]/
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.startsWith('/src/infrastructure/serviceGateway/'))
      .filter(([, text]) => importsCallService.test(text))
      .map(([path]) => path)
    expect(Object.keys(sources).length).toBeGreaterThan(20)
    expect(offenders).toEqual([])
  })
})
