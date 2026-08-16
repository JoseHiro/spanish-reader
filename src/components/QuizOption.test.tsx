import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuizOption } from './QuizOption'

describe('QuizOption', () => {
  it('does not reveal the Japanese meaning before grading', () => {
    render(
      <QuizOption
        label="a) embarcados"
        meaningJa="深く関わった"
        className="cloze-option"
        submitted={false}
        onClick={vi.fn()}
      />,
    )

    expect(screen.queryByText('深く関わった')).not.toBeInTheDocument()
  })

  it('reveals the Japanese meaning after grading', () => {
    render(
      <QuizOption
        label="a) embarcados"
        meaningJa="深く関わった"
        className="cloze-option correct"
        submitted
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByText('深く関わった')).toHaveClass('option-meaning-ja')
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
