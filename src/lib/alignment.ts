export function splitSpanishSentences(text: string): string[] {
  return (text.match(/.*?(?:[.!?…](?:\s+|$)|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function splitJapaneseSentences(text: string): string[] {
  return (text.match(/.*?[。！？]|.+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function alignJapaneseTranslation(
  translation: string,
  sourceCount: number,
): string[] {
  if (sourceCount <= 0) return []
  const sentences = splitJapaneseSentences(translation)
  if (sentences.length === 0) return Array(sourceCount).fill(translation)

  return Array.from({ length: sourceCount }, (_, index) => {
    const start = Math.floor((index * sentences.length) / sourceCount)
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) * sentences.length) / sourceCount),
    )
    return sentences.slice(start, Math.min(end, sentences.length)).join('')
  })
}
