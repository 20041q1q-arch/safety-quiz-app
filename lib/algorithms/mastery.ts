import type { UserProgress, MasteryState } from '@/types'

/**
 * mastery_score 계산식
 *
 * score = accuracy × recency_weight × streak_bonus
 *
 * accuracy       = correct / (correct + wrong)
 * recency_weight = e^(-λ × days)   λ=0.1 (약 10일 기준 감쇠)
 * streak_bonus   = 1.0 + min(streak × 0.1, 0.3)
 */
export function calcMasteryScore(p: UserProgress): number {
  const total = p.correct_count + p.wrong_count
  if (total === 0) return 0

  const accuracy = p.correct_count / total

  const daysSinceLast = p.last_solved_at
    ? (Date.now() - new Date(p.last_solved_at).getTime()) / 86_400_000
    : 30

  const recencyWeight = Math.exp(-0.1 * daysSinceLast)

  const streakBonus = 1.0 + Math.min(p.streak * 0.1, 0.3)

  return Math.min(1.0, accuracy * recencyWeight * streakBonus)
}

/**
 * mastery_score → 상태 분류
 *
 * weak      < 0.4   (빨강)
 * uncertain < 0.75  (노랑)
 * mastered  >= 0.75 (초록)
 */
export function getMasteryState(score: number): MasteryState {
  if (score < 0.4) return 'weak'
  if (score < 0.75) return 'uncertain'
  return 'mastered'
}

export const MASTERY_COLORS: Record<MasteryState, string> = {
  weak: 'text-red-400 bg-red-900/30',
  uncertain: 'text-yellow-400 bg-yellow-900/30',
  mastered: 'text-green-400 bg-green-900/30',
}

export const MASTERY_LABELS: Record<MasteryState, string> = {
  weak: '취약',
  uncertain: '애매',
  mastered: '암기완료',
}

export const MASTERY_DOT: Record<MasteryState, string> = {
  weak: 'bg-red-500',
  uncertain: 'bg-yellow-500',
  mastered: 'bg-green-500',
}
