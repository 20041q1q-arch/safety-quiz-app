'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadQuestions, getYearRounds, filterByYearRound } from '@/lib/questions'

export default function ExamListPage() {
  const [yearRounds, setYearRounds] = useState<{ year: number; round: number; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestions().then((qs) => {
      const yrs = getYearRounds(qs).map(({ year, round }) => ({
        year,
        round,
        count: filterByYearRound(qs, year, round).length,
      }))
      setYearRounds(yrs)
      setLoading(false)
    })
  }, [])

  // 년도별 그룹화
  const grouped: Record<number, { year: number; round: number; count: number }[]> = {}
  for (const yr of yearRounds) {
    if (!grouped[yr.year]) grouped[yr.year] = []
    grouped[yr.year].push(yr)
  }

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 뒤로</Link>
        <h2 className="text-white font-semibold text-lg">년도별 모의고사</h2>
      </div>

      <p className="text-slate-400 text-xs">
        실제 CBT 시험 형식 · 150분 제한 · 종료 후 자동 채점
      </p>

      {years.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500">
          <p className="text-4xl">📭</p>
          <p className="text-sm">등록된 모의고사가 없습니다.</p>
          <p className="text-xs">문제 파일을 업로드하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-6">
          {years.map((year) => (
            <div key={year}>
              <p className="text-slate-400 text-xs font-semibold mb-2 px-1">{year}년</p>
              <div className="flex flex-col gap-2">
                {grouped[year].map(({ round, count }) => (
                  <Link
                    key={`${year}-${round}`}
                    href={`/exam/${year}/${round}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 active:bg-slate-700/60"
                  >
                    <div>
                      <p className="text-white font-medium">{year}년 {round}회</p>
                      <p className="text-slate-400 text-xs mt-0.5">{count}문제 · 150분</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-lg">CBT</span>
                      <span className="text-slate-400 text-lg">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
