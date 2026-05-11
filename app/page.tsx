'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadQuestions, getSubjects } from '@/lib/questions'
import { useProgressStore } from '@/store/progressStore'
import type { Question } from '@/types'

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { load: loadProgress, progressMap, getDueReviews, getWrongQuestions } = useProgressStore()

  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])
      setQuestions(qs)
      setSubjects(getSubjects(qs))
      setLoading(false)
    }
    init()
  }, [loadProgress])

  const totalSolved = Object.values(progressMap).filter(
    (p) => p.correct_count + p.wrong_count > 0,
  ).length

  const totalCorrect = Object.values(progressMap).reduce((s, p) => s + p.correct_count, 0)
  const totalAttempts = Object.values(progressMap).reduce(
    (s, p) => s + p.correct_count + p.wrong_count,
    0,
  )
  const accuracy = totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)

  const dueCount = getDueReviews(questions).length
  const wrongCount = getWrongQuestions(questions).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">문제 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* 헤더 */}
      <div className="pt-4 pb-2">
        <h1 className="text-xl font-bold text-white">설비보전산업기사</h1>
        <p className="text-slate-400 text-sm mt-0.5">필기 문제은행 암기 시스템</p>
      </div>

      {/* 학습 현황 */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="풀이 문제" value={`${totalSolved}`} sub={`/ ${questions.length}`} />
        <StatCard label="정답률" value={`${accuracy}%`} sub={`${totalCorrect}/${totalAttempts}`} />
        <StatCard
          label="복습 예정"
          value={`${dueCount}`}
          sub="문제"
          highlight={dueCount > 0}
        />
      </div>

      {/* 메인 메뉴 */}
      <div className="flex flex-col gap-2">
        <MenuButton
          href="/quiz"
          icon="📚"
          title="과목별 문제풀이"
          sub={`${subjects.length}개 과목 · 즉시 채점`}
          color="blue"
        />
        <MenuButton
          href="/exam"
          icon="📋"
          title="년도별 모의고사"
          sub="실제 CBT · 타이머 · 합격 판정"
          color="violet"
        />
        <MenuButton
          href="/speed"
          icon="⚡"
          title="초고속 암기 모드"
          sub="0.5초 전환 · 빠른 반복"
          color="amber"
        />
        <MenuButton
          href="/wrong-notes"
          icon="❌"
          title="오답노트"
          sub={wrongCount > 0 ? `${wrongCount}문제 · Spaced Repetition` : 'Spaced Repetition'}
          color="red"
          badge={wrongCount > 0 ? wrongCount : undefined}
        />
        <MenuButton
          href="/stats"
          icon="📊"
          title="학습 통계"
          sub="과목별 정답률 · 취약 분석"
          color="green"
        />
      </div>

      {/* 복습 예정 배너 */}
      {dueCount > 0 && (
        <Link
          href="/wrong-notes?filter=review"
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-900/30 border border-amber-700/40 active:opacity-70"
        >
          <span className="text-lg">🔔</span>
          <div>
            <p className="text-amber-300 text-sm font-semibold">복습 예정 {dueCount}문제</p>
            <p className="text-amber-400/70 text-xs">지금 복습하러 가기</p>
          </div>
          <span className="ml-auto text-amber-400 text-sm">→</span>
        </Link>
      )}

      {/* 하단 링크 */}
      <div className="mt-auto flex justify-end pb-2">
        <Link href="/settings" className="text-slate-500 text-xs">
          설정
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, highlight,
}: {
  label: string; value: string; sub: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-slate-800/60 border border-slate-700/40'}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}

function MenuButton({
  href, icon, title, sub, color, badge,
}: {
  href: string
  icon: string
  title: string
  sub: string
  color: 'blue' | 'violet' | 'amber' | 'red' | 'green'
  badge?: number
}) {
  const colors = {
    blue:   'border-blue-700/30 bg-blue-900/20 active:bg-blue-900/40',
    violet: 'border-violet-700/30 bg-violet-900/20 active:bg-violet-900/40',
    amber:  'border-amber-700/30 bg-amber-900/20 active:bg-amber-900/40',
    red:    'border-red-700/30 bg-red-900/20 active:bg-red-900/40',
    green:  'border-green-700/30 bg-green-900/20 active:bg-green-900/40',
  }
  const titleColors = {
    blue: 'text-blue-300', violet: 'text-violet-300', amber: 'text-amber-300',
    red: 'text-red-300', green: 'text-green-300',
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-xl border ${colors[color]} transition-colors`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${titleColors[color]}`}>{title}</p>
        <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
      </div>
      {badge !== undefined && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <span className="text-slate-500 text-sm">›</span>
    </Link>
  )
}
