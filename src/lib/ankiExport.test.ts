import { describe, expect, it } from 'vitest'
import { ankiFileName, buildAnkiImportFile } from './ankiExport'
import type { Word } from '../types'

describe('Anki export', () => {
  const word: Word = {
    lemma: 'acometer', state: 'unknown', pos: 'verbo tr.', meaning_ja: '襲う、着手する',
    source_text_id: 'lesson-1', tags: ['expression'],
    practice_examples: [
      { es: 'La empresa acometió la reforma.', ja: '会社は改革に着手した。' },
      { es: 'El ejército acometió al enemigo.', ja: '軍は敵に襲いかかった。' },
    ],
  }

  it('creates a tab-separated file with Japanese and examples', () => {
    const result = buildAnkiImportFile([word], [{ id: 'lesson-1', title: 'Los Mejorados', type: 'plain', paragraphs: [] }], 'Spanish Reader::Los Mejorados')
    expect(result).toContain('\uFEFF#separator:Tab')
    expect(result).toContain('#html:true')
    expect(result).toContain('#deck:Spanish Reader::Los Mejorados')
    expect(result).toContain('襲う、着手する')
    expect(result).toContain('La empresa acometió la reforma.')
    expect(result).toContain('会社は改革に着手した。')
    expect(result).toContain('Los_Mejorados')
    expect(result.split('\n').at(-1)?.split('\t')).toHaveLength(3)
  })

  it('creates a portable filename', () => {
    expect(ankiFileName('Vocabulario temático')).toBe('spanish-reader-vocabulario-tematico-anki.txt')
  })
})
