import { entityState, type EntityStateInput } from '../factories.ts'

// A script is `off` when idle and `on` while it runs.
export const scriptState = (input: EntityStateInput) => entityState({ state: 'off', ...input })
