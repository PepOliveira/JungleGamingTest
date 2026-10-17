import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { bootstrapApp } from '@/app/bootstrap'
import { enableMocking } from '@/mocks/enable-mocking'
import './index.css'

bootstrapApp()

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
