import { createStore } from '../store'
import type { Registries } from './registries'

export type RegistryState =
  { kind: 'loading' } | { kind: 'ready'; registries: Registries } | { kind: 'error' }

export const registryStore = createStore<RegistryState>({ kind: 'loading' })

// Tests only: the store is a module singleton.
export function resetRegistryStore() {
  registryStore.set({ kind: 'loading' })
}
