import { entityState, type EntityStateInput } from '../factories.ts'

export const fanState = (input: EntityStateInput) => entityState({ state: 'off', ...input })
