import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'sr:theme'

function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(KEY) as ThemeMode) || 'system',
  )
  useEffect(() => {
    apply(mode)
    localStorage.setItem(KEY, mode)
  }, [mode])
  return { mode, setMode }
}
