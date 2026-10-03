import { entityState, type EntityStateInput } from '../factories.ts'

export const lightState = (input: EntityStateInput) => entityState({ state: 'off', ...input })
