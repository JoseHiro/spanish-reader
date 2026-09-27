import { describe, expect, it } from 'vitest'
import {
  alignJapaneseTranslation,
  alignBilingualSegments,
  splitSpanishClauses,
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

  it('does not split common Spanish abbreviations into false sentences', () => {
    expect(splitSpanishSentences('Trabaja en CC. OO. en Madrid. Después salió.')).toEqual([
      'Trabaja en CC. OO. en Madrid.',
      'Después salió.',
    ])
  })

  it('creates finer clause-level bilingual hover segments', () => {
    expect(splitSpanishClauses('Llegó tarde, pero terminó el trabajo.')).toEqual([
      'Llegó tarde,',
      'pero terminó el trabajo.',
    ])
    expect(
      alignBilingualSegments(
        'Llegó tarde, pero terminó el trabajo.',
        '到着は遅れたが、仕事は終えた。',
      ),
    ).toEqual([
      { source: 'Llegó tarde,', translation: '到着は遅れたが、' },
      { source: 'pero terminó el trabajo.', translation: '仕事は終えた。' },
    ])
  })
})
