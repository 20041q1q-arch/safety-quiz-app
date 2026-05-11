import { create } from 'zustand'
import type { Question, ExamMeta, ExamResult } from '@/types'

interface ExamState {
  questions: Question[]
  currentIndex: number
  answers: Record<number, number>    // question_id → chosen (1-based)
  timeLeft: number                   // 남은 초
  isRunning: boolean
  isSubmitted: boolean
  meta: ExamMeta | null
  result: ExamResult | null

  // 액션
  startExam: (questions: Question[], meta: ExamMeta) => void
  selectAnswer: (questionId: number, chosen: number) => void
  goToQuestion: (index: number) => void
  tick: () => void
  submitExam: () => ExamResult
  reset: () => void
}

export const useExamStore = create<ExamState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  timeLeft: 0,
  isRunning: false,
  isSubmitted: false,
  meta: null,
  result: null,

  startExam(questions, meta) {
    set({
      questions,
      currentIndex: 0,
      answers: {},
      timeLeft: meta.durationSec,
      isRunning: true,
      isSubmitted: false,
      meta,
      result: null,
    })
  },

  selectAnswer(questionId, chosen) {
    set((s) => ({ answers: { ...s.answers, [questionId]: chosen } }))
  },

  goToQuestion(index) {
    set({ currentIndex: index })
  },

  tick() {
    const { timeLeft, isRunning, isSubmitted } = get()
    if (!isRunning || isSubmitted) return
    if (timeLeft <= 1) {
      get().submitExam()
      return
    }
    set({ timeLeft: timeLeft - 1 })
  },

  submitExam() {
    const { questions, answers, meta } = get()
    const startedAt = Date.now()

    let correctCount = 0
    const subjectScores: Record<string, { correct: number; total: number }> = {}
    const wrongQuestions: Question[] = []

    for (const q of questions) {
      if (!subjectScores[q.subject]) {
        subjectScores[q.subject] = { correct: 0, total: 0 }
      }
      subjectScores[q.subject].total++

      if (answers[q.id] === q.answer) {
        correctCount++
        subjectScores[q.subject].correct++
      } else {
        wrongQuestions.push(q)
      }
    }

    const score = Math.round((correctCount / questions.length) * 100)

    // 합격 기준: 총점 60점 이상 + 과목별 40점 이상
    const subjectPassed = Object.values(subjectScores).every(
      ({ correct, total }) => correct / total >= 0.4,
    )
    const passed = score >= 60 && subjectPassed

    const result: ExamResult = {
      totalCount: questions.length,
      correctCount,
      score,
      passed,
      subjectScores,
      wrongQuestions,
      durationMs: (meta?.durationSec ?? 0) * 1000 - (get().timeLeft * 1000),
    }

    set({ isRunning: false, isSubmitted: true, result })
    return result
  },

  reset() {
    set({
      questions: [],
      currentIndex: 0,
      answers: {},
      timeLeft: 0,
      isRunning: false,
      isSubmitted: false,
      meta: null,
      result: null,
    })
  },
}))
