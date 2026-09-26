import { describe, expect, it } from 'vitest'
import type { Encounter, Text, Word } from '../types'
import { buildAiVocabularyPrompt, filterVocabWords } from './VocabList'

const words: Word[] = [
  { lemma: 'reto', state: 'unknown', source_text_id: 'text_02' },
  {
    lemma: 'a costa de',
    state: 'unknown',
    source_text_id: 'text_02',
    tags: ['expression'],
  },
  {
    lemma: 'al revés',
    state: 'probably_known',
    source_text_id: 'text_03',
    tags: ['expression'],
  },
]

describe('filterVocabWords', () => {
  it('keeps all lessons as the default scope', () => {
    expect(filterVocabWords(words, 'all', 'all')).toHaveLength(3)
  })

  it('filters practice to one lesson', () => {
    expect(filterVocabWords(words, 'text_02', 'all').map((w) => w.lemma)).toEqual([
      'reto',
      'a costa de',
    ])
  })

  it('builds a special-expression list within the selected lesson', () => {
    expect(
      filterVocabWords(words, 'text_02', 'expression').map((w) => w.lemma),
    ).toEqual(['a costa de'])
  })
})

describe('buildAiVocabularyPrompt', () => {
  it('includes lesson context and asks for useful explanations and examples', () => {
    const texts: Text[] = [
      {
        id: 'text_02',
        title: 'La relación rota',
        type: 'plain',
        paragraphs: [],
      },
    ]
    const encounters: Encounter[] = [
      {
        word_lemma: 'reto',
        text_id: 'text_02',
        sentence: 'Es uno de los grandes retos de la región.',
        tapped_at: '2026-09-26T00:00:00.000Z',
      },
    ]

    const prompt = buildAiVocabularyPrompt([words[0]], texts, encounters)

    expect(prompt).toContain('1. reto')
    expect(prompt).toContain('出典: La relación rota')
    expect(prompt).toContain('文脈: Es uno de los grandes retos de la región.')
    expect(prompt).toContain('自然なスペイン語の例文を2つ')
  })
})
