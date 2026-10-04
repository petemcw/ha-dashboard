import { entityState, type EntityStateInput } from '../factories.ts'

// A scene's state is the timestamp of its last activation (or `unknown` before the first).
export const sceneState = (input: EntityStateInput) => entityState({ state: 'unknown', ...input })
