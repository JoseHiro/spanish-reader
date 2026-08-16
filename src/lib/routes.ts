import type { View } from '../types'

export function parseHash(hash: string): View {
  const path = hash.replace(/^#/, '').split('?')[0].replace(/^\/+|\/+$/g, '')
  const [section, encodedId] = path.split('/')

  if (section === 'text' && encodedId) {
    return { name: 'quiz', textId: decodeURIComponent(encodedId) }
  }
  if (section === 'read' && encodedId) {
    return { name: 'read', textId: decodeURIComponent(encodedId) }
  }
  if (section === 'vocab') return { name: 'vocab' }
  if (section === 'dashboard') return { name: 'dashboard' }
  return { name: 'home' }
}

export function viewToHash(view: View): string {
  switch (view.name) {
    case 'home':
      return '#/'
    case 'quiz':
      return `#/text/${encodeURIComponent(view.textId)}`
    case 'read':
      return `#/read/${encodeURIComponent(view.textId)}`
    case 'vocab':
      return '#/vocab'
    case 'dashboard':
      return '#/dashboard'
  }
}
