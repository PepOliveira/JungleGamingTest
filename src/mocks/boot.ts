import { enableMocking } from './enable-mocking'

declare global {
  interface Window {
    __KURIO_BOOT__?: Promise<void>
  }
}

window.__KURIO_BOOT__ = enableMocking()
