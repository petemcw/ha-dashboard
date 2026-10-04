import { createContext, use, type ReactNode } from 'react'
import { webSocketGateway, type ServiceGateway } from './serviceGateway'

// The default is the WebSocket gateway so components rendered without a provider still
// work. Pass a stable value: a gateway built during render would re-render every consumer.
const ServiceGatewayContext = createContext<ServiceGateway>(webSocketGateway)

export function ServiceGatewayProvider({
  gateway,
  children,
}: {
  gateway: ServiceGateway
  children: ReactNode
}) {
  return <ServiceGatewayContext value={gateway}>{children}</ServiceGatewayContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useServiceGateway(): ServiceGateway {
  return use(ServiceGatewayContext)
}
