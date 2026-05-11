/**
 * 문제 데이터 로딩 유틸리티
 *
 * 우선순위:
 * 1. IndexedDB 캐시 (오프라인/빠름)
 * 2. /data/questions.json (로컬 파일)
 *
 * Supabase가 설정된 경우 백그라운드에서 동기화
 */
import type { Question } from '@/types'
import { getCachedQuestions, cacheQuestions, isCacheEmpty } from './indexeddb/db'

let _questions: Question[] | null = null

export async function loadQuestions(): Promise<Question[]> {
  if (_questions) return _questions

  // IndexedDB 캐시 확인
  try {
    const empty = await isCacheEmpty()
    if (!empty) {
      const cached = await getCachedQuestions()
      if (cached.length > 0) {
        _questions = cached
        return cached
      }
    }
  } catch {
    // IndexedDB 접근 불가 시 무시
  }

  // JSON 파일에서 로드
  const res = await fetch('/data/questions.json')
  const data: Question[] = await res.json()
  _questions = data

  // IndexedDB에 백그라운드 캐싱
  cacheQuestions(data).catch(console.error)

  return data
}

export function getSubjects(questions: Question[]): string[] {
  return [...new Set(questions.map((q) => q.subject))].sort()
}

export function getYearRounds(
  questions: Question[],
): { year: number; round: number }[] {
  const map = new Map<string, { year: number; round: number }>()
  for (const q of questions) {
    if (q.year && q.round) {
      const key = `${q.year}-${q.round}`
      if (!map.has(key)) map.set(key, { year: q.year, round: q.round })
    }
  }
  return [...map.values()].sort((a, b) => b.year - a.year || b.round - a.round)
}

export function filterBySubject(questions: Question[], subject: string): Question[] {
  return questions.filter((q) => q.subject === subject)
}

export function filterByYearRound(
  questions: Question[],
  year: number,
  round: number,
): Question[] {
  return questions.filter((q) => q.year === year && q.round === round)
}
