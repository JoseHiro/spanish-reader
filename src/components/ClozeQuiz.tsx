import { useMemo, useState } from 'react'
import type { Text, Word, QuizResult } from '../types'
import { normalize } from '../lib/tokenize'

export function ClozeQuiz({
  text,
  onBack,
  onSaveResult,
  onWordUpdate,
  words,
}: {
  text: Text
  onBack: () => void
  onSaveResult: (r: QuizResult) => void
  onWordUpdate: (w: Word) => void
  words: Word[]
}) {
  const clozes = text.clozes ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => clozes.map(() => null),
  )
  const [submitted, setSubmitted] = useState(false)

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
    // demote all "wrong" words to unknown so they enter review
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
        ← 戻る
      </div>
      <h1>{text.title} — クイズ</h1>
      <div style={{ color: 'var(--nt-text-soft)', marginBottom: 20 }}>
        空欄に入る語を a / b / c から選んでください
      </div>

      <div className="reader">
        {text.paragraphs.map((para, pi) => (
          <p key={pi}>
            {renderQuizParagraph(para, text, {
              answers,
              submitted,
              setAnswer: (n, i) => {
                if (submitted) return
                const next = [...answers]
                next[n - 1] = i
                setAnswers(next)
              },
            })}
          </p>
        ))}
      </div>

      {!submitted && (
        <button
          className="primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          採点する（{answers.filter((a) => a !== null).length}/{clozes.length}）
        </button>
      )}

      {submitted && (
        <>
          <h2>
            結果: {score} / {clozes.length}
          </h2>
          <div style={{ color: 'var(--nt-text-soft)', marginBottom: 20 }}>
            間違えた設問の選択肢は自動的に「要復習」に登録しました。
          </div>
          {clozes.map((c, i) => {
            const chosen = answers[i]
            const isCorrect = chosen === c.answer
            return (
              <div key={c.n} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600 }}>
                  {c.n}. {isCorrect ? '✅' : '❌'}{' '}
                  <span style={{ color: 'var(--nt-text-soft)' }}>
                    正解: {['a', 'b', 'c'][c.answer]}) {c.options[c.answer]}
                    {chosen !== null && !isCorrect && (
                      <>
                        {' '}
                        · あなたの回答: {['a', 'b', 'c'][chosen]}){' '}
                        {c.options[chosen]}
                      </>
                    )}
                  </span>
                </div>
                {c.explanation && (
                  <div className="explanation">{c.explanation}</div>
                )}
              </div>
            )
          })}
        </>
      )}
    </>
  )
}

function renderQuizParagraph(
  para: string,
  text: Text,
  ctx: {
    answers: (number | null)[]
    submitted: boolean
    setAnswer: (n: number, i: number) => void
  },
) {
  const parts = para.split(/(\{\{\d+\}\})/g)
  return parts.map((part, idx) => {
    const m = part.match(/^\{\{(\d+)\}\}$/)
    if (!m) return <span key={idx}>{part}</span>
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
