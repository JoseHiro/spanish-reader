import type { Text, ProgressMap } from '../types'
import { IconChevronRight, IconCheck } from './Icons'

export function Home({
  texts,
  progress,
  onOpenText,
}: {
  texts: Text[]
  progress: ProgressMap
  onOpenText: (text: Text) => void
}) {
  const completedCount = texts.filter((t) => progress[t.id]?.completed).length
  return (
    <>
      <h1>Textos</h1>
      <div className="subtitle">
        {texts.length} {texts.length === 1 ? 'texto' : 'textos'} ·{' '}
        {completedCount} completado{completedCount === 1 ? '' : 's'} · Toca las
        palabras para gestionar su estado
      </div>
      {texts.length === 0 && (
        <div className="empty">
          Aún no hay textos. Pídele a Claude que añada uno.
        </div>
      )}
      <div className="text-card-grid">
        {texts.map((t) => {
          const done = !!progress[t.id]?.completed
          return (
            <article
              key={t.id}
              className={'card text-card clickable' + (done ? ' done' : '')}
              onClick={() => onOpenText(t)}
            >
              <div className="text-card-heading">
                {done && (
                  <span className="done-mark" title="Completado">
                    <IconCheck size={11} strokeWidth={3} />
                  </span>
                )}
                <div className="title">{t.title}</div>
              </div>
              <div className="text-card-byline">
                {t.author && <span>{t.author}</span>}
                {t.source && <span>{t.source}</span>}
              </div>
              <div className="text-card-footer">
                <div className="meta">
                  {t.level && <span className="badge">{t.level}</span>}
                  {t.type === 'cloze' && (
                    <span className="badge">
                      {t.clozes?.length ?? 0} huecos
                    </span>
                  )}
                  {done && <span className="badge mastered">Completado</span>}
                </div>
                <button
                  className="text-card-open"
                  aria-label={`${t.title}を開く`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenText(t)
                  }}
                >
                  Abrir
                  <IconChevronRight size={13} strokeWidth={1.8} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
