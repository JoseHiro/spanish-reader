import type { Text, Word } from '../types'
import { getWordExamples } from './examples'

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function ankiTag(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, '_').replace(/["'<>#]/g, '')
}

export function buildAnkiImportFile(words: Word[], texts: Text[], deckName: string) {
  const rows = words.filter((word) => word.meaning_ja).map((word) => {
    const examples = getWordExamples(word, texts)
    const source = word.chapter_title ?? texts.find((text) => text.id === word.source_text_id)?.title
    const back = [
      word.pos ? `<span style="color:#777">${escapeHtml(word.pos)}</span>` : '',
      `<div style="font-size:1.2em;margin:8px 0">${escapeHtml(word.meaning_ja!)}</div>`,
      ...examples.map((example, index) => `<div style="margin-top:10px"><b>${index + 1}.</b> ${escapeHtml(example.spanish)}<br><span style="color:#666">${escapeHtml(example.japanese)}</span></div>`),
    ].filter(Boolean).join('')
    const tags = ['spanish_reader', word.collection_id === 'thematic_vocab' ? 'tematico' : 'textos', source, word.state, ...(word.tags ?? [])]
      .filter((tag): tag is string => Boolean(tag)).map(ankiTag).filter(Boolean).join(' ')
    return [`<b>${escapeHtml(word.lemma)}</b>`, back, tags]
      .map((value) => value.replaceAll('\t', ' ').replace(/\r?\n/g, '<br>')).join('\t')
  })

  return ['\uFEFF#separator:Tab', '#html:true', `#deck:${deckName}`, '#columns:Front\tBack\tTags', '#tags column:3', ...rows].join('\n')
}

export function ankiFileName(scopeName: string) {
  const slug = scopeName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `spanish-reader-${slug || 'vocabulario'}-anki.txt`
}
