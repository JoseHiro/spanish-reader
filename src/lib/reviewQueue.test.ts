import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { buildReviewQueue, requeueAfterAgain } from './reviewQueue'

const card = (lemma: string, difficulty: number, lapses = 0): Word => ({
  lemma,
  state: 'unknown',
  srs: {
    due: '2026-01-01T00:00:00.000Z',
    stability: 1,
    difficulty,
    elapsed_days: 1,
    scheduled_days: 1,
    reps: 2,
    lapses,
    state: 2,
  },
})

describe('Anki-style review queue', () => {
  it('prioritizes failed and difficult cards while randomizing equal cards', () => {
    const words = [card('easy', 2), card('hard', 8), card('lapsed', 4, 2)]
    expect(buildReviewQueue(words, Date.now(), () => 0.5)).toEqual([
      'lapsed',
      'hard',
      'easy',
    ])

    const equal = [card('a', 5), card('b', 5)]
    const values = [0.9, 0.1]
    expect(buildReviewQueue(equal, Date.now(), () => values.shift() ?? 0)).toEqual([
      'b',
      'a',
    ])
  })

  it('puts an Again card a few cards later instead of immediately next', () => {
    expect(requeueAfterAgain(['a', 'b', 'c', 'd', 'e'])).toEqual([
      'b',
      'c',
      'd',
      'a',
      'e',
    ])
  })
})
