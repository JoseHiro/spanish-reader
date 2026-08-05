import type { Text, Word, Encounter, QuizResult } from '../types'

/**
 * Storage layer.
 * - Dev: reads/writes go through the Vite middleware in vite.config.ts,
 *   which touches the real files under public/data/. Claude can edit them
 *   directly.
 * - Prod (GitHub Pages, no backend): reads pull the seed from
 *   `${BASE}/data/*.json`, writes go to localStorage under `sr:<name>`.
 *   Once a key is written, we prefer localStorage over the seed so the
 *   user's own state survives page reloads.
 */

const IS_DEV = import.meta.env.DEV
const BASE = import.meta.env.BASE_URL // e.g. '/' in dev, '/spanish-reader/' in prod
const LS_PREFIX = 'sr:'

async function fetchSeed<T>(name: string): Promise<T> {
  const r = await fetch(`${BASE}data/${name}.json`, { cache: 'no-cache' })
  if (!r.ok) throw new Error(`GET seed ${name} failed: ${r.status}`)
  return r.json()
}

async function apiGet<T>(name: string): Promise<T> {
  const r = await fetch(`/api/data/${name}`)
  if (!r.ok) throw new Error(`GET ${name} failed: ${r.status}`)
  return r.json()
}

async function apiPut(name: string, data: unknown): Promise<void> {
  const r = await fetch(`/api/data/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  })
  if (!r.ok) throw new Error(`PUT ${name} failed: ${r.status}`)
}

async function readFile<T>(name: string): Promise<T> {
  if (IS_DEV) return apiGet<T>(name)
  const stored = localStorage.getItem(LS_PREFIX + name)
  if (stored) {
    try {
      return JSON.parse(stored) as T
    } catch {
      // fall through to seed
    }
  }
  return fetchSeed<T>(name)
}

async function writeFile(name: string, data: unknown): Promise<void> {
  if (IS_DEV) return apiPut(name, data)
  localStorage.setItem(LS_PREFIX + name, JSON.stringify(data))
}

export const api = {
  getTexts: () => readFile<{ texts: Text[] }>('texts'),
  putTexts: (data: { texts: Text[] }) => writeFile('texts', data),

  getWords: () => readFile<{ words: Word[] }>('words'),
  putWords: (data: { words: Word[] }) => writeFile('words', data),

  getEncounters: () => readFile<{ encounters: Encounter[] }>('encounters'),
  putEncounters: (data: { encounters: Encounter[] }) =>
    writeFile('encounters', data),

  getQuizResults: () => readFile<{ results: QuizResult[] }>('quiz_results'),
  putQuizResults: (data: { results: QuizResult[] }) =>
    writeFile('quiz_results', data),

  /** Prod-only: wipe local user state, re-seed from bundle on next load. */
  resetLocalData(): void {
    for (const name of [
      'texts',
      'words',
      'encounters',
      'quiz_results',
      'vocab_baseline',
    ]) {
      localStorage.removeItem(LS_PREFIX + name)
    }
  },

  /** True when writes only survive in localStorage. */
  get isLocalOnly(): boolean {
    return !IS_DEV
  },
}
