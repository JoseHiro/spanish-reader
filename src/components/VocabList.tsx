import { useMemo, useState } from 'react'
import type { Text, Word, WordState } from '../types'
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'

type Filter = 'unknown' | 'probably_known' | 'mastered' | 'all'
type VocabKind = 'all' | 'expression'

export function filterVocabWords(
  words: Word[],
  lessonId: string,
  kind: VocabKind,
) {
  return words.filter(
    (word) =>
      (lessonId === 'all' || word.source_text_id === lessonId) &&
      (kind === 'all' || word.tags?.includes('expression')),
  )
}

export function VocabList({
  words,
  texts,
  onWordUpdate,
}: {
  words: Word[]
  texts: Text[]
  onWordUpdate: (w: Word) => void
}) {
  const [filter, setFilter] = useState<Filter>('unknown')
  const [lessonId, setLessonId] = useState('all')
  const [kind, setKind] = useState<VocabKind>('all')
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const scopeWords = useMemo(
    () => filterVocabWords(words, lessonId, kind),
    [words, lessonId, kind],
  )

  const dueWords = useMemo(() => {
    const now = Date.now()
    return scopeWords.filter(
      (word) =>
        word.meaning_ja &&
        (!word.srs || new Date(word.srs.due).getTime() <= now),
    )
  }, [scopeWords])
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
      filter === 'all'
        ? scopeWords
        : scopeWords.filter((w) => w.state === filter)
    return [...list].sort((a, b) => a.lemma.localeCompare(b.lemma))
  }, [scopeWords, filter])

  const counts = useMemo(() => {
    return {
      unknown: scopeWords.filter((w) => w.state === 'unknown').length,
      probably_known: scopeWords.filter((w) => w.state === 'probably_known').length,
      mastered: scopeWords.filter((w) => w.state === 'mastered').length,
      all: scopeWords.length,
    }
  }, [scopeWords])

  return (
    <>
      <h1>Vocabulario</h1>
      <div className="subtitle">
        {counts.all} palabras · {counts.unknown} por repasar ·{' '}
        {counts.probably_known} probables · {counts.mastered} dominadas
      </div>

      {!reviewing && (
        <div className="vocab-scope">
          <label>
            <span>Lección</span>
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="all">Todas las lecciones</option>
              {texts.map((text) => (
                <option key={text.id} value={text.id}>{text.title}</option>
              ))}
            </select>
          </label>
          <div className="vocab-kind" aria-label="Tipo de vocabulario">
            <button
              className={kind === 'all' ? 'active' : ''}
              onClick={() => setKind('all')}
            >
              Todo
            </button>
            <button
              className={kind === 'expression' ? 'active' : ''}
              onClick={() => setKind('expression')}
            >
              Expresiones
            </button>
          </div>
        </div>
      )}

      {!reviewing && dueWords.length > 0 && (
        <button className="primary review-start" onClick={() => {
          setReviewed(0)
          setRevealed(false)
          setReviewing(true)
        }}>
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
            {lessonId === 'all' && w.source_text_id && (
              <div className="word-source">
                {texts.find((text) => text.id === w.source_text_id)?.title}
              </div>
            )}
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
