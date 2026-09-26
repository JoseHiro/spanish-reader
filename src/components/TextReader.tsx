import { useState } from 'react'
import type * as React from 'react'
import type { Text, Word, WordState, Encounter } from '../types'
import { tokenize } from '../lib/tokenize'
import { findWordBySurface } from '../lib/words'
import { WordPopup } from './WordPopup'
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconListPlus,
} from './Icons'

export function TextReader({
  text,
  words,
  completed,
  onBack,
  onOpenQuiz,
  onWordUpdate,
  onEncounter,
  onToggleCompleted,
}: {
  text: Text
  words: Word[]
  completed: boolean
  onBack: () => void
  onOpenQuiz: () => void
  onWordUpdate: (w: Word) => void
  onEncounter: (e: Encounter) => void
  onToggleCompleted: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [collectMode, setCollectMode] = useState(false)
  const [collected, setCollected] = useState(() => new Set<string>())
  const [popup, setPopup] = useState<{
    surface: string
    anchor: DOMRect
    sentence: string
  } | null>(null)

  function findWord(surface: string): Word | null {
    return findWordBySurface(words, surface)
  }

  function onWordClick(
    surface: string,
    sentence: string,
    ev: React.MouseEvent<HTMLSpanElement>,
  ) {
    if (collectMode) {
      collectWord(surface, sentence)
      return
    }
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    setPopup({ surface, sentence, anchor: rect })
  }

  function collectWord(surface: string, sentence: string) {
    const existing = findWord(surface)
    if (existing?.state === 'unknown') return
    const lemma = existing?.lemma ?? surface.toLowerCase()
    onWordUpdate(
      existing
        ? { ...existing, state: 'unknown' }
        : {
            lemma,
            state: 'unknown',
            source_text_id: text.id,
            tags: ['tapped'],
          },
    )
    onEncounter({
      word_lemma: lemma,
      text_id: text.id,
      sentence,
      tapped_at: new Date().toISOString(),
    })
    setCollected((current) => new Set(current).add(lemma))
  }

  function handleSetState(state: WordState) {
    if (!popup) return
    const existing = findWord(popup.surface)
    const now = new Date().toISOString()
    const lemma = existing?.lemma ?? popup.surface.toLowerCase()

    const word: Word = existing
      ? { ...existing, state }
      : {
          lemma,
          state,
          source_text_id: text.id,
          tags: ['tapped'],
        }
    onWordUpdate(word)

    if (state === 'unknown') {
      onEncounter({
        word_lemma: lemma,
        text_id: text.id,
        sentence: popup.sentence,
        tapped_at: now,
      })
    }
    setPopup(null)
  }

  const existingForPopup = popup ? findWord(popup.surface) : null

  return (
    <>
      <div className="back-link" onClick={onBack}>
        <IconArrowLeft size={14} strokeWidth={1.8} />
        Volver
      </div>
      <h1>{text.title}</h1>
      <div className="subtitle">
        {text.author}
        {text.source && (
          <>
            {' · '}
            <span>{text.source}</span>
          </>
        )}
        {text.level && (
          <>
            {' · '}
            <span className="badge">{text.level}</span>
          </>
        )}
      </div>

      <div className="reader-head">
        <button onClick={() => setRevealed((r) => !r)}>
          {revealed ? (
            <IconEyeOff size={14} strokeWidth={1.8} />
          ) : (
            <IconEye size={14} strokeWidth={1.8} />
          )}
          <span style={{ marginLeft: 6 }}>
            {revealed ? 'Ocultar respuestas' : 'Mostrar respuestas'}
          </span>
        </button>
        <button
          onClick={onToggleCompleted}
          className={completed ? 'done-btn' : ''}
          title={completed ? 'Desmarcar como completado' : 'Marcar como completado'}
        >
          <IconCheck size={14} strokeWidth={2.2} />
          <span style={{ marginLeft: 4 }}>
            {completed ? 'Completado' : 'Marcar completado'}
          </span>
        </button>
        <button
          className={collectMode ? 'collect-toggle active' : 'collect-toggle'}
          aria-pressed={collectMode}
          onClick={() => {
            setCollectMode((active) => !active)
            setPopup(null)
          }}
          title="Añadir palabras desconocidas con un solo clic"
        >
          <IconListPlus size={15} strokeWidth={2} />
          <span style={{ marginLeft: 6 }}>
            {collectMode ? 'Añadiendo palabras' : 'Añadir palabras'}
          </span>
          {collected.size > 0 && (
            <span className="collect-count">{collected.size}</span>
          )}
        </button>
        <div className="spacer" />
        {text.type === 'cloze' && (
          <button className="primary" onClick={onOpenQuiz}>
            Hacer el test →
          </button>
        )}
      </div>

      {collectMode && (
        <div className="collect-hint" role="status">
          Toca las palabras que no conoces. Se añadirán a «Por repasar».
        </div>
      )}

      <div className={`reader${collectMode ? ' collect-mode' : ''}`}>
        {text.paragraphs.map((para, pi) => (
          <p key={pi}>
            {renderParagraph(para, {
              revealed,
              text,
              collectMode,
              findWord,
              onWordClick,
            })}
          </p>
        ))}
      </div>

      {popup && (
        <WordPopup
          surface={popup.surface}
          anchor={popup.anchor}
          existing={existingForPopup}
          onClose={() => setPopup(null)}
          onSetState={handleSetState}
        />
      )}
    </>
  )
}

function renderParagraph(
  para: string,
  ctx: {
    revealed: boolean
    text: Text
    collectMode: boolean
    findWord: (s: string) => Word | null
    onWordClick: (
      surface: string,
      sentence: string,
      ev: React.MouseEvent<HTMLSpanElement>,
    ) => void
  },
) {
  const tokens = tokenize(para)
  const sentence = para.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const c = ctx.text.clozes?.find((c) => c.n === Number(n))
    return c ? c.options[c.answer] : `___${n}___`
  })

  return tokens.map((tok, i) => {
    if (tok.kind === 'space' || tok.kind === 'punct') {
      return <span key={i}>{tok.text}</span>
    }
    if (tok.kind === 'cloze') {
      const c = ctx.text.clozes?.find((c) => c.n === tok.n)
      if (ctx.revealed && c) {
        return (
          <span
            key={i}
            className="tok-cloze revealed"
            title={`hueco ${tok.n} — respuesta`}
          >
            {c.options[c.answer]}
          </span>
        )
      }
      return (
        <span key={i} className="tok-cloze" title={`hueco ${tok.n}`}>
          ({tok.n})
        </span>
      )
    }
    const word = ctx.findWord(tok.text)
    if (!word && !ctx.collectMode) return <span key={i}>{tok.text}</span>
    return (
      <span
        key={i}
        className={`tok-word st-${word?.state ?? 'untracked'}`}
        onClick={(ev) => ctx.onWordClick(tok.text, sentence, ev)}
      >
        {tok.text}
      </span>
    )
  })
}
