import { describe, expect, it } from 'vitest'
import { mergeSeedWords } from './api'
import type { Word } from '../types'

describe('mergeSeedWords', () => {
  it('keeps saved progress while refreshing authored vocabulary content', () => {
    const seed: Word = {
      lemma: 'acometer',
      state: 'unknown',
      meaning_ja: '着手する',
      practice_examples: [
        { es: 'El gobierno acometió una reforma.', ja: '政府は改革に着手した。' },
        { es: 'Debemos acometer el problema.', ja: '問題に取り組む必要がある。' },
      ],
    }
    const stored: Word = {
      lemma: 'acometer',
      state: 'mastered',
      meaning_ja: '古い意味',
    }

    expect(mergeSeedWords([seed], [stored])).toEqual([
      { ...seed, state: 'mastered' },
    ])
  })
})
