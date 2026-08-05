import { useEffect, useRef, type CSSProperties } from 'react'
import type { Word, WordState } from '../types'

const POPOVER_W = 300

export function WordPopup({
  surface,
  anchor,
  existing,
  onClose,
  onSetState,
}: {
  surface: string
  anchor: DOMRect
  existing: Word | null
  onClose: () => void
  onSetState: (state: WordState) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      const k = e.key.toLowerCase()
      if (k === 'u' || e.key === 'Enter') {
        e.preventDefault()
        onSetState('unknown')
      } else if (k === 'k') {
        e.preventDefault()
        onSetState('mastered')
      } else if (k === 'p') {
        e.preventDefault()
        onSetState('probably_known')
      }
    }
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDown)
    }, 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      clearTimeout(t)
    }
  }, [onClose, onSetState])

  const gap = 6
  const spaceBelow = window.innerHeight - anchor.bottom
  const above = spaceBelow < 200
  const top = above ? Math.max(8, anchor.top - 8) : anchor.bottom + gap
  const left = Math.max(
    8,
    Math.min(
      window.innerWidth - POPOVER_W - 8,
      anchor.left + anchor.width / 2 - POPOVER_W / 2,
    ),
  )
  const style: CSSProperties = {
    position: 'fixed',
    top,
    left,
    width: POPOVER_W,
    transform: above ? 'translateY(-100%)' : undefined,
    zIndex: 100,
  }

  return (
    <div ref={ref} className="popover" style={style} role="dialog">
      <div className="lemma">{existing?.lemma ?? surface}</div>
      {existing?.pos && <div className="pos">{existing.pos}</div>}
      {existing?.meaning_ja ? (
        <div className="meaning">{existing.meaning_ja}</div>
      ) : (
        <div className="meaning muted">Sin datos de significado</div>
      )}
      {existing?.example && <div className="example">{existing.example}</div>}
      <div className="action-row">
        <button className="primary" onClick={() => onSetState('unknown')}>
          No lo sé
          <span className="kbd">U</span>
        </button>
        <button onClick={() => onSetState('mastered')}>
          Lo sé
          <span className="kbd">K</span>
        </button>
      </div>
      <div className="hint">Enter para confirmar · Esc para cerrar</div>
    </div>
  )
}
