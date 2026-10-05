import { useSyncExternalStore } from 'react'
import { registryStore, type RegistryState } from './registryStore'

export function useRegistries(): RegistryState {
  return useSyncExternalStore(registryStore.subscribe, registryStore.get)
}
