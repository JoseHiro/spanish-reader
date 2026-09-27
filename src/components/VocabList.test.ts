import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { filterVocabWords } from './VocabList'

const words: Word[] = [
  { lemma: 'reto', state: 'unknown', source_text_id: 'text_02' },
  {
    lemma: 'a costa de',
    state: 'unknown',
    source_text_id: 'text_02',
    tags: ['expression'],
  },
  {
    lemma: 'cátedra',
    state: 'unknown',
    collection_id: 'thematic_vocab',
    chapter_id: 'education',
    chapter_title: 'Educación',
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

  it('keeps the thematic book separate and filters it by chapter', () => {
    expect(
      filterVocabWords(words, 'education', 'all', 'thematic').map(
        (word) => word.lemma,
      ),
    ).toEqual(['cátedra'])
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
