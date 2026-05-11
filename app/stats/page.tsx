'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadQuestions } from '@/lib/questions'
import { useProgressStore } from '@/store/progressStore'
import type { SubjectStat } from '@/types'

export default function StatsPage() {
  const [stats, setStats] = useState<SubjectStat[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const { load: loadProgress, progressMap } = useProgressStore()

  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])

      // 과목별 통계 계산
      const subjectMap: Record<string, SubjectStat> = {}
      for (const q of qs) {
        if (!subjectMap[q.subject]) {
          subjectMap[q.subject] = {
            subject: q.subject,
            totalAttempted: 0,
            correctCount: 0,
            wrongCount: 0,
            accuracy: 0,
            masteredCount: 0,
            weakCount: 0,
          }
        }
        const p = progressMap[q.id]
        if (!p || p.correct_count + p.wrong_count === 0) continue

        const stat = subjectMap[q.subject]
        stat.totalAttempted++
        stat.correctCount += p.correct_count
        stat.wrongCount += p.wrong_count
        if (p.mastery_score >= 0.75) stat.masteredCount++
        if (p.mastery_score < 0.4 && p.wrong_count > 0) stat.weakCount++
      }

      for (const stat of Object.values(subjectMap)) {
        const total = stat.correctCount + stat.wrongCount
        stat.accuracy = total === 0 ? 0 : Math.round((stat.correctCount / total) * 100)
      }

      setStats(Object.values(subjectMap))
      setLoading(false)
    }
    init()
  }, [loadProgress, progressMap])

  const totalSolved = Object.values(progressMap).filter(
    (p) => p.correct_count + p.wrong_count > 0,
  ).length
  const totalCorrect = Object.values(progressMap).reduce((s, p) => s + p.correct_count, 0)
  const totalAttempts = Object.values(progressMap).reduce(
    (s, p) => s + p.correct_count + p.wrong_count, 0,
  )
  const overallAccuracy = totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100)
  const masteredCount = Object.values(progressMap).filter((p) => p.mastery_score >= 0.75).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 pb-8">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 뒤로</Link>
        <h2 className="text-white font-semibold text-lg">학습 통계</h2>
      </div>

      {/* 전체 요약 */}
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard label="총 풀이 문제" value={totalSolved} unit="문제" />
        <SummaryCard label="전체 정답률" value={overallAccuracy} unit="%" color={overallAccuracy >= 70 ? 'green' : overallAccuracy >= 50 ? 'yellow' : 'red'} />
        <SummaryCard label="총 시도 횟수" value={totalAttempts} unit="회" />
        <SummaryCard label="암기 완료" value={masteredCount} unit="문제" color="green" />
      </div>

      {/* 과목별 */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 text-sm font-semibold mb-3">과목별 정답률</h3>
        {stats.length === 0 ? (
          <p className="text-slate-500 text-sm">아직 학습 데이터가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {stats.map((s) => (
              <SubjectStatRow key={s.subject} stat={s} />
            ))}
          </div>
        )}
      </div>

      {/* 취약 과목 */}
      {stats.filter((s) => s.accuracy > 0 && s.accuracy < 60).length > 0 && (
        <div className="bg-red-900/20 rounded-2xl p-4 border border-red-700/30">
          <h3 className="text-red-300 text-sm font-semibold mb-2">⚠️ 취약 과목</h3>
          {stats
            .filter((s) => s.accuracy > 0 && s.accuracy < 60)
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((s) => (
              <div key={s.subject} className="flex items-center justify-between py-1.5">
                <span className="text-slate-300 text-sm">{s.subject}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-sm font-semibold">{s.accuracy}%</span>
                  <Link
                    href={`/quiz/${encodeURIComponent(s.subject)}`}
                    className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-lg"
                  >
                    복습
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label, value, unit, color = 'default',
}: {
  label: string; value: number; unit: string; color?: 'default' | 'green' | 'yellow' | 'red'
}) {
  const textColors = {
    default: 'text-white',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
      <p className="text-slate-500 text-xs">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[color]}`}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

function SubjectStatRow({ stat }: { stat: SubjectStat }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-300 text-sm">{stat.subject}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">{stat.totalAttempted}문제</span>
          <span className={
            stat.accuracy >= 70 ? 'text-green-400 font-semibold' :
            stat.accuracy >= 50 ? 'text-yellow-400 font-semibold' :
            stat.accuracy > 0 ? 'text-red-400 font-semibold' :
            'text-slate-500'
          }>
            {stat.accuracy > 0 ? `${stat.accuracy}%` : '미학습'}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            stat.accuracy >= 70 ? 'bg-green-500' :
            stat.accuracy >= 50 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${stat.accuracy}%` }}
        />
      </div>
      <div className="flex gap-3 mt-1 text-xs text-slate-600">
        <span className="text-green-600">암기완료 {stat.masteredCount}</span>
        <span className="text-red-600">취약 {stat.weakCount}</span>
      </div>
    </div>
  )
}
