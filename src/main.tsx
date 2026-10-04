import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/zilla-slab/600.css'
import '@fontsource/zilla-slab/700.css'
import './index.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
