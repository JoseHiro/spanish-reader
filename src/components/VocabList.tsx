import { useMemo, useState } from 'react'
import type { Encounter, Text, Word, WordState } from '../types'
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { getWordExamples } from '../lib/examples'
import { buildReviewQueue, requeueAfterAgain } from '../lib/reviewQueue'
import { IconCheck, IconCopy } from './Icons'

type Filter = 'unknown' | 'probably_known' | 'mastered' | 'all'
type VocabKind = 'all' | 'expression'
type Collection = 'reader' | 'thematic'

export function filterVocabWords(
  words: Word[],
  lessonId: string,
  kind: VocabKind,
  collection: Collection = 'reader',
) {
  return words.filter(
    (word) =>
      (collection === 'reader'
        ? !word.collection_id &&
          (lessonId === 'all' || word.source_text_id === lessonId)
        : word.collection_id === 'thematic_vocab' &&
          (lessonId === 'all' || word.chapter_id === lessonId)) &&
      (kind === 'all' || word.tags?.includes('expression')),
  )
}

export function VocabList({
  words,
  texts,
  encounters,
  onWordUpdate,
}: {
  words: Word[]
  texts: Text[]
  encounters: Encounter[]
  onWordUpdate: (w: Word) => void
}) {
  const [filter, setFilter] = useState<Filter>('unknown')
  const [collection, setCollection] = useState<Collection>('reader')
  const [lessonId, setLessonId] = useState('all')
  const [kind, setKind] = useState<VocabKind>('all')
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [reviewQueue, setReviewQueue] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const scopeWords = useMemo(
    () => filterVocabWords(words, lessonId, kind, collection),
    [words, lessonId, kind, collection],
  )
  const thematicChapters = useMemo(() => {
    const chapters = new Map<string, string>()
    words.forEach((word) => {
      if (word.collection_id === 'thematic_vocab' && word.chapter_id) {
        chapters.set(word.chapter_id, word.chapter_title ?? word.chapter_id)
      }
    })
    return [...chapters.entries()]
  }, [words])

  const dueWords = useMemo(() => {
    const now = Date.now()
    return scopeWords.filter(
      (word) =>
        word.meaning_ja &&
        (!word.srs || new Date(word.srs.due).getTime() <= now),
    )
  }, [scopeWords])
  const unknownWords = useMemo(
    () => scopeWords.filter((word) => word.state === 'unknown'),
    [scopeWords],
  )
  const current = words.find((word) => word.lemma === reviewQueue[0])
  const currentExamples = useMemo(
    () => (current ? getWordExamples(current, texts) : []),
    [current, texts],
  )

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
    setReviewQueue((queue) =>
      rating === Rating.Again ? requeueAfterAgain(queue) : queue.slice(1),
    )
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

  async function copyForAi() {
    const prompt = buildAiVocabularyPrompt(unknownWords, texts, encounters)
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <h1>Vocabulario</h1>
      <div className="subtitle">
        {counts.all} palabras · {counts.unknown} por repasar ·{' '}
        {counts.probably_known} probables · {counts.mastered} dominadas
      </div>

      {!reviewing && (
        <div className="collection-switch" aria-label="Colección de vocabulario">
          <button
            className={collection === 'reader' ? 'active' : ''}
            onClick={() => { setCollection('reader'); setLessonId('all') }}
          >
            Textos
          </button>
          <button
            className={collection === 'thematic' ? 'active' : ''}
            onClick={() => { setCollection('thematic'); setLessonId('all') }}
          >
            Vocabulario temático
          </button>
        </div>
      )}

      {!reviewing && (
        <div className="vocab-scope">
          <label>
            <span>{collection === 'reader' ? 'Lección' : 'Capítulo'}</span>
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="all">
                {collection === 'reader' ? 'Todas las lecciones' : 'Todos los capítulos'}
              </option>
              {collection === 'reader'
                ? texts.map((text) => (
                    <option key={text.id} value={text.id}>{text.title}</option>
                  ))
                : thematicChapters.map(([id, title]) => (
                    <option key={id} value={id}>{title}</option>
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

      {!reviewing && (dueWords.length > 0 || unknownWords.length > 0) && (
        <div className="vocab-actions">
          {dueWords.length > 0 && (
            <button className="primary review-start" onClick={() => {
              setReviewed(0)
              setRevealed(false)
              setReviewQueue(buildReviewQueue(dueWords))
              setReviewing(true)
            }}>
              Repasar ahora ({dueWords.length})
            </button>
          )}
          {unknownWords.length > 0 && (
            <button className="copy-ai" onClick={copyForAi}>
              {copied ? (
                <IconCheck size={15} strokeWidth={2.2} />
              ) : (
                <IconCopy size={15} strokeWidth={1.9} />
              )}
              <span>{copied ? 'Copiado' : `Copiar para IA (${unknownWords.length})`}</span>
            </button>
          )}
        </div>
      )}

      {reviewing && current && (
        <div className="review-session">
          <div className="review-progress">
            {reviewed} respuestas · {reviewQueue.length} pendientes
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
                {currentExamples.length > 0 && (
                  <div className="review-examples">
                    <div className="review-examples-title">Ejemplos</div>
                    <ol>
                      {currentExamples.map((example, index) => (
                        <li key={`${example.spanish}-${index}`}>
                          <div className="review-example-es">{example.spanish}</div>
                          <div className="review-example-ja">{example.japanese}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
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
          <button className="review-exit" onClick={() => {
            setReviewQueue([])
            setReviewing(false)
          }}>
            Terminar sesión
          </button>
        </div>
      )}

      {reviewing && !current && (
        <div className="review-complete">
          <h2>¡Repaso terminado!</h2>
          <div className="subtitle">Has completado {reviewed} respuestas.</div>
          <button onClick={() => {
            setReviewQueue([])
            setReviewing(false)
          }}>Volver a la lista</button>
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
            {collection === 'reader' && lessonId === 'all' && w.source_text_id && (
              <div className="word-source">
                {texts.find((text) => text.id === w.source_text_id)?.title}
              </div>
            )}
            {collection === 'thematic' && lessonId === 'all' && (
              <div className="word-source">{w.chapter_title}</div>
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

export function buildAiVocabularyPrompt(
  words: Word[],
  texts: Text[],
  encounters: Encounter[],
): string {
  const lessonTitles = new Map(texts.map((text) => [text.id, text.title]))
  const lines = words.map((word, index) => {
    const contexts = Array.from(
      new Set(
        encounters
          .filter((encounter) => encounter.word_lemma === word.lemma)
          .map((encounter) => encounter.sentence.trim())
          .filter(Boolean),
      ),
    )
    const details = [
      `${index + 1}. ${word.lemma}${word.pos ? `（${word.pos}）` : ''}`,
      word.meaning_ja ? `   現在の意味: ${word.meaning_ja}` : null,
      word.source_text_id && lessonTitles.get(word.source_text_id)
        ? `   出典: ${lessonTitles.get(word.source_text_id)}`
        : null,
      ...contexts.slice(0, 2).map((sentence) => `   文脈: ${sentence}`),
    ]
    return details.filter(Boolean).join('\n')
  })

  return [
    '以下はスペイン語学習中に分からなかった単語です。',
    '各語について、見出し語・品詞・自然な日本語の意味・文脈での意味やニュアンスを確認し、自然なスペイン語の例文を2つと各日本語訳を作ってください。誤った見出し語や意味があれば訂正してください。',
    '',
    ...lines,
  ].join('\n')
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
