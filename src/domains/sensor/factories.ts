import { entityState, type EntityStateInput } from '../factories.ts'

export const sensorState = (input: EntityStateInput) => entityState({ state: '0', ...input })

export const batterySensorState = (input: EntityStateInput) =>
  sensorState({
    ...input,
    attributes: { device_class: 'battery', unit_of_measurement: '%', ...input.attributes },
  })
