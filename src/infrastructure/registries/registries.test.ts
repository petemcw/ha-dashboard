import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeConnection } from '../../test/fakeConnection'
import { REFETCH_DEBOUNCE_MS, startRegistries } from './startRegistries'
import { registryStore, resetRegistryStore } from './registryStore'

const AREAS = [
  {
    area_id: 'kitchen',
    name: 'Kitchen',
    icon: 'mdi:countertop',
    floor_id: 'ground_floor',
    temperature_entity_id: 'sensor.kitchen_temperature',
    humidity_entity_id: null,
  },
]
const FLOORS = [{ floor_id: 'ground_floor', name: 'Ground Floor', level: 0, icon: null }]
const DEVICES = [{ id: 'dev1', area_id: 'kitchen', name: 'ignored' }]
const ENTITIES = {
  entity_categories: { 0: 'config' },
  entities: [
    { ei: 'light.kitchen_pendant', ai: 'kitchen', di: 'dev1', ic: 'mdi:ceiling-light' },
    { ei: 'button.restart', di: 'dev1', ec: 0, hb: true },
  ],
}
const ANSWERS = {
  'config/area_registry/list': AREAS,
  'config/floor_registry/list': FLOORS,
  'config/device_registry/list': DEVICES,
  'config/entity_registry/list_for_display': ENTITIES,
}

type Fake = ReturnType<typeof createFakeConnection>
async function settle() {
  await vi.advanceTimersByTimeAsync(0)
}
async function answerAll(fake: Fake) {
  for (const [type, result] of Object.entries(ANSWERS)) fake.resolveType(type, result)
  await settle()
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  resetRegistryStore()
})

function start() {
  const fake = createFakeConnection()
  const stop = startRegistries(fake.conn)
  return { fake, stop }
}

describe('registry store', () => {
  it('loads areas, floors, devices, and entity display records into the registry store', async () => {
    const { fake } = start()
    expect(registryStore.get().kind).toBe('loading')
    await answerAll(fake)
    const state = registryStore.get()
    if (state.kind !== 'ready') throw new Error('not ready')
    expect(state.registries.areas).toEqual([
      {
        areaId: 'kitchen',
        name: 'Kitchen',
        icon: 'mdi:countertop',
        floorId: 'ground_floor',
        temperatureEntityId: 'sensor.kitchen_temperature',
        humidityEntityId: undefined,
      },
    ])
    expect(state.registries.floors).toEqual([
      { floorId: 'ground_floor', name: 'Ground Floor', level: 0, icon: undefined },
    ])
    expect(state.registries.devices).toEqual([{ id: 'dev1', areaId: 'kitchen' }])
  })

  it('maps list_for_display records into entity records with area, device, icon, hidden, and category', async () => {
    const { fake } = start()
    await answerAll(fake)
    const state = registryStore.get()
    if (state.kind !== 'ready') throw new Error('not ready')
    expect(state.registries.entities).toEqual([
      {
        entityId: 'light.kitchen_pendant',
        areaId: 'kitchen',
        deviceId: 'dev1',
        icon: 'mdi:ceiling-light',
        hidden: false,
        category: false,
      },
      {
        entityId: 'button.restart',
        areaId: undefined,
        deviceId: 'dev1',
        icon: undefined,
        hidden: true,
        category: true,
      },
    ])
  })

  it('refetches the area list when HA fires area_registry_updated', async () => {
    const { fake } = start()
    await answerAll(fake)
    fake.fireEvent('area_registry_updated')
    await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS)
    expect(fake.countSent('config/area_registry/list')).toBe(2)
    expect(fake.countSent('config/floor_registry/list')).toBe(1)
    fake.resolveType('config/area_registry/list', [{ area_id: 'office', name: 'Office' }])
    await settle()
    const state = registryStore.get()
    if (state.kind !== 'ready') throw new Error('not ready')
    expect(state.registries.areas.map((a) => a.areaId)).toEqual(['office'])
  })

  it('collapses a burst of entity_registry_updated events into one refetch', async () => {
    const { fake } = start()
    await answerAll(fake)
    for (let i = 0; i < 20; i++) {
      fake.fireEvent('entity_registry_updated')
      await vi.advanceTimersByTimeAsync(10)
    }
    expect(fake.countSent('config/entity_registry/list_for_display')).toBe(1)
    await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS)
    expect(fake.countSent('config/entity_registry/list_for_display')).toBe(2)
  })

  it('refetches every registry after the connection reconnects', async () => {
    const { fake } = start()
    await answerAll(fake)
    fake.dispatch('ready')
    for (const type of Object.keys(ANSWERS)) expect(fake.countSent(type)).toBe(2)
  })

  it('keeps the last loaded registries when a refetch fails', async () => {
    const { fake } = start()
    await answerAll(fake)
    const before = registryStore.get()
    fake.dispatch('ready')
    fake.rejectType('config/area_registry/list')
    await settle()
    expect(registryStore.get()).toBe(before)
  })

  it('reports an error state when a registry message is rejected before anything loaded, and recovers on the next reconnect', async () => {
    const { fake } = start()
    fake.rejectType('config/area_registry/list', { code: 'unknown_command' })
    await settle()
    expect(registryStore.get().kind).toBe('error')
    fake.dispatch('ready')
    await answerAll(fake)
    expect(registryStore.get().kind).toBe('ready')
  })

  it('still loads the lists when the event subscription is rejected', async () => {
    const fake = createFakeConnection()
    fake.eventSubscriptions.reject = true
    startRegistries(fake.conn)
    await answerAll(fake)
    expect(registryStore.get().kind).toBe('ready')
  })

  it('stops following events and reconnects after stop', async () => {
    const { fake, stop } = start()
    await answerAll(fake)
    stop()
    await settle()
    expect(fake.unsubscribed).toHaveLength(4)
    fake.dispatch('ready')
    fake.fireEvent('area_registry_updated')
    await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS)
    expect(fake.countSent('config/area_registry/list')).toBe(1)
  })
})
