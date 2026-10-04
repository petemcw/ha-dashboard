import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/zilla-slab/600.css'
import '@fontsource/zilla-slab/700.css'
import './index.css'
import App from './app/App.tsx'
import { isDemoMode } from './infrastructure/ha/demoMode.ts'
import { applyStoredTheme } from './app/theme/useThemePreference.ts'

applyStoredTheme()

async function main() {
  // Before the first render: App's effect connects at once, and without the demo
  // connection installed it would reach for the real HA.
  if (isDemoMode()) {
    const { installDemo } = await import('./app/demo/installDemo.ts')
    installDemo()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void main()
