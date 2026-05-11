'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadQuestions, getSubjects, filterBySubject } from '@/lib/questions'
import { useProgressStore } from '@/store/progressStore'
import { getMasteryState } from '@/lib/algorithms/mastery'
import { MASTERY_DOT } from '@/lib/algorithms/mastery'

export default function QuizPage() {
  const [subjects, setSubjects] = useState<{ name: string; total: number; solved: number; accuracy: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { load: loadProgress, progressMap } = useProgressStore()

  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])
      const subjectNames = getSubjects(qs)

      const data = subjectNames.map((name) => {
        const pool = filterBySubject(qs, name)
        const attempted = pool.filter((q) => {
          const p = progressMap[q.id]
          return p && p.correct_count + p.wrong_count > 0
        })
        const correctTotal = attempted.reduce((s, q) => {
          const p = progressMap[q.id]
          return s + (p?.correct_count ?? 0)
        }, 0)
        const attemptTotal = attempted.reduce((s, q) => {
          const p = progressMap[q.id]
          return s + (p?.correct_count ?? 0) + (p?.wrong_count ?? 0)
        }, 0)

        return {
          name,
          total: pool.length,
          solved: attempted.length,
          accuracy: attemptTotal === 0 ? 0 : Math.round((correctTotal / attemptTotal) * 100),
        }
      })

      setSubjects(data)
      setLoading(false)
    }
    init()
  }, [loadProgress, progressMap])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-3">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 뒤로</Link>
        <h2 className="text-white font-semibold text-lg">과목별 문제풀이</h2>
      </div>

      <p className="text-slate-400 text-xs">
        과목을 선택하면 가중 랜덤으로 60문제를 출제합니다.
        틀린 문제와 오래 안 푼 문제를 우선 출제합니다.
      </p>

      <div className="flex flex-col gap-2">
        {subjects.map((s) => (
          <SubjectCard key={s.name} {...s} />
        ))}
      </div>

      {/* 전체 랜덤 */}
      <Link
        href="/quiz/전체"
        className="flex items-center justify-between p-4 rounded-xl border border-purple-700/30 bg-purple-900/20 active:bg-purple-900/40 mt-1"
      >
        <div>
          <p className="text-purple-300 font-semibold">전체 과목 랜덤</p>
          <p className="text-slate-400 text-xs mt-0.5">모든 과목 통합 랜덤 60문제</p>
        </div>
        <span className="text-slate-400 text-lg">›</span>
      </Link>
    </div>
  )
}

function SubjectCard({
  name, total, solved, accuracy,
}: {
  name: string; total: number; solved: number; accuracy: number
}) {
  const pct = Math.round((solved / total) * 100)

  return (
    <Link
      href={`/quiz/${encodeURIComponent(name)}`}
      className="flex flex-col gap-2 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 active:bg-slate-700/60"
    >
      <div className="flex items-center justify-between">
        <p className="text-white font-medium text-sm">{name}</p>
        <span className={`text-xs font-semibold ${accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : accuracy > 0 ? 'text-red-400' : 'text-slate-500'}`}>
          {accuracy > 0 ? `${accuracy}%` : '미학습'}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{solved}/{total}문제 풀이</span>
        <span>{pct}% 진도</span>
      </div>
    </Link>
  )
}
