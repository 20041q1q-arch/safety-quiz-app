import { create } from 'zustand'
import type { Question, QuizMode } from '@/types'

interface QuizState {
  questions: Question[]
  currentIndex: number
  answers: Record<number, number>    // question_id → chosen (1-based)
  feedbackVisible: boolean
  mode: QuizMode
  subject: string | null
  sessionStartAt: number
  questionStartAt: number            // 문제별 시작시간 (풀이 시간 측정)

  // 파생값
  currentQuestion: Question | null
  isFinished: boolean

  // 액션
  initQuiz: (questions: Question[], mode: QuizMode, subject?: string) => void
  submitAnswer: (questionId: number, chosen: number) => void
  showFeedback: () => void
  nextQuestion: () => void
  prevQuestion: () => void
  goTo: (index: number) => void
  reset: () => void
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  feedbackVisible: false,
  mode: 'subject',
  subject: null,
  sessionStartAt: 0,
  questionStartAt: 0,

  get currentQuestion() {
    const { questions, currentIndex } = get()
    return questions[currentIndex] ?? null
  },

  get isFinished() {
    const { currentIndex, questions } = get()
    return currentIndex >= questions.length
  },

  initQuiz(questions, mode, subject) {
    set({
      questions,
      currentIndex: 0,
      answers: {},
      feedbackVisible: false,
      mode,
      subject: subject ?? null,
      sessionStartAt: Date.now(),
      questionStartAt: Date.now(),
    })
  },

  submitAnswer(questionId, chosen) {
    set((s) => ({
      answers: { ...s.answers, [questionId]: chosen },
      feedbackVisible: true,
    }))
  },

  showFeedback() {
    set({ feedbackVisible: true })
  },

  nextQuestion() {
    set((s) => ({
      currentIndex: s.currentIndex + 1,
      feedbackVisible: false,
      questionStartAt: Date.now(),
    }))
  },

  prevQuestion() {
    set((s) => ({
      currentIndex: Math.max(0, s.currentIndex - 1),
      feedbackVisible: false,
      questionStartAt: Date.now(),
    }))
  },

  goTo(index) {
    set({ currentIndex: index, feedbackVisible: false, questionStartAt: Date.now() })
  },

  reset() {
    set({
      questions: [],
      currentIndex: 0,
      answers: {},
      feedbackVisible: false,
      mode: 'subject',
      subject: null,
      sessionStartAt: 0,
      questionStartAt: 0,
    })
  },
}))
