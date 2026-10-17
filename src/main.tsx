import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { bootstrapApp } from '@/app/bootstrap'
import { setRuntimeReady } from '@/shared/config/runtime-ready'
import './index.css'

bootstrapApp()
setRuntimeReady(window.__KURIO_BOOT__ ?? Promise.resolve())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
