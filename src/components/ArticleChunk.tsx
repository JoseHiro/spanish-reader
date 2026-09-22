import { useState, type ReactNode } from 'react'

export type ArticleChunkType = 'body' | 'heading'

export function ArticleChunk({
  type = 'body',
  content,
  contentSegments,
  feedback,
  translation,
  translationSegments,
  submitted,
}: {
  type?: ArticleChunkType
  content: ReactNode
  contentSegments?: ReactNode[]
  feedback?: ReactNode
  translation?: string
  translationSegments?: string[]
  submitted: boolean
}) {
  const hasFeedback = submitted && Boolean(feedback)
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const aligned =
    type === 'body' &&
    submitted &&
    contentSegments &&
    translationSegments &&
    contentSegments.length === translationSegments.length

  const sourceContent = aligned
    ? contentSegments.map((segment, index) => (
        <span
          className={`alignment-segment source${activeSegment === index ? ' active' : ''}`}
          data-alignment-index={index}
          key={index}
          onMouseEnter={() => setActiveSegment(index)}
          onMouseLeave={() => setActiveSegment(null)}
        >
          {segment}{index < contentSegments.length - 1 ? ' ' : ''}
        </span>
      ))
    : content

  return (
    <section
      className={`quiz-paragraph ${type}${hasFeedback ? ' with-feedback' : ''}`}
      data-chunk-type={type}
    >
      {type === 'heading' ? (
        <h2 className="article-chunk-heading">{sourceContent}</h2>
      ) : (
        <p>{sourceContent}</p>
      )}
      {hasFeedback && feedback}
      {submitted && translation && (
        <div className="chunk-translation-ja">
          {aligned
            ? translationSegments.map((segment, index) => (
                <span
                  className={`alignment-segment translation${activeSegment === index ? ' active' : ''}`}
                  data-alignment-index={index}
                  key={index}
                  onMouseEnter={() => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {segment}{index < translationSegments.length - 1 ? ' ' : ''}
                </span>
              ))
            : translation}
        </div>
      )}
    </section>
  )
}
