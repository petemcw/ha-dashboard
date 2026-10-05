import { entityState, type EntityStateInput } from '../factories.ts'

export const inputBooleanState = (input: EntityStateInput) =>
  entityState({ state: 'off', ...input })
