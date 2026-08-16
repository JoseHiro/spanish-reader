import { useEffect, useState } from 'react'
import { api } from './lib/api'
import type {
  Text,
  Word,
  Encounter,
  QuizResult,
  ProgressMap,
} from './types'
import { Home } from './components/Home'
import { TextReader } from './components/TextReader'
import { ClozeQuiz } from './components/ClozeQuiz'
import { VocabList } from './components/VocabList'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import {
  IconRead,
  IconVocab,
  IconChart,
  IconSun,
  IconMoon,
  IconMonitor,
  IconPanelLeftClose,
  IconPanelLeftOpen,
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
  const [progress, setProgress] = useState<ProgressMap>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { mode, setMode } = useTheme()

  async function reloadAll() {
    try {
      const [t, w, e, q, p] = await Promise.all([
        api.getTexts(),
        api.getWords(),
        api.getEncounters(),
        api.getQuizResults(),
        api.getProgress(),
      ])
      setTexts(t.texts)
      setWords(w.words)
      setEncounters(e.encounters)
      setQuizResults(q.results)
      setProgress(p.progress ?? {})
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

  async function toggleCompleted(textId: string) {
    const cur = progress[textId]
    const next: ProgressMap = {
      ...progress,
      [textId]: cur?.completed
        ? { completed: false }
        : { completed: true, completed_at: new Date().toISOString() },
    }
    setProgress(next)
    await api.putProgress({ progress: next })
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
    <div className={`shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SR</div>
          <div>Spanish Reader</div>
          {view.name === 'quiz' && (
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(true)}
              title="Ocultar barra lateral"
              aria-label="Ocultar barra lateral"
            >
              <IconPanelLeftClose size={18} strokeWidth={1.8} />
            </button>
          )}
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

      {view.name === 'quiz' && sidebarCollapsed && (
        <button
          className="sidebar-reopen"
          onClick={() => setSidebarCollapsed(false)}
          title="Mostrar barra lateral"
          aria-label="Mostrar barra lateral"
        >
          <IconPanelLeftOpen size={19} strokeWidth={1.8} />
        </button>
      )}

      <main className="main">
        {!loading && !err && (
          <Header crumbs={buildCrumbs(view, currentText, setView)} words={words} />
        )}
        <div className={`container${view.name === 'quiz' ? ' quiz-container' : ''}`}>
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
                  progress={progress}
                  onOpenText={(text) =>
                    setView(
                      text.type === 'cloze'
                        ? { name: 'quiz', textId: text.id }
                        : { name: 'read', textId: text.id },
                    )
                  }
                />
              )}
              {view.name === 'read' && currentText && (
                <TextReader
                  text={currentText}
                  words={words}
                  completed={!!progress[currentText.id]?.completed}
                  onBack={() => setView({ name: 'home' })}
                  onOpenQuiz={() =>
                    setView({ name: 'quiz', textId: currentText.id })
                  }
                  onWordUpdate={updateWord}
                  onEncounter={addEncounter}
                  onToggleCompleted={() => toggleCompleted(currentText.id)}
                />
              )}
              {view.name === 'quiz' && currentText && (
                <ClozeQuiz
                  text={currentText}
                  completed={!!progress[currentText.id]?.completed}
                  onBack={() => setView({ name: 'home' })}
                  onSaveResult={saveQuizResult}
                  onWordUpdate={updateWord}
                  onEncounter={addEncounter}
                  onMarkCompleted={() => toggleCompleted(currentText.id)}
                  words={words}
                />
              )}
              {view.name === 'vocab' && (
                <VocabList
                  words={words}
                  texts={texts}
                  onWordUpdate={updateWord}
                />
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

function buildCrumbs(
  view: View,
  currentText: Text | undefined,
  setView: (v: View) => void,
): { label: string; onClick?: () => void }[] {
  switch (view.name) {
    case 'home':
      return [{ label: 'Leer' }]
    case 'read':
      return [
        { label: 'Leer', onClick: () => setView({ name: 'home' }) },
        { label: currentText?.title ?? '—' },
      ]
    case 'quiz':
      return [
        { label: 'Leer', onClick: () => setView({ name: 'home' }) },
        { label: currentText?.title ?? '—' },
      ]
    case 'vocab':
      return [{ label: 'Vocabulario' }]
    case 'dashboard':
      return [{ label: 'Progreso' }]
  }
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
