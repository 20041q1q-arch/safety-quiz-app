import type { Question, UserProgress } from '@/types'

interface WeightedQuestion {
  question: Question
  weight: number
}

/**
 * 가중 랜덤 출제 알고리즘
 *
 * 우선순위:
 * 1. next_review_at 초과 문제 (복습 예정 지남)
 * 2. 틀린 횟수 많은 문제
 * 3. 오래 안 푼 문제
 * 4. 한 번도 안 푼 문제
 * 5. mastery_score 낮은 문제
 */
export function selectWeightedQuestions(
  pool: Question[],
  count: number,
  progressMap: Record<number, UserProgress>,
): Question[] {
  const now = Date.now()

  const weighted: WeightedQuestion[] = pool.map((q) => {
    const p = progressMap[q.id]

    if (!p || p.correct_count + p.wrong_count === 0) {
      // 한 번도 안 푼 문제: 중간 우선순위
      return { question: q, weight: 80 }
    }

    const lastSolvedMs = p.last_solved_at ? new Date(p.last_solved_at).getTime() : 0
    const daysSinceLast = (now - lastSolvedMs) / 86_400_000

    // 틀린 문제 가중치
    const wrongWeight = p.wrong_count * 25

    // 오래 안 푼 문제 가중치 (최대 120)
    const staleWeight = Math.min(daysSinceLast * 4, 120)

    // 암기 완료 문제는 낮은 가중치
    const masteryPenalty = p.mastery_score * -80

    // 복습 예정일 초과 시 최우선
    const overdueBonus =
      p.next_review_at && new Date(p.next_review_at).getTime() < now ? 200 : 0

    const weight = Math.max(
      1,
      wrongWeight + staleWeight + masteryPenalty + overdueBonus,
    )

    return { question: q, weight }
  })

  // 가중 랜덤 샘플링
  const selected = weightedSample(weighted, Math.min(count, pool.length))

  // 최종 셔플
  return fisherYatesShuffle(selected)
}

function weightedSample(items: WeightedQuestion[], count: number): Question[] {
  const result: Question[] = []
  const remaining = [...items]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0)
    let rand = Math.random() * totalWeight

    for (let j = 0; j < remaining.length; j++) {
      rand -= remaining[j].weight
      if (rand <= 0) {
        result.push(remaining[j].question)
        remaining.splice(j, 1)
        break
      }
    }
  }

  return result
}

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
