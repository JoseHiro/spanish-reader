import { useMemo, useState } from 'react'
import type { Word, WordState } from '../types'
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'

type Filter = 'unknown' | 'probably_known' | 'mastered' | 'all'

export function VocabList({
  words,
  onWordUpdate,
}: {
  words: Word[]
  onWordUpdate: (w: Word) => void
}) {
  const [filter, setFilter] = useState<Filter>('unknown')
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const dueWords = useMemo(() => {
    const now = Date.now()
    return words.filter(
      (word) =>
        word.meaning_ja &&
        (word.state === 'unknown' ||
          !word.srs ||
          new Date(word.srs.due).getTime() <= now),
    )
  }, [words])
  const current = dueWords[0]

  function grade(rating: Grade) {
    if (!current) return
    const now = new Date()
    const card: Card = current.srs
      ? {
          ...current.srs,
          due: new Date(current.srs.due),
          last_review: current.srs.last_review
            ? new Date(current.srs.last_review)
            : undefined,
          state: current.srs.state,
        }
      : createEmptyCard(now)
    const result = fsrs().next(card, now, rating).card
    onWordUpdate({
      ...current,
      state:
        rating === Rating.Again
          ? 'unknown'
          : rating === Rating.Hard
            ? 'probably_known'
            : 'mastered',
      srs: {
        due: result.due.toISOString(),
        stability: result.stability,
        difficulty: result.difficulty,
        elapsed_days: result.elapsed_days,
        scheduled_days: result.scheduled_days,
        reps: result.reps,
        lapses: result.lapses,
        state: result.state,
        last_review: result.last_review?.toISOString(),
      },
    })
    setReviewed((count) => count + 1)
    setRevealed(false)
  }

  const filtered = useMemo(() => {
    const list =
      filter === 'all' ? words : words.filter((w) => w.state === filter)
    return [...list].sort((a, b) => a.lemma.localeCompare(b.lemma))
  }, [words, filter])

  const counts = useMemo(() => {
    return {
      unknown: words.filter((w) => w.state === 'unknown').length,
      probably_known: words.filter((w) => w.state === 'probably_known').length,
      mastered: words.filter((w) => w.state === 'mastered').length,
      all: words.length,
    }
  }, [words])

  return (
    <>
      <h1>Vocabulario</h1>
      <div className="subtitle">
        {counts.all} palabras · {counts.unknown} por repasar ·{' '}
        {counts.probably_known} probables · {counts.mastered} dominadas
      </div>

      {!reviewing && dueWords.length > 0 && (
        <button className="primary review-start" onClick={() => setReviewing(true)}>
          Repasar ahora ({dueWords.length})
        </button>
      )}

      {reviewing && current && (
        <div className="review-session">
          <div className="review-progress">
            {reviewed} repasadas · {dueWords.length} pendientes
          </div>
          <div className="review-card">
            <div className="review-lemma">{current.lemma}</div>
            {current.pos && <div className="review-pos">{current.pos}</div>}
            {!revealed ? (
              <button className="primary" onClick={() => setRevealed(true)}>
                Mostrar respuesta
              </button>
            ) : (
              <>
                <div className="review-answer">{current.meaning_ja}</div>
                {current.example && (
                  <div className="review-example">{current.example}</div>
                )}
                <div className="review-grades">
                  <button onClick={() => grade(Rating.Again)}>Otra vez</button>
                  <button onClick={() => grade(Rating.Hard)}>Difícil</button>
                  <button onClick={() => grade(Rating.Good)}>Bien</button>
                  <button onClick={() => grade(Rating.Easy)}>Fácil</button>
                </div>
              </>
            )}
          </div>
          <button className="review-exit" onClick={() => setReviewing(false)}>
            Terminar sesión
          </button>
        </div>
      )}

      {reviewing && !current && (
        <div className="review-complete">
          <h2>¡Repaso terminado!</h2>
          <div className="subtitle">Has repasado {reviewed} palabras.</div>
          <button onClick={() => setReviewing(false)}>Volver a la lista</button>
        </div>
      )}

      {!reviewing && <div className="filter-bar">
        {(
          [
            ['unknown', `Por repasar (${counts.unknown})`],
            ['probably_known', `Probable (${counts.probably_known})`],
            ['mastered', `Dominadas (${counts.mastered})`],
            ['all', `Todas (${counts.all})`],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            className={filter === k ? 'active' : ''}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>}

      {!reviewing && filtered.length === 0 && (
        <div className="empty">No hay palabras que coincidan</div>
      )}

      {!reviewing && filtered.map((w) => (
        <div key={w.lemma} className="word-row">
          <div>
            <div className="lemma">{w.lemma}</div>
            <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>
              {w.pos}
            </div>
          </div>
          <div>
            <div className="meaning">{w.meaning_ja ?? 'Sin significado'}</div>
            {w.example && (
              <div
                style={{
                  color: 'var(--text-mute)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  marginTop: 2,
                }}
              >
                {w.example}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <StatePicker
              state={w.state}
              onChange={(s) => onWordUpdate({ ...w, state: s })}
            />
          </div>
        </div>
      ))}
    </>
  )
}

function StatePicker({
  state,
  onChange,
}: {
  state: WordState
  onChange: (s: WordState) => void
}) {
  return (
    <select
      value={state}
      onChange={(e) => onChange(e.target.value as WordState)}
    >
      <option value="unknown">Por repasar</option>
      <option value="probably_known">Probable</option>
      <option value="mastered">Dominada</option>
    </select>
  )
}
