import { describe, expect, it } from 'vitest'
import { parseHash, viewToHash } from './routes'

describe('hash routes', () => {
  it('maps each public page to a stable URL', () => {
    expect(viewToHash({ name: 'home' })).toBe('#/')
    expect(viewToHash({ name: 'quiz', textId: 'text_02' })).toBe(
      '#/text/text_02',
    )
    expect(viewToHash({ name: 'vocab' })).toBe('#/vocab')
    expect(viewToHash({ name: 'dashboard' })).toBe('#/dashboard')
  })

  it('opens a lesson directly from its hash', () => {
    expect(parseHash('#/text/text_03')).toEqual({
      name: 'quiz',
      textId: 'text_03',
    })
  })

  it('ignores query parameters and falls back safely for unknown routes', () => {
    expect(parseHash('#/vocab?lesson=text_02')).toEqual({ name: 'vocab' })
    expect(parseHash('#/not-found')).toEqual({ name: 'home' })
  })
})
