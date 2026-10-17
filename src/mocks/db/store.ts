import { resetScenarioSequence } from '../scenarios'
import { createSeedDb, SCHEMA_VERSION } from './seed'
import { readStoredJson, removeStoredValue, writeStoredJson } from './storage'
import type { MockDb } from './types'

const STORAGE_KEY = 'kurio:mock-db'

let state: MockDb | null = null

function isStoredDb(value: unknown): value is MockDb {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === SCHEMA_VERSION
  )
}

function persist(db: MockDb) {
  writeStoredJson(STORAGE_KEY, db)
}

function load(): MockDb {
  const stored = readStoredJson(STORAGE_KEY)
  if (isStoredDb(stored)) {
    return stored
  }
  const seeded = createSeedDb()
  persist(seeded)
  return seeded
}

export function getDb(): MockDb {
  state ??= load()
  return state
}

export function updateDb<TResult>(recipe: (db: MockDb) => TResult): TResult {
  const db = getDb()
  const result = recipe(db)
  persist(db)
  return result
}

export function resetDb() {
  removeStoredValue(STORAGE_KEY)
  state = createSeedDb()
  persist(state)
  resetScenarioSequence()
}
