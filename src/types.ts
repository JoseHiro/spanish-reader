export type WordState = 'mastered' | 'probably_known' | 'unknown'

export type Word = {
  lemma: string
  state: WordState
  pos?: string
  meaning_ja?: string
  example?: string | null
  source_text_id?: string
  tags?: string[]
  srs?: {
    due: string
    stability: number
    difficulty: number
    reps: number
    lapses: number
    last_review?: string
  }
}

export type Cloze = {
  n: number
  options: string[]
  answer: number
  explanation?: string
}

export type Text = {
  id: string
  title: string
  author?: string
  source?: string
  source_url?: string
  type: 'cloze' | 'plain'
  level?: string
  added_at?: string
  paragraphs: string[]
  clozes?: Cloze[]
}

export type Encounter = {
  word_lemma: string
  text_id: string
  sentence: string
  tapped_at: string
}

export type QuizResult = {
  id: string
  text_id: string
  score: number
  total: number
  answers: (number | null)[]
  wrong_words: string[]
  taken_at: string
}
