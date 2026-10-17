import type { ApiErrorCode } from '@/contracts/errors'
import { readStoredJson, removeStoredValue, writeStoredJson } from './db/storage'

export type FaultEffect = 'status' | 'network' | 'timeout'

export type Fault = {
  method?: string
  path: string
  effect: FaultEffect
  status?: number
  code?: ApiErrorCode
  message?: string
  times?: number
}

type ActiveFault = Fault & { remaining: number | null }

type FaultState = {
  faults: ActiveFault[]
  lostOrderResponses: number
}

const STORAGE_KEY = 'kurio:mock-faults'

function load(): FaultState {
  const stored = readStoredJson(STORAGE_KEY)
  if (typeof stored === 'object' && stored !== null) {
    const candidate = stored as Partial<FaultState>
    if (Array.isArray(candidate.faults)) {
      return {
        faults: candidate.faults,
        lostOrderResponses: Number(candidate.lostOrderResponses ?? 0),
      }
    }
  }
  return { faults: [], lostOrderResponses: 0 }
}

let state: FaultState = load()

function persist() {
  if (state.faults.length === 0 && state.lostOrderResponses === 0) {
    removeStoredValue(STORAGE_KEY)
    return
  }
  writeStoredJson(STORAGE_KEY, state)
}

export function addFault(fault: Fault) {
  state.faults.push({ ...fault, remaining: fault.times ?? null })
  persist()
}

export function clearFaults() {
  state = { faults: [], lostOrderResponses: 0 }
  persist()
}

export function listFaults() {
  return state.faults.map((fault) => ({ ...fault }))
}

export function matchFault(method: string, pathname: string): Fault | null {
  const found = state.faults.find(
    (fault) =>
      (fault.remaining === null || fault.remaining > 0) &&
      (!fault.method || fault.method.toUpperCase() === method.toUpperCase()) &&
      pathname.includes(fault.path),
  )
  if (!found) return null
  if (found.remaining !== null) {
    found.remaining -= 1
    persist()
  }
  return found
}

export function loseNextOrderResponses(times: number) {
  state.lostOrderResponses = times
  persist()
}

export function consumeLostOrderResponse() {
  if (state.lostOrderResponses <= 0) return false
  state.lostOrderResponses -= 1
  persist()
  return true
}
