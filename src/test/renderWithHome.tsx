import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { HomeConfigProvider } from '../config/HomeConfigProvider'
import type { HomeConfig } from '../config/homeConfig'
import { ServiceGatewayProvider } from '../infrastructure/serviceGateway/ServiceGatewayProvider'
import type { ServiceGateway } from '../infrastructure/serviceGateway/serviceGateway'
import { testHomeConfig } from '../config/testHomeConfig'

// Testing Library's render with the home config provided, for components that read it.
export function renderWithHome(
  ui: ReactElement,
  {
    config = testHomeConfig,
    gateway,
    ...options
  }: RenderOptions & { config?: HomeConfig; gateway?: ServiceGateway } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <HomeConfigProvider config={config}>
      {gateway ? (
        <ServiceGatewayProvider gateway={gateway}>{children}</ServiceGatewayProvider>
      ) : (
        children
      )}
    </HomeConfigProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}
