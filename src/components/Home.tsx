import type { Text } from '../types'

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
      <h1>読解教材</h1>
      <div style={{ color: 'var(--nt-text-soft)', marginBottom: 24 }}>
        {texts.length} 本 · 単語をタップして意味・記憶ステートを管理
      </div>
      {texts.length === 0 && (
        <div className="empty">
          まだテキストがありません。Claudeに追加してもらってください。
        </div>
      )}
      {texts.map((t) => (
        <div key={t.id} className="card" onClick={() => onOpenRead(t.id)}>
          <div style={{ fontWeight: 600, fontSize: 17 }}>{t.title}</div>
          <div className="meta">
            {t.author && <>{t.author} · </>}
            {t.source && <>{t.source} · </>}
            {t.level && <span className="badge">{t.level}</span>}
            {t.type === 'cloze' && (
              <span className="badge">クローズ {t.clozes?.length ?? 0}問</span>
            )}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenRead(t.id)
              }}
            >
              読む
            </button>
            {t.type === 'cloze' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenQuiz(t.id)
                }}
              >
                クイズ
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
