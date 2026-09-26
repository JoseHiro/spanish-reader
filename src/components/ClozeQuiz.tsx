import { useMemo, useState } from 'react'
import type * as React from 'react'
import type { Text, Word, WordState, QuizResult, Encounter } from '../types'
import { normalize, tokenize } from '../lib/tokenize'
import { findWordBySurface } from '../lib/words'
import { IconArrowLeft, IconCheck, IconX, IconListPlus } from './Icons'
import { WordPopup } from './WordPopup'
import { ArticleChunk } from './ArticleChunk'
import { QuizOption } from './QuizOption'
import { alignJapaneseTranslation, splitSpanishSentences } from '../lib/alignment'

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
    setPopup({
      surface,
      sentence,
      anchor: ev.currentTarget.getBoundingClientRect(),
    })
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

      <div className="quiz-tools">
        <button
          className={collectMode ? 'collect-toggle active' : 'collect-toggle'}
          aria-pressed={collectMode}
          onClick={() => {
            setCollectMode((active) => !active)
            setPopup(null)
          }}
        >
          <IconListPlus size={15} strokeWidth={2} />
          <span style={{ marginLeft: 6 }}>
            {collectMode ? 'Añadiendo palabras' : 'Añadir palabras'}
          </span>
          {collected.size > 0 && (
            <span className="collect-count">{collected.size}</span>
          )}
        </button>
        {collectMode && (
          <span className="collect-hint compact">
            Toca las palabras que no conoces.
          </span>
        )}
      </div>

      <div className={`reader${collectMode ? ' collect-mode' : ''}`}>
        {text.paragraphs.map((para, pi) => {
          const type = text.chunk_types?.[pi] ?? 'body'
          const sourceSegments =
            type === 'body' ? splitSpanishSentences(para) : [para]
          const translation = text.translation_ja?.[pi]
          return <ArticleChunk
            key={pi}
            type={type}
            submitted={submitted}
            content={renderQuizParagraph(para, text, {
                answers,
                submitted,
                collectMode,
                findWord,
                onWordClick,
                setAnswer: (n, i) => {
                  if (submitted) return
                  const next = [...answers]
                  next[n - 1] = i
                  setAnswers(next)
                },
              })}
            contentSegments={sourceSegments.map((segment) =>
              renderQuizParagraph(segment, text, {
                answers,
                submitted,
                collectMode,
                findWord,
                onWordClick,
                setAnswer: (n, i) => {
                  if (submitted) return
                  const next = [...answers]
                  next[n - 1] = i
                  setAnswers(next)
                },
              }),
            )}
            feedback={
              <ParagraphFeedback
                paragraph={para}
                text={text}
                answers={answers}
              />
            }
            translation={translation}
            translationSegments={
              translation
                ? alignJapaneseTranslation(translation, sourceSegments.length)
                : undefined
            }
          />
        })}
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
    collectMode: boolean
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
            if (!word && !ctx.collectMode) {
              return <span key={tokenIndex}>{tok.text}</span>
            }
            return (
              <span
                key={tokenIndex}
                className={`tok-word st-${word?.state ?? 'untracked'}`}
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
              <QuizOption
                key={i}
                className={cls}
                label={`${['a', 'b', 'c'][i]}) ${opt}`}
                meaningJa={c.option_meanings_ja?.[i]}
                submitted={ctx.submitted}
                onClick={() => ctx.setAnswer(n, i)}
              />
            )
          })}
        </span>
      </span>
    )
  })
}
