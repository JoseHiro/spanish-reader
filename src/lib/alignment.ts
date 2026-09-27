export function splitSpanishSentences(text: string): string[] {
  const protectedText = protectSpanishAbbreviations(text)
  return (protectedText.match(/.*?(?:[.!?…](?:[»”"]?)(?:\s+|$)|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .map(restorePeriods)
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

const PERIOD_TOKEN = '\uE000'

function protectSpanishAbbreviations(text: string): string {
  return text
    .replace(/\b(CC|EE|FF)\.\s+(OO|UU|AA)\./g, (_, a, b) =>
      `${a}${PERIOD_TOKEN} ${b}${PERIOD_TOKEN}`,
    )
    .replace(/\b(Sr|Sra|Srta|Dr|Dra|D|Da|Ud|Uds|etc|pág|núm)\./gi, (match) =>
      match.replace('.', PERIOD_TOKEN),
    )
    .replace(/(\d)\.(\d)/g, `$1${PERIOD_TOKEN}$2`)
}

function restorePeriods(text: string): string {
  return text.replaceAll(PERIOD_TOKEN, '.')
}

export function splitSpanishClauses(text: string): string[] {
  return splitSpanishSentences(text).flatMap((sentence) =>
    (sentence.match(/.*?(?:[,;:]\s+|[.!?…](?:[»”"]?)(?:\s+|$)|$)/g) ?? [])
      .map((part) => part.trim())
      .filter(Boolean),
  )
}

export function splitJapaneseClauses(text: string): string[] {
  return (text.match(/.*?[。！？、；：]|.+$/g) ?? [])
    .map((part) => part.trim())
    .filter(Boolean)
}

export function alignBilingualSegments(
  source: string,
  translation: string,
): Array<{ source: string; translation: string }> {
  const sourceParts = splitSpanishClauses(source)
  const translationParts = splitJapaneseClauses(translation)
  if (!sourceParts.length || !translationParts.length) {
    return [{ source, translation }]
  }

  const count = Math.min(sourceParts.length, translationParts.length)
  const groupedSource = groupByLength(sourceParts, count)
  const groupedTranslation = groupByLength(translationParts, count)
  return groupedSource.map((part, index) => ({
    source: part,
    translation: groupedTranslation[index],
  }))
}

function groupByLength(parts: string[], count: number): string[] {
  if (parts.length === count) return parts
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const groups: string[] = []
  let cursor = 0
  let consumed = 0
  for (let group = 0; group < count; group += 1) {
    const remainingGroups = count - group
    const start = cursor
    const target = ((group + 1) * total) / count
    while (
      cursor < parts.length - (remainingGroups - 1) &&
      (consumed < target || cursor === start)
    ) {
      consumed += parts[cursor].length
      cursor += 1
    }
    groups.push(parts.slice(start, cursor).join(' '))
  }
  return groups
}
