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
  it('uses two authored bilingual examples instead of source text', () => {
    const word: Word = {
      lemma: 'apostar por',
      forms: ['apostando'],
      state: 'unknown',
      example: 'Apostamos por las energías renovables.',
      source_text_id: 'lesson',
      practice_examples: [
        { es: 'Apostamos por la educación pública.', ja: '私たちは公教育を重視している。' },
        { es: 'La empresa apostó por la energía solar.', ja: 'その企業は太陽エネルギーに力を入れた。' },
      ],
    }
    expect(getWordExamples(word, [text])).toEqual([
      { spanish: 'Apostamos por la educación pública.', japanese: '私たちは公教育を重視している。' },
      { spanish: 'La empresa apostó por la energía solar.', japanese: 'その企業は太陽エネルギーに力を入れた。' },
    ])
  })

  it('does not create meta sentences when authored examples are unavailable', () => {
    const word: Word = {
      lemma: 'palabra sin registrar',
      state: 'unknown',
      source_text_id: 'lesson',
    }
    expect(getWordExamples(word, [text])).toEqual([])
  })
})
