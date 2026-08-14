import type { Word } from '../types'
import { normalize } from './tokenize'

export function findWordBySurface(words: Word[], surface: string): Word | null {
  const target = normalize(surface)
  const matches = words.filter(
    (word) =>
      normalize(word.lemma) === target ||
      word.forms?.some((form) => normalize(form) === target),
  )

  // Prefer glossary entries over state-only records created by quiz mistakes.
  return matches.find((word) => word.meaning_ja) ?? matches[0] ?? null
}
