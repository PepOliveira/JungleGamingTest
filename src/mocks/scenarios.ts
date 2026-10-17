import { env } from '@/shared/config/env'
import { createRng } from './utils/rng'
import type { Rng } from './utils/rng'

export const scenarioNames = ['default', 'instant', 'payment-declined', 'wallet-refused'] as const
export type ScenarioName = (typeof scenarioNames)[number]

export type Scenario = {
  name: ScenarioName
  seed: number
  latency: { minMs: number; maxMs: number }
  payment: { settleMs: number; outcome: 'confirmed' | 'declined' }
  walletConnection: 'accept' | 'refuse'
}

const baseLatency = { minMs: 120, maxMs: 380 }
const noLatency = { minMs: 0, maxMs: 0 }
const seed = 20261016

const scenarios: Record<ScenarioName, Scenario> = {
  default: {
    name: 'default',
    seed,
    latency: baseLatency,
    payment: { settleMs: 2500, outcome: 'confirmed' },
    walletConnection: 'accept',
  },
  instant: {
    name: 'instant',
    seed,
    latency: noLatency,
    payment: { settleMs: 0, outcome: 'confirmed' },
    walletConnection: 'accept',
  },
  'payment-declined': {
    name: 'payment-declined',
    seed,
    latency: baseLatency,
    payment: { settleMs: 1500, outcome: 'declined' },
    walletConnection: 'accept',
  },
  'wallet-refused': {
    name: 'wallet-refused',
    seed,
    latency: baseLatency,
    payment: { settleMs: 2500, outcome: 'confirmed' },
    walletConnection: 'refuse',
  },
}

const STORAGE_KEY = 'kurio:mock-scenario'

function isScenarioName(value: unknown): value is ScenarioName {
  return typeof value === 'string' && (scenarioNames as readonly string[]).includes(value)
}

function readStoredScenario(): ScenarioName | null {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY)
    return isScenarioName(stored) ? stored : null
  } catch {
    return null
  }
}

function writeStoredScenario(name: ScenarioName) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, name)
  } catch {
    return
  }
}

function resolveInitialScenario(): ScenarioName {
  const stored = readStoredScenario()
  if (stored) return stored
  return isScenarioName(env.VITE_MOCK_SCENARIO) ? env.VITE_MOCK_SCENARIO : 'default'
}

let current: Scenario = scenarios[resolveInitialScenario()]
let latencyRng: Rng = createRng(current.seed)

export function getScenario() {
  return current
}

export function setScenario(name: ScenarioName) {
  current = scenarios[name]
  latencyRng = createRng(current.seed)
  writeStoredScenario(name)
}

export function resetScenarioSequence() {
  latencyRng = createRng(current.seed)
}

export function nextLatencyMs() {
  const { minMs, maxMs } = current.latency
  return maxMs <= minMs ? minMs : latencyRng.int(minMs, maxMs)
}
