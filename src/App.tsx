import { useEffect, useState } from 'react'
import { api } from './lib/api'
import type { Text, Word, Encounter, QuizResult } from './types'
import { Home } from './components/Home'
import { TextReader } from './components/TextReader'
import { ClozeQuiz } from './components/ClozeQuiz'
import { VocabList } from './components/VocabList'
import { Dashboard } from './components/Dashboard'
import {
  IconRead,
  IconVocab,
  IconChart,
  IconSun,
  IconMoon,
  IconMonitor,
} from './components/Icons'
import { useTheme, type ThemeMode } from './lib/theme'

type View =
  | { name: 'home' }
  | { name: 'read'; textId: string }
  | { name: 'quiz'; textId: string }
  | { name: 'vocab' }
  | { name: 'dashboard' }

export function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [texts, setTexts] = useState<Text[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const { mode, setMode } = useTheme()

  async function reloadAll() {
    try {
      const [t, w, e, q] = await Promise.all([
        api.getTexts(),
        api.getWords(),
        api.getEncounters(),
        api.getQuizResults(),
      ])
      setTexts(t.texts)
      setWords(w.words)
      setEncounters(e.encounters)
      setQuizResults(q.results)
      setLoading(false)
    } catch (e: any) {
      setErr(e.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadAll()
  }, [])

  async function updateWord(updated: Word) {
    const next = [...words]
    const idx = next.findIndex((w) => w.lemma === updated.lemma)
    if (idx >= 0) next[idx] = updated
    else next.push(updated)
    setWords(next)
    await api.putWords({ words: next })
  }

  async function addEncounter(e: Encounter) {
    const next = [...encounters, e]
    setEncounters(next)
    await api.putEncounters({ encounters: next })
  }

  async function saveQuizResult(r: QuizResult) {
    const next = [...quizResults, r]
    setQuizResults(next)
    await api.putQuizResults({ results: next })
  }

  const currentText =
    view.name === 'read' || view.name === 'quiz'
      ? texts.find((t) => t.id === view.textId)
      : undefined

  const navItems: {
    key: View['name']
    label: string
    icon: JSX.Element
    active: boolean
    onClick: () => void
  }[] = [
    {
      key: 'home',
      label: 'Leer',
      icon: <IconRead size={18} strokeWidth={1.8} />,
      active:
        view.name === 'home' || view.name === 'read' || view.name === 'quiz',
      onClick: () => setView({ name: 'home' }),
    },
    {
      key: 'vocab',
      label: 'Vocabulario',
      icon: <IconVocab size={18} strokeWidth={1.8} />,
      active: view.name === 'vocab',
      onClick: () => setView({ name: 'vocab' }),
    },
    {
      key: 'dashboard',
      label: 'Progreso',
      icon: <IconChart size={18} strokeWidth={1.8} />,
      active: view.name === 'dashboard',
      onClick: () => setView({ name: 'dashboard' }),
    },
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SR</div>
          <div>Spanish Reader</div>
        </div>

        <div className="nav-section">Estudio</div>
        <div className="nav">
          {navItems.map((n) => (
            <button
              key={n.key}
              className={'nav-item ' + (n.active ? 'active' : '')}
              onClick={n.onClick}
            >
              <span className="ic">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div className="sidebar-foot">
          <div className="nav-section" style={{ padding: '0 4px 6px' }}>
            Tema
          </div>
          <ThemeControl mode={mode} setMode={setMode} />
        </div>
      </aside>

      <main className="main">
        <div className="container">
          {err && (
            <div className="empty" style={{ color: 'var(--red-fg)' }}>
              {err}
            </div>
          )}
          {loading && <div className="empty">Cargando…</div>}

          {!loading && !err && (
            <>
              {view.name === 'home' && (
                <Home
                  texts={texts}
                  onOpenRead={(id) => setView({ name: 'read', textId: id })}
                  onOpenQuiz={(id) => setView({ name: 'quiz', textId: id })}
                />
              )}
              {view.name === 'read' && currentText && (
                <TextReader
                  text={currentText}
                  words={words}
                  onBack={() => setView({ name: 'home' })}
                  onOpenQuiz={() =>
                    setView({ name: 'quiz', textId: currentText.id })
                  }
                  onWordUpdate={updateWord}
                  onEncounter={addEncounter}
                />
              )}
              {view.name === 'quiz' && currentText && (
                <ClozeQuiz
                  text={currentText}
                  onBack={() =>
                    setView({ name: 'read', textId: currentText.id })
                  }
                  onSaveResult={saveQuizResult}
                  onWordUpdate={updateWord}
                  words={words}
                />
              )}
              {view.name === 'vocab' && (
                <VocabList words={words} onWordUpdate={updateWord} />
              )}
              {view.name === 'dashboard' && (
                <Dashboard
                  texts={texts}
                  words={words}
                  encounters={encounters}
                  quizResults={quizResults}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function ThemeControl({
  mode,
  setMode,
}: {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
}) {
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema">
      <button
        className={mode === 'light' ? 'active' : ''}
        onClick={() => setMode('light')}
        aria-label="Claro"
        title="Claro"
      >
        <IconSun size={14} strokeWidth={1.8} />
      </button>
      <button
        className={mode === 'system' ? 'active' : ''}
        onClick={() => setMode('system')}
        aria-label="Sistema"
        title="Sistema"
      >
        <IconMonitor size={14} strokeWidth={1.8} />
      </button>
      <button
        className={mode === 'dark' ? 'active' : ''}
        onClick={() => setMode('dark')}
        aria-label="Oscuro"
        title="Oscuro"
      >
        <IconMoon size={14} strokeWidth={1.8} />
      </button>
    </div>
  )
}
