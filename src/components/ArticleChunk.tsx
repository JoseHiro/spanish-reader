import type { ReactNode } from 'react'

export type ArticleChunkType = 'body' | 'heading'

export function ArticleChunk({
  type = 'body',
  content,
  feedback,
  translation,
  submitted,
}: {
  type?: ArticleChunkType
  content: ReactNode
  feedback?: ReactNode
  translation?: string
  submitted: boolean
}) {
  const hasFeedback = submitted && Boolean(feedback)

  return (
    <section
      className={`quiz-paragraph ${type}${hasFeedback ? ' with-feedback' : ''}`}
      data-chunk-type={type}
    >
      {type === 'heading' ? (
        <h2 className="article-chunk-heading">{content}</h2>
      ) : (
        <p>{content}</p>
      )}
      {hasFeedback && feedback}
      {submitted && translation && (
        <div className="chunk-translation-ja">{translation}</div>
      )}
    </section>
  )
}
