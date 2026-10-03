import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { HomeConfigProvider } from '../config/HomeConfigProvider'
import type { HomeConfig } from '../config/homeConfig'
import { testHomeConfig } from '../config/testHomeConfig'

// Testing Library's render with the home config provided, for components that read it.
export function renderWithHome(
  ui: ReactElement,
  { config = testHomeConfig, ...options }: RenderOptions & { config?: HomeConfig } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <HomeConfigProvider config={config}>{children}</HomeConfigProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}
