import type { Text, Word, Encounter, QuizResult } from '../types'

export function Dashboard({
  texts,
  words,
  encounters,
  quizResults,
}: {
  texts: Text[]
  words: Word[]
  encounters: Encounter[]
  quizResults: QuizResult[]
}) {
  const mastered = words.filter((w) => w.state === 'mastered').length
  const unknown = words.filter((w) => w.state === 'unknown').length
  const probably = words.filter((w) => w.state === 'probably_known').length

  const avgScore =
    quizResults.length === 0
      ? null
      : quizResults.reduce((s, r) => s + r.score / r.total, 0) /
        quizResults.length

  // Coverage per text: known words / total unique tokens (rough)
  const coverage = texts.map((t) => {
    const uniq = new Set<string>()
    const full = t.paragraphs.join(' ')
    for (const m of full.matchAll(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)) {
      uniq.add(m[0].toLowerCase())
    }
    let known = 0
    for (const w of uniq) {
      const wr = words.find((x) => x.lemma.toLowerCase() === w)
      if (wr && wr.state !== 'unknown') known++
    }
    return { title: t.title, total: uniq.size, known }
  })

  return (
    <>
      <h1>進捗</h1>

      <div className="stat-grid">
        <Stat label="マスター単語" value={mastered} />
        <Stat label="要復習" value={unknown} />
        <Stat label="たぶん既知" value={probably} />
        <Stat label="読解テキスト" value={texts.length} />
      </div>

      <h2>クイズ成績</h2>
      {quizResults.length === 0 ? (
        <div className="empty">まだクイズを解いていません</div>
      ) : (
        <>
          <div className="stat-grid">
            <Stat label="受験回数" value={quizResults.length} />
            <Stat
              label="平均正答率"
              value={avgScore !== null ? Math.round(avgScore * 100) + '%' : '-'}
            />
          </div>
          {quizResults
            .slice()
            .reverse()
            .slice(0, 5)
            .map((r) => {
              const t = texts.find((x) => x.id === r.text_id)
              return (
                <div key={r.id} className="word-row">
                  <div>
                    <div className="lemma">{t?.title ?? r.text_id}</div>
                    <div style={{ color: 'var(--nt-text-mute)', fontSize: 12 }}>
                      {new Date(r.taken_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div>
                    <div className="meaning">
                      {r.score} / {r.total} 正解
                    </div>
                  </div>
                  <div />
                </div>
              )
            })}
        </>
      )}

      <h2>テキストごとのカバー率</h2>
      {coverage.length === 0 ? (
        <div className="empty">テキストがありません</div>
      ) : (
        coverage.map((c) => (
          <div key={c.title} className="word-row">
            <div className="lemma">{c.title}</div>
            <div>
              <div style={{ height: 8, background: 'var(--nt-hover)', borderRadius: 4 }}>
                <div
                  style={{
                    width: `${c.total === 0 ? 0 : (c.known / c.total) * 100}%`,
                    height: '100%',
                    background: 'var(--nt-text)',
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--nt-text-mute)', marginTop: 4 }}>
                {c.known} / {c.total} 語 ·{' '}
                {c.total === 0 ? 0 : Math.round((c.known / c.total) * 100)}%
              </div>
            </div>
            <div />
          </div>
        ))
      )}

      <h2>タップ履歴（直近）</h2>
      {encounters.length === 0 ? (
        <div className="empty">まだタップされた単語はありません</div>
      ) : (
        encounters
          .slice()
          .reverse()
          .slice(0, 10)
          .map((e, i) => (
            <div key={i} className="word-row">
              <div className="lemma">{e.word_lemma}</div>
              <div className="meaning" style={{ fontStyle: 'italic' }}>
                {e.sentence.slice(0, 80)}
                {e.sentence.length > 80 ? '…' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--nt-text-mute)' }}>
                {new Date(e.tapped_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ))
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
