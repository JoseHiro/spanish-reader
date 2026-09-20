import type { Text, Word } from '../types'

export type WordExample = {
  spanish: string
  japanese: string
}

export function getWordExamples(word: Word, _texts: Text[]): WordExample[] {
  const authored = (word.practice_examples ?? [])
    .map((example) => ({
      spanish: example.es.trim(),
      japanese: example.ja.trim(),
    }))
    .filter((example) => example.spanish && example.japanese)
  if (authored.length >= 2) {
    return authored.slice(0, 2)
  }
  return []
}
