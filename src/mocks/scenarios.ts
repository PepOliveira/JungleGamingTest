import { env } from '@/shared/config/env'
import { createRng } from './utils/rng'
import type { Rng } from './utils/rng'

export const scenarioNames = ['default', 'instant'] as const
export type ScenarioName = (typeof scenarioNames)[number]

export type Scenario = {
  name: ScenarioName
  seed: number
  latency: { minMs: number; maxMs: number }
}

const scenarios: Record<ScenarioName, Scenario> = {
  default: { name: 'default', seed: 20261016, latency: { minMs: 120, maxMs: 380 } },
  instant: { name: 'instant', seed: 20261016, latency: { minMs: 0, maxMs: 0 } },
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
