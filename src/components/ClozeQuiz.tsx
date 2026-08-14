import { useMemo, useState } from 'react'
import type * as React from 'react'
import type { Text, Word, WordState, QuizResult, Encounter } from '../types'
import { normalize, tokenize } from '../lib/tokenize'
import { findWordBySurface } from '../lib/words'
import { IconArrowLeft, IconCheck, IconX } from './Icons'
import { WordPopup } from './WordPopup'

export function ClozeQuiz({
  text,
  completed,
  onBack,
  onSaveResult,
  onWordUpdate,
  onEncounter,
  onMarkCompleted,
  words,
}: {
  text: Text
  completed: boolean
  onBack: () => void
  onSaveResult: (r: QuizResult) => void
  onWordUpdate: (w: Word) => void
  onEncounter: (e: Encounter) => void
  onMarkCompleted: () => void
  words: Word[]
}) {
  const clozes = text.clozes ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    clozes.map(() => null),
  )
  const [submitted, setSubmitted] = useState(false)
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
    setPopup({
      surface,
      sentence,
      anchor: ev.currentTarget.getBoundingClientRect(),
    })
  }

  function handleSetState(state: WordState) {
    if (!popup) return
    const existing = findWord(popup.surface)
    const lemma = existing?.lemma ?? popup.surface.toLowerCase()
    onWordUpdate(
      existing
        ? { ...existing, state }
        : { lemma, state, source_text_id: text.id, tags: ['tapped'] },
    )
    if (state === 'unknown') {
      onEncounter({
        word_lemma: lemma,
        text_id: text.id,
        sentence: popup.sentence,
        tapped_at: new Date().toISOString(),
      })
    }
    setPopup(null)
  }

  const allAnswered = answers.every((a) => a !== null)
  const score = useMemo(
    () =>
      answers.reduce<number>(
        (acc, a, i) => (a === clozes[i].answer ? acc + 1 : acc),
        0,
      ),
    [answers, clozes],
  )

  async function handleSubmit() {
    setSubmitted(true)
    const wrongWords: string[] = []
    for (let i = 0; i < clozes.length; i++) {
      const c = clozes[i]
      if (answers[i] !== c.answer) {
        const chosen = answers[i]
        if (chosen !== null) wrongWords.push(c.options[chosen])
        wrongWords.push(c.options[c.answer])
      }
    }
    for (const w of wrongWords) {
      const existing = words.find(
        (x) => normalize(x.lemma) === normalize(w),
      )
      if (existing) {
        onWordUpdate({ ...existing, state: 'unknown' })
      } else {
        onWordUpdate({
          lemma: w.toLowerCase(),
          state: 'unknown',
          source_text_id: text.id,
          tags: ['quiz_wrong'],
        })
      }
    }

    onSaveResult({
      id: `qr_${Date.now()}`,
      text_id: text.id,
      score: score as number,
      total: clozes.length,
      answers,
      wrong_words: Array.from(new Set(wrongWords)),
      taken_at: new Date().toISOString(),
    })
  }

  return (
    <>
      <div className="back-link" onClick={onBack}>
        <IconArrowLeft size={14} strokeWidth={1.8} />
        Volver
      </div>
      <h1>{text.title}</h1>
      <div className="subtitle">
        Elige una opción para cada hueco · Toca cualquier palabra para ver su significado
      </div>

      <div className="reader">
        {text.paragraphs.map((para, pi) => (
          <div
            className={`quiz-paragraph${submitted ? ' with-feedback' : ''}`}
            key={pi}
          >
            <p>
              {renderQuizParagraph(para, text, {
                answers,
                submitted,
                findWord,
                onWordClick,
                setAnswer: (n, i) => {
                  if (submitted) return
                  const next = [...answers]
                  next[n - 1] = i
                  setAnswers(next)
                },
              })}
            </p>
            {submitted && (
              <ParagraphFeedback
                paragraph={para}
                text={text}
                answers={answers}
              />
            )}
            {submitted && text.translation_ja?.[pi] && (
              <div className="chunk-translation-ja">
                {text.translation_ja[pi]}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          className="primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          Calificar ({answers.filter((a) => a !== null).length}/{clozes.length})
        </button>
      )}

      {submitted && (
        <>
          <h2>
            Resultado: {score} / {clozes.length}
          </h2>
          <div className="subtitle">
            Las opciones de los huecos incorrectos se han marcado como
            「要復習」automáticamente.
          </div>
          <div style={{ marginBottom: 24 }}>
            {score === clozes.length && !completed && (
              <button
                className="primary"
                onClick={onMarkCompleted}
                style={{ marginRight: 8 }}
              >
                <IconCheck size={14} strokeWidth={2.2} />
                <span style={{ marginLeft: 4 }}>
                  ¡Perfecto! Marcar como completado
                </span>
              </button>
            )}
            {score < clozes.length && !completed && (
              <button onClick={onMarkCompleted}>
                <IconCheck size={14} strokeWidth={2.2} />
                <span style={{ marginLeft: 4 }}>Marcar como completado</span>
              </button>
            )}
            {completed && (
              <button className="done-btn" onClick={onMarkCompleted}>
                <IconCheck size={14} strokeWidth={2.2} />
                <span style={{ marginLeft: 4 }}>Completado</span>
              </button>
            )}
          </div>
        </>
      )}
      {popup && (
        <WordPopup
          surface={popup.surface}
          anchor={popup.anchor}
          existing={findWord(popup.surface)}
          onClose={() => setPopup(null)}
          onSetState={handleSetState}
        />
      )}
    </>
  )
}

function ParagraphFeedback({
  paragraph,
  text,
  answers,
}: {
  paragraph: string
  text: Text
  answers: (number | null)[]
}) {
  const numbers = Array.from(paragraph.matchAll(/\{\{(\d+)\}\}/g), (m) =>
    Number(m[1]),
  )
  const clozes = numbers
    .map((n) => text.clozes?.find((c) => c.n === n))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  if (clozes.length === 0) return null

  return (
    <div className="paragraph-feedback" aria-label="Respuestas y explicaciones">
      {clozes.map((c) => {
        const chosen = answers[c.n - 1]
        const isCorrect = chosen === c.answer
        return (
          <div className="feedback-item" key={c.n}>
            <div className="feedback-answer">
              <span>{c.n}.</span>
              {isCorrect ? (
                <IconCheck size={16} strokeWidth={2.4} color="var(--green-fg)" />
              ) : (
                <IconX size={16} strokeWidth={2.4} color="var(--red-fg)" />
              )}
              <span>
                Respuesta: {['a', 'b', 'c'][c.answer]}) {c.options[c.answer]}
                {chosen !== null && !isCorrect && (
                  <>
                    {' · '}Tu respuesta: {['a', 'b', 'c'][chosen]}){' '}
                    {c.options[chosen]}
                  </>
                )}
              </span>
            </div>
            {c.explanation && <div className="explanation">{c.explanation}</div>}
          </div>
        )
      })}
    </div>
  )
}

