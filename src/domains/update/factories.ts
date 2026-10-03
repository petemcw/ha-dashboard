import { entityState, type EntityStateInput } from '../factories.ts'

export const updateState = (input: EntityStateInput) => entityState({ state: 'off', ...input })
