import type { ReactNode } from 'react'
import { HomeConfigContext } from './homeConfigContext'
import type { HomeConfig } from './homeConfig'

export function HomeConfigProvider({
  config,
  children,
}: {
  config: HomeConfig
  children: ReactNode
}) {
  return <HomeConfigContext value={config}>{children}</HomeConfigContext>
}
