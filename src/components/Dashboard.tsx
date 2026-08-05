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
      <h1>Progreso</h1>

      <div className="stat-grid">
        <Stat label="Dominadas" value={mastered} />
        <Stat label="Por repasar" value={unknown} />
        <Stat label="Probables" value={probably} />
        <Stat label="Textos" value={texts.length} />
      </div>

      <h2>Resultados de tests</h2>
      {quizResults.length === 0 ? (
        <div className="empty">Aún no has hecho ningún test</div>
      ) : (
        <>
          <div className="stat-grid">
            <Stat label="Tests realizados" value={quizResults.length} />
            <Stat
              label="Puntuación media"
              value={
                avgScore !== null ? Math.round(avgScore * 100) + '%' : '—'
              }
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
                    <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>
                      {new Date(r.taken_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                  <div>
                    <div className="meaning">
                      {r.score} / {r.total} correctas
                    </div>
                  </div>
                  <div />
                </div>
              )
            })}
        </>
      )}

      <h2>Cobertura por texto</h2>
      {coverage.length === 0 ? (
        <div className="empty">Sin textos</div>
      ) : (
        coverage.map((c) => (
          <div key={c.title} className="word-row">
            <div className="lemma">{c.title}</div>
            <div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${c.total === 0 ? 0 : (c.known / c.total) * 100}%`,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-mute)',
                  marginTop: 4,
                }}
              >
                {c.known} / {c.total} palabras ·{' '}
                {c.total === 0 ? 0 : Math.round((c.known / c.total) * 100)}%
              </div>
            </div>
            <div />
          </div>
        ))
      )}

      <h2>Palabras recientes</h2>
      {encounters.length === 0 ? (
        <div className="empty">Aún no has tocado ninguna palabra</div>
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
              <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>
                {new Date(e.tapped_at).toLocaleDateString('es-ES')}
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
