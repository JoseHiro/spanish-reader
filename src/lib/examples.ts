import type { Text, Word } from '../types'
import { normalize } from './tokenize'

const LETTERS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9'

function resolveClozes(paragraph: string, text: Text) {
  return paragraph.replace(/\{\{(\d+)\}\}/g, (_, rawNumber) => {
    const cloze = text.clozes?.find((item) => item.n === Number(rawNumber))
    return cloze ? cloze.options[cloze.answer] : ''
  })
}

function containsTerm(sentence: string, term: string) {
  const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^${LETTERS}])${escaped}(?=$|[^${LETTERS}])`, 'i').test(
    normalize(sentence),
  )
}

export function getWordExamples(word: Word, texts: Text[]): string[] {
  const examples: string[] = []
  if (word.example?.trim()) examples.push(word.example.trim())

  const source = texts.find((text) => text.id === word.source_text_id)
  if (source) {
    const terms = [...(word.forms ?? []), word.lemma].sort(
      (a, b) => b.length - a.length,
    )
    const sentences = source.paragraphs
      .map((paragraph) => resolveClozes(paragraph, source))
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?…])\s+/))
      .map((sentence) => sentence.trim())
      .filter(Boolean)
    const context = sentences.find((sentence) =>
      terms.some((term) => containsTerm(sentence, term)),
    )
    if (context && !examples.includes(context)) examples.push(context)
  }

  return examples.slice(0, 2)
}
