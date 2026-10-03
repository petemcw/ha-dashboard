import { entityState, type EntityStateInput } from '../factories.ts'

export const switchState = (input: EntityStateInput) => entityState({ state: 'off', ...input })
