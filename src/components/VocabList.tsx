import { useMemo, useState } from 'react'
import type { Word, WordState } from '../types'

type Filter = 'unknown' | 'probably_known' | 'mastered' | 'all'

export function VocabList({
  words,
  onWordUpdate,
}: {
  words: Word[]
  onWordUpdate: (w: Word) => void
}) {
  const [filter, setFilter] = useState<Filter>('unknown')

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

      <div className="filter-bar">
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
      </div>

      {filtered.length === 0 && (
        <div className="empty">No hay palabras que coincidan</div>
      )}

      {filtered.map((w) => (
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
