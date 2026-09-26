import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Text } from '../types'
import { TextReader } from './TextReader'

const text: Text = {
  id: 'text_test',
  title: 'Texto de prueba',
  type: 'plain',
  paragraphs: ['Una palabra desconocida aparece aquí.'],
}

describe('TextReader word collection mode', () => {
  it('adds an unregistered word to review with its source sentence', () => {
    const onWordUpdate = vi.fn()
    const onEncounter = vi.fn()

    render(
      <TextReader
        text={text}
        words={[]}
        completed={false}
        onBack={vi.fn()}
        onOpenQuiz={vi.fn()}
        onWordUpdate={onWordUpdate}
        onEncounter={onEncounter}
        onToggleCompleted={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Añadir palabras' }))
    fireEvent.click(screen.getByText('desconocida'))

    expect(onWordUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lemma: 'desconocida',
        state: 'unknown',
        source_text_id: 'text_test',
      }),
    )
    expect(onEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        word_lemma: 'desconocida',
        sentence: 'Una palabra desconocida aparece aquí.',
      }),
    )
    expect(screen.getByText('1')).toHaveClass('collect-count')
  })

  it('leaves unregistered words as plain text outside collection mode', () => {
    render(
      <TextReader
        text={text}
        words={[]}
        completed={false}
        onBack={vi.fn()}
        onOpenQuiz={vi.fn()}
        onWordUpdate={vi.fn()}
        onEncounter={vi.fn()}
        onToggleCompleted={vi.fn()}
      />,
    )

    expect(screen.getByText('desconocida')).not.toHaveClass('tok-word')
  })
})
