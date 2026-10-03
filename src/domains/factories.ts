import type { HassEntity } from 'home-assistant-js-websocket'

// Base entity builder shared by Vitest and the Playwright HA mock. Per-domain
// factories extend it. It is imported by e2e/ through tsconfig.node.json, so it
// stays free of browser globals and uses explicit .ts extensions on relative imports.
export type EntityStateInput = {
  entity_id: string
  state?: string
  attributes?: Record<string, unknown>
  // Epoch seconds, as in HA's compressed entity events.
  last_changed?: number
  last_updated?: number
}

const DEFAULT_LAST_CHANGED = 1_767_225_600 // 2026-01-01T00:00:00Z

export function entityState(input: EntityStateInput): HassEntity {
  const lc = input.last_changed ?? DEFAULT_LAST_CHANGED
  const lu = input.last_updated ?? lc
  return {
    entity_id: input.entity_id,
    state: input.state ?? 'unknown',
    attributes: input.attributes ?? {},
    last_changed: new Date(lc * 1000).toISOString(),
    last_updated: new Date(lu * 1000).toISOString(),
    context: { id: 'ctx', parent_id: null, user_id: null },
  }
}