function renderQuizParagraph(
  para: string,
  text: Text,
  ctx: {
    answers: (number | null)[]
    submitted: boolean
    findWord: (s: string) => Word | null
    onWordClick: (
      surface: string,
      sentence: string,
      ev: React.MouseEvent<HTMLSpanElement>,
    ) => void
    setAnswer: (n: number, i: number) => void
  },
) {
  const parts = para.split(/(\{\{\d+\}\})/g)
  const sentence = para.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const c = text.clozes?.find((c) => c.n === Number(n))
    return c ? c.options[c.answer] : `___${n}___`
  })
  return parts.map((part, idx) => {
    const m = part.match(/^\{\{(\d+)\}\}$/)
    if (!m) {
      return (
        <span key={idx}>
          {tokenize(part).map((tok, tokenIndex) => {
            if (tok.kind !== 'word') {
              return <span key={tokenIndex}>{'text' in tok ? tok.text : ''}</span>
            }
            const word = ctx.findWord(tok.text)
            if (!word) return <span key={tokenIndex}>{tok.text}</span>
            return (
              <span
                key={tokenIndex}
                className={`tok-word st-${word.state}`}
                onClick={(ev) => ctx.onWordClick(tok.text, sentence, ev)}
              >
                {tok.text}
              </span>
            )
          })}
        </span>
      )
    }
    const n = parseInt(m[1], 10)
    const c = text.clozes?.find((x) => x.n === n)
    if (!c) return <span key={idx}>{part}</span>
    const chosen = ctx.answers[n - 1]
    return (
      <span key={idx} style={{ display: 'inline-block', margin: '0 4px' }}>
        <span
          className={
            'tok-cloze ' +
            (chosen !== null
              ? ctx.submitted
                ? chosen === c.answer
                  ? 'correct'
                  : 'wrong'
                : 'filled'
              : '')
          }
        >
          {chosen !== null ? c.options[chosen] : `(${n})`}
        </span>{' '}
        <span className="cloze-options">
          {c.options.map((opt, i) => {
            let cls = 'cloze-option'
            if (chosen === i) cls += ' selected'
            if (ctx.submitted) {
              if (i === c.answer) cls = 'cloze-option correct'
              else if (chosen === i) cls = 'cloze-option wrong'
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => ctx.setAnswer(n, i)}
                disabled={ctx.submitted}
              >
                {['a', 'b', 'c'][i]}) {opt}
              </button>
            )
          })}
        </span>
      </span>
    )
  })
}
