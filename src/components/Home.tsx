import type { Text } from '../types'
import { IconChevronRight } from './Icons'

export function Home({
  texts,
  onOpenRead,
  onOpenQuiz,
}: {
  texts: Text[]
  onOpenRead: (id: string) => void
  onOpenQuiz: (id: string) => void
}) {
  return (
    <>
      <h1>Textos</h1>
      <div className="subtitle">
        {texts.length} {texts.length === 1 ? 'texto' : 'textos'} · Toca las
        palabras para gestionar su estado
      </div>
      {texts.length === 0 && (
        <div className="empty">
          Aún no hay textos. Pídele a Claude que añada uno.
        </div>
      )}
      {texts.map((t) => (
        <div
          key={t.id}
          className="card clickable"
          onClick={() => onOpenRead(t.id)}
        >
          <div className="title">{t.title}</div>
          <div className="meta">
            {t.author && <span>{t.author}</span>}
            {t.source && <span>· {t.source}</span>}
            {t.level && <span className="badge">{t.level}</span>}
            {t.type === 'cloze' && (
              <span className="badge">
                {t.clozes?.length ?? 0} huecos
              </span>
            )}
          </div>
          <div className="actions">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenRead(t.id)
              }}
            >
              Leer
              <IconChevronRight size={14} strokeWidth={1.8} />
            </button>
            {t.type === 'cloze' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenQuiz(t.id)
                }}
              >
                Test
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
