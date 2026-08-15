import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArticleChunk } from './ArticleChunk'

describe('ArticleChunk', () => {
  it('renders a body chunk with feedback and one translation after submission', () => {
    const { container } = render(
      <ArticleChunk
        type="body"
        content="Texto español"
        feedback={<div>解答解説</div>}
        translation="日本語訳"
        submitted
      />,
    )

    const chunk = container.querySelector('[data-chunk-type="body"]')
    expect(chunk).toHaveClass('body', 'with-feedback')
    expect(screen.getByText('解答解説')).toBeInTheDocument()
    expect(screen.getAllByText('日本語訳')).toHaveLength(1)
    expect(screen.getByText('日本語訳')).toHaveClass('chunk-translation-ja')
  })

  it('uses heading markup only when the data marks the chunk as a heading', () => {
    render(
      <ArticleChunk
        type="heading"
        content="Minería para la transición energética"
        translation="エネルギー転換のための鉱業"
        submitted
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Minería para la transición energética',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('エネルギー転換のための鉱業')).toBeInTheDocument()
  })

  it('hides feedback and translation before submission', () => {
    render(
      <ArticleChunk
        content="Texto"
        feedback={<div>解答解説</div>}
        translation="日本語訳"
        submitted={false}
      />,
    )

    expect(screen.queryByText('解答解説')).not.toBeInTheDocument()
    expect(screen.queryByText('日本語訳')).not.toBeInTheDocument()
  })
})
