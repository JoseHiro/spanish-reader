// Very simple Spanish tokenizer for the reader.
// Splits text into runs of "word" | "space" | "punct" for click targeting.

export type Token =
  | { kind: 'word'; text: string }
  | { kind: 'space'; text: string }
  | { kind: 'punct'; text: string }
  | { kind: 'cloze'; n: number }

const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+(?:['’][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)?/g

export function tokenize(input: string): Token[] {
  const out: Token[] = []
  // First split around cloze markers {{n}}
  const parts = input.split(/(\{\{\d+\}\})/g)
  for (const part of parts) {
    const m = part.match(/^\{\{(\d+)\}\}$/)
    if (m) {
      out.push({ kind: 'cloze', n: parseInt(m[1], 10) })
      continue
    }
    let last = 0
    for (const wm of part.matchAll(WORD_RE)) {
      const idx = wm.index ?? 0
      if (idx > last) {
        const between = part.slice(last, idx)
        pushNonWord(out, between)
      }
      out.push({ kind: 'word', text: wm[0] })
      last = idx + wm[0].length
    }
    if (last < part.length) {
      pushNonWord(out, part.slice(last))
    }
  }
  return out
}

function pushNonWord(out: Token[], s: string) {
  // separate whitespace runs from punct runs
  let buf = ''
  let mode: 'space' | 'punct' | null = null
  for (const ch of s) {
    const isSpace = /\s/.test(ch)
    const kind = isSpace ? 'space' : 'punct'
    if (mode && mode !== kind) {
      out.push({ kind: mode, text: buf })
      buf = ''
    }
    mode = kind
    buf += ch
  }
  if (buf) out.push({ kind: mode!, text: buf })
}

export function normalize(s: string): string {
  return s.toLowerCase().trim()
}
