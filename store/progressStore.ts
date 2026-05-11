import { create } from 'zustand'
import type { Question, UserProgress, MasteryState } from '@/types'
import { calcMasteryScore, getMasteryState } from '@/lib/algorithms/mastery'
import { calcNextReviewAt } from '@/lib/algorithms/spaced-repetition'
import { saveProgress, getAllProgress, bulkSaveProgress } from '@/lib/indexeddb/db'

interface ProgressState {
  progressMap: Record<number, UserProgress>
  loaded: boolean

  // 액션
  load: () => Promise<void>
  updateProgress: (questionId: number, correct: boolean, timeMs: number) => void
  getProgress: (questionId: number) => UserProgress
  getWrongQuestions: (questions: Question[], subject?: string) => Question[]
  getDueReviews: (questions: Question[]) => Question[]
  getMasteryState: (questionId: number) => MasteryState
  getAccuracy: (subject?: string) => number
  reset: () => void
}

const defaultProgress = (questionId: number): UserProgress => ({
  question_id: questionId,
  correct_count: 0,
  wrong_count: 0,
  streak: 0,
  mastery_score: 0,
  last_solved_at: null,
  next_review_at: null,
  avg_time_ms: 0,
})

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressMap: {},
  loaded: false,

  async load() {
    if (get().loaded) return
    const all = await getAllProgress()
    const map: Record<number, UserProgress> = {}
    for (const p of all) map[p.question_id] = p
    set({ progressMap: map, loaded: true })
  },

  updateProgress(questionId, correct, timeMs) {
    const existing = get().progressMap[questionId] ?? defaultProgress(questionId)

    const newStreak = correct ? existing.streak + 1 : 0
    const newCorrect = existing.correct_count + (correct ? 1 : 0)
    const newWrong = existing.wrong_count + (correct ? 0 : 1)

    // 평균 풀이 시간 (이동 평균)
    const totalSolved = newCorrect + newWrong
    const newAvgTime = Math.round(
      (existing.avg_time_ms * (totalSolved - 1) + timeMs) / totalSolved,
    )

    const updated: UserProgress = {
      ...existing,
      correct_count: newCorrect,
      wrong_count: newWrong,
      streak: newStreak,
      last_solved_at: new Date().toISOString(),
      next_review_at: calcNextReviewAt(newStreak, correct).toISOString(),
      avg_time_ms: newAvgTime,
      mastery_score: 0, // 아래에서 재계산
    }
    updated.mastery_score = calcMasteryScore(updated)

    set((s) => ({
      progressMap: { ...s.progressMap, [questionId]: updated },
    }))

    // 비동기 IndexedDB 저장
    saveProgress(updated).catch(console.error)
  },

  getProgress(questionId) {
    return get().progressMap[questionId] ?? defaultProgress(questionId)
  },

  getWrongQuestions(questions, subject) {
    const { progressMap } = get()
    return questions.filter((q) => {
      if (subject && q.subject !== subject) return false
      const p = progressMap[q.id]
      return p && p.wrong_count > 0
    })
  },

  getDueReviews(questions) {
    const { progressMap } = get()
    const now = Date.now()
    return questions.filter((q) => {
      const p = progressMap[q.id]
      if (!p?.next_review_at) return false
      return new Date(p.next_review_at).getTime() <= now
    })
  },

  getMasteryState(questionId) {
    const p = get().progressMap[questionId]
    if (!p) return 'weak'
    return getMasteryState(p.mastery_score)
  },

  getAccuracy(subject) {
    const { progressMap } = get()
    let correct = 0
    let total = 0
    for (const p of Object.values(progressMap)) {
      correct += p.correct_count
      total += p.correct_count + p.wrong_count
    }
    return total === 0 ? 0 : Math.round((correct / total) * 100)
  },

  reset() {
    set({ progressMap: {}, loaded: false })
  },
}))
