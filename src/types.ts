export type WordState = 'mastered' | 'probably_known' | 'unknown'

export type Word = {
  lemma: string
  /** Forms that occur in the source text (inflections or a tappable part of a phrase). */
  forms?: string[]
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
    elapsed_days: number
    scheduled_days: number
    reps: number
    lapses: number
    state: number
    last_review?: string
  }
}

export type Cloze = {
  n: number
  options: string[]
  option_meanings_ja?: string[]
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
  chunk_types?: Array<'body' | 'heading'>
  translation_ja?: string[]
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

export type TextProgress = {
  completed: boolean
  completed_at?: string
}

export type ProgressMap = { [text_id: string]: TextProgress }

export type View =
  | { name: 'home' }
  | { name: 'read'; textId: string }
  | { name: 'quiz'; textId: string }
  | { name: 'vocab' }
  | { name: 'dashboard' }
