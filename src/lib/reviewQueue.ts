import type { Word } from '../types'

type QueueItem = {
  word: Word
  random: number
  overdueBucket: number
  difficultyBucket: number
}

export function buildReviewQueue(
  words: Word[],
  now = Date.now(),
  random = Math.random,
): string[] {
  const day = 24 * 60 * 60 * 1000
  return words
    .map<QueueItem>((word) => ({
      word,
      random: random(),
      overdueBucket: word.srs
        ? Math.max(0, Math.floor((now - new Date(word.srs.due).getTime()) / day / 3))
        : -1,
      difficultyBucket: word.srs ? Math.floor(word.srs.difficulty) : -1,
    }))
    .sort((a, b) => {
      // Like Anki, already-reviewed cards come before new cards. Within that
      // group, repeated failures and difficult/overdue cards receive priority.
      const aNew = a.word.srs ? 0 : 1
      const bNew = b.word.srs ? 0 : 1
      return (
        aNew - bNew ||
        (b.word.srs?.lapses ?? 0) - (a.word.srs?.lapses ?? 0) ||
        b.difficultyBucket - a.difficultyBucket ||
        b.overdueBucket - a.overdueBucket ||
        a.random - b.random
      )
    })
    .map(({ word }) => word.lemma)
}

export function requeueAfterAgain(queue: string[], spacing = 3): string[] {
  const [current, ...remaining] = queue
  if (!current) return remaining
  const insertAt = Math.min(spacing, remaining.length)
  return [
    ...remaining.slice(0, insertAt),
    current,
    ...remaining.slice(insertAt),
  ]
}
