import type { Text, Word } from '../types'
import { PRACTICE_EXAMPLES } from '../data/practiceExamples'

export type WordExample = {
  spanish: string
  japanese: string
}

export function getWordExamples(word: Word, _texts: Text[]): WordExample[] {
  const registered = word.practice_examples?.map((example) => ({
    spanish: example.es,
    japanese: example.ja,
  })) ?? PRACTICE_EXAMPLES[word.lemma] ?? []
  const authored = registered
    .map((example) => ({
      spanish: example.spanish.trim(),
      japanese: example.japanese.trim(),
    }))
    .filter((example) => example.spanish && example.japanese)
  if (authored.length >= 2) {
    return authored.slice(0, 2)
  }
  return []
}
