import { entityState, type EntityStateInput } from '../factories.ts'

export const binarySensorState = (input: EntityStateInput) =>
  entityState({ state: 'off', ...input })
