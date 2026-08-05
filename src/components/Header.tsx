import type { Word } from '../types'
import { IconChevronRight } from './Icons'

type Crumb = { label: string; onClick?: () => void }

export function Header({
  crumbs,
  words,
}: {
  crumbs: Crumb[]
  words: Word[]
}) {
  const unknown = words.filter((w) => w.state === 'unknown').length
  const mastered = words.filter((w) => w.state === 'mastered').length

  return (
    <header className="topbar">
      <nav className="crumbs" aria-label="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} className="crumb">
            {c.onClick ? (
              <button className="crumb-link" onClick={c.onClick}>
                {c.label}
              </button>
            ) : (
              <span className="crumb-current">{c.label}</span>
            )}
            {i < crumbs.length - 1 && (
              <IconChevronRight
                size={14}
                strokeWidth={1.8}
                className="crumb-sep"
              />
            )}
          </span>
        ))}
      </nav>

      <div className="topbar-stats">
        <StatPill label="por repasar" value={unknown} tone="yellow" />
        <StatPill label="dominadas" value={mastered} tone="green" />
      </div>
    </header>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'yellow' | 'green' | 'blue' | 'gray'
}) {
  return (
    <div className={`stat-pill tone-${tone}`}>
      <span className="v">{value}</span>
      <span className="l">{label}</span>
    </div>
  )
}
