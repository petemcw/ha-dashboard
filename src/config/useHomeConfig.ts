import { useContext } from 'react'
import type { HomeConfig } from './homeConfig'
import { HomeConfigContext } from './homeConfigContext'

export function useHomeConfig(): HomeConfig {
  const config = useContext(HomeConfigContext)
  if (!config) throw new Error('useHomeConfig needs a HomeConfigProvider above it')
  return config
}
