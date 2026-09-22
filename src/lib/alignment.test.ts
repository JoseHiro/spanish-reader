import { describe, expect, it } from 'vitest'
import {
  alignJapaneseTranslation,
  splitJapaneseSentences,
  splitSpanishSentences,
} from './alignment'

describe('bilingual sentence alignment', () => {
  it('splits Spanish and Japanese without losing sentence punctuation', () => {
    expect(splitSpanishSentences('Primera frase. Segunda frase.')).toEqual([
      'Primera frase.',
      'Segunda frase.',
    ])
    expect(splitJapaneseSentences('最初の文。次の文。')).toEqual([
      '最初の文。',
      '次の文。',
    ])
  })

  it('groups extra Japanese sentences in source order', () => {
    expect(alignJapaneseTranslation('一。二。三。四。五。', 4)).toEqual([
      '一。',
      '二。',
      '三。',
      '四。五。',
    ])
  })
})
