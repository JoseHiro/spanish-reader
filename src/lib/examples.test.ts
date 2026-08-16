import { describe, expect, it } from 'vitest'
import type { Text, Word } from '../types'
import { getWordExamples } from './examples'

const text: Text = {
  id: 'lesson',
  title: 'Lección',
  type: 'cloze',
  paragraphs: ['Han seguido {{1}} por una industria. Otra frase distinta.'],
  clozes: [
    {
      n: 1,
      options: ['apostando', 'cortando', 'retando'],
      answer: 0,
    },
  ],
}

describe('getWordExamples', () => {
  it('combines the registered example with the source lesson sentence', () => {
    const word: Word = {
      lemma: 'apostar por',
      forms: ['apostando'],
      state: 'unknown',
      example: 'Apostamos por las energías renovables.',
      source_text_id: 'lesson',
    }
    expect(getWordExamples(word, [text])).toEqual([
      'Apostamos por las energías renovables.',
      'Han seguido apostando por una industria.',
    ])
  })

  it('does not match a lemma inside another word', () => {
    const word: Word = {
      lemma: 'sede',
      state: 'unknown',
      source_text_id: 'lesson',
    }
    expect(getWordExamples(word, [text])).toEqual([])
  })
})
