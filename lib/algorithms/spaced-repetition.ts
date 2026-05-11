import { addDays } from 'date-fns'

// SM-2 변형: 연속 정답 횟수에 따른 복습 간격 (일)
const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

/**
 * 다음 복습 일시 계산
 * - 정답: streak에 따라 복습 간격 증가
 * - 오답: streak 리셋, 1일 후 복습
 */
export function calcNextReviewAt(streak: number, correct: boolean): Date {
  if (!correct) {
    return addDays(new Date(), REVIEW_INTERVALS[0])
  }
  const idx = Math.min(streak, REVIEW_INTERVALS.length - 1)
  return addDays(new Date(), REVIEW_INTERVALS[idx])
}

/**
 * 해당 문제의 복습이 오늘 이전인지 확인
 */
export function isDueForReview(nextReviewAt: string | null): boolean {
  if (!nextReviewAt) return false
  return new Date(nextReviewAt).getTime() <= Date.now()
}

/**
 * 복습 남은 일수 (음수면 이미 지남)
 */
export function daysUntilReview(nextReviewAt: string | null): number {
  if (!nextReviewAt) return 0
  const diff = new Date(nextReviewAt).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}
