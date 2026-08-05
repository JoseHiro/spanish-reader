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
      <h1>単語帳</h1>
      <div style={{ color: 'var(--nt-text-soft)', marginBottom: 16 }}>
        合計 {counts.all} 語 · 要復習 {counts.unknown} · たぶん既知{' '}
        {counts.probably_known} · マスター {counts.mastered}
      </div>

      <div className="filter-bar">
        {(
          [
            ['unknown', `要復習 (${counts.unknown})`],
            ['probably_known', `たぶん (${counts.probably_known})`],
            ['mastered', `マスター (${counts.mastered})`],
            ['all', `すべて (${counts.all})`],
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
        <div className="empty">該当する単語がありません</div>
      )}

      {filtered.map((w) => (
        <div key={w.lemma} className="word-row">
          <div>
            <div className="lemma">{w.lemma}</div>
            <div style={{ color: 'var(--nt-text-mute)', fontSize: 12 }}>
              {w.pos}
            </div>
          </div>
          <div>
            <div className="meaning">{w.meaning_ja ?? '意味未登録'}</div>
            {w.example && (
              <div
                style={{
                  color: 'var(--nt-text-mute)',
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
            <StatePicker state={w.state} onChange={(s) => onWordUpdate({ ...w, state: s })} />
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
      style={{
        border: '1px solid var(--nt-border)',
        borderRadius: 4,
        padding: '4px 8px',
        background: 'var(--nt-bg)',
        color: 'var(--nt-text)',
        fontSize: 13,
      }}
    >
      <option value="unknown">要復習</option>
      <option value="probably_known">たぶん既知</option>
      <option value="mastered">マスター</option>
    </select>
  )
}
