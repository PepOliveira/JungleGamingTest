import { delay } from 'msw'
import { nextLatencyMs } from '../scenarios'

export async function simulateLatency() {
  const ms = nextLatencyMs()
  if (ms > 0) {
    await delay(ms)
  }
}
