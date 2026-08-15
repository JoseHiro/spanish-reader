import { describe, expect, it } from 'vitest'
import type { Word } from '../types'
import { findWordBySurface } from './words'

const words: Word[] = [
  {
    lemma: 'apostar por',
    forms: ['apostando'],
    state: 'probably_known',
    meaning_ja: '〜に重点的に取り組む',
  },
  { lemma: 'están', state: 'unknown' },
  {
    lemma: 'estar detrás de',
    forms: ['están'],
    state: 'probably_known',
    meaning_ja: '〜の背後にある',
  },
]

describe('findWordBySurface', () => {
  it('resolves an inflected form to its glossary lemma', () => {
    expect(findWordBySurface(words, 'apostando')?.lemma).toBe('apostar por')
  })

  it('prefers an entry with meaning over a state-only exact match', () => {
    expect(findWordBySurface(words, 'están')?.lemma).toBe('estar detrás de')
  })

  it('returns null for an unregistered easy word', () => {
    expect(findWordBySurface(words, 'nuevos')).toBeNull()
  })
})
