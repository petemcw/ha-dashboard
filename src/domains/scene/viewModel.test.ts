import { describe, expect, it } from 'vitest'
import { sceneState } from './factories'
import { sceneViewModel } from './viewModel'

describe('scene view model', () => {
  it('treats a scene that was never activated (state unknown) as ok', () => {
    expect(sceneViewModel('scene.a', sceneState({ entity_id: 'scene.a' })).status).toBe('ok')
  })

  it('is ok for a scene with a last-activated timestamp', () => {
    const scene = sceneState({ entity_id: 'scene.a', state: '2026-10-03T10:00:00+00:00' })
    expect(sceneViewModel('scene.a', scene).status).toBe('ok')
  })

  it('reports unavailable and missing scenes', () => {
    const gone = sceneState({ entity_id: 'scene.a', state: 'unavailable' })
    expect(sceneViewModel('scene.a', gone).status).toBe('unavailable')
    expect(sceneViewModel('scene.a', undefined).status).toBe('missing')
  })
})
