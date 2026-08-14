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
      {texts.map((t) => {
        const done = !!progress[t.id]?.completed
        return (
          <div
            key={t.id}
            className={'card clickable' + (done ? ' done' : '')}
            onClick={() => onOpenText(t)}
          >
            <div
              className="title"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {done && (
                <span className="done-mark" title="Completado">
                  <IconCheck size={12} strokeWidth={3} />
                </span>
              )}
              <span>{t.title}</span>
            </div>
            <div className="meta">
              {t.author && <span>{t.author}</span>}
              {t.source && <span>· {t.source}</span>}
              {t.level && <span className="badge">{t.level}</span>}
              {t.type === 'cloze' && (
                <span className="badge">
                  {t.clozes?.length ?? 0} huecos
                </span>
              )}
              {done && (
                <span className="badge mastered">Completado</span>
              )}
            </div>
            <div className="actions">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenText(t)
                }}
              >
                Abrir
                <IconChevronRight size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}
