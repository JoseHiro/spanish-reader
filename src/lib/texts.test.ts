import { describe, expect, it } from 'vitest'
import data from '../../public/data/texts.json'

describe('text chunk metadata', () => {
  it('defines one chunk type and one translation for every paragraph', () => {
    for (const text of data.texts) {
      expect(text.chunk_types, text.title).toHaveLength(text.paragraphs.length)
      expect(text.translation_ja, text.title).toHaveLength(text.paragraphs.length)
    }
  })

  it('does not misclassify Los Mejorados paragraphs as headings', () => {
    const text = data.texts.find((item) => item.id === 'text_01')
    expect(text?.chunk_types).toEqual([
      'body',
      'body',
      'body',
      'body',
      'body',
    ])
  })

  it('marks only the two section labels in text 02 as headings', () => {
    const text = data.texts.find((item) => item.id === 'text_02')
    expect(text?.chunk_types).toEqual([
      'body',
      'heading',
      'body',
      'heading',
      'body',
    ])
  })

  it('provides a Japanese meaning for every quiz option', () => {
    for (const text of data.texts) {
      for (const cloze of text.clozes ?? []) {
        expect(
          cloze.option_meanings_ja,
          `${text.title} - pregunta ${cloze.n}`,
        ).toHaveLength(cloze.options.length)
        expect(cloze.option_meanings_ja?.every(Boolean)).toBe(true)
      }
    }
  })
})
