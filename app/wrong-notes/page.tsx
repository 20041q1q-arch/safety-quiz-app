'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadQuestions } from '@/lib/questions'
import { useProgressStore } from '@/store/progressStore'
import { getMasteryState, MASTERY_COLORS, MASTERY_LABELS, MASTERY_DOT } from '@/lib/algorithms/mastery'
import { daysUntilReview } from '@/lib/algorithms/spaced-repetition'
import type { Question, UserProgress } from '@/types'

type Filter = 'all' | 'review' | 'weak' | 'bookmarked'

function WrongNotesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultFilter = (searchParams.get('filter') as Filter) ?? 'all'

  const [allQs, setAllQs] = useState<Question[]>([])
  const [filter, setFilter] = useState<Filter>(defaultFilter)
  const [loading, setLoading] = useState(true)

  const { load: loadProgress, progressMap, getWrongQuestions, getDueReviews } = useProgressStore()

  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])
      setAllQs(qs)
      setLoading(false)
    }
    init()
  }, [loadProgress])

  const wrongQs = getWrongQuestions(allQs)
  const dueReviews = getDueReviews(allQs)

  const filtered = (() => {
    switch (filter) {
      case 'review': return dueReviews
      case 'weak':   return wrongQs.filter((q) => {
        const p = progressMap[q.id]
        return p && getMasteryState(p.mastery_score) === 'weak'
      })
      default:       return wrongQs
    }
  })()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 뒤로</Link>
        <h2 className="text-white font-semibold text-lg">오답노트</h2>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
        {([
          { key: 'all', label: `전체 ${wrongQs.length}` },
          { key: 'review', label: `복습 예정 ${dueReviews.length}` },
          { key: 'weak', label: '취약' },
        ] as { key: Filter; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 active:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 빠른 복습 버튼 */}
      {filtered.length > 0 && (
        <div className="px-4 mb-3">
          <button
            onClick={() => {
              // 오답문제 초고속 모드로
              router.push('/speed?filter=wrong-only')
            }}
            className="w-full py-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-300 text-sm font-semibold active:bg-red-900/50"
          >
            ⚡ {filtered.length}문제 바로 복습하기
          </button>
        </div>
      )}

      {/* 문제 목록 */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500 pb-10">
          <p className="text-3xl">🎉</p>
          <p className="text-sm">
            {filter === 'review' ? '복습할 문제가 없습니다!' : '오답이 없습니다!'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
          <div className="flex flex-col gap-2">
            {filtered.map((q) => {
              const p = progressMap[q.id]
              return <WrongNoteCard key={q.id} q={q} progress={p} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function WrongNoteCard({ q, progress }: { q: Question; progress?: UserProgress }) {
  const [expanded, setExpanded] = useState(false)
  const state = progress ? getMasteryState(progress.mastery_score) : 'weak'
  const daysLeft = daysUntilReview(progress?.next_review_at ?? null)

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/40 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-3 active:bg-slate-700/40"
      >
        <div className="flex items-start gap-2">
          <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${MASTERY_DOT[state]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm leading-snug line-clamp-2">{q.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 text-xs">{q.subject}</span>
              {progress && (
                <>
                  <span className="text-slate-600 text-xs">·</span>
                  <span className="text-red-400 text-xs">틀림 {progress.wrong_count}회</span>
                  <span className={`text-xs font-medium ${MASTERY_COLORS[state]}`}>
                    {MASTERY_LABELS[state]}
                  </span>
                </>
              )}
              {daysLeft < 0 && (
                <span className="text-amber-400 text-xs">복습 {Math.abs(daysLeft)}일 초과</span>
              )}
            </div>
          </div>
          <span className="text-slate-500 text-sm shrink-0">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/40 px-3 pb-3">
          <div className="flex flex-col gap-1.5 mt-2">
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`text-xs px-2 py-1.5 rounded-lg ${
                  i + 1 === q.answer
                    ? 'bg-green-900/30 text-green-300 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {['①', '②', '③', '④'][i]} {opt}
              </div>
            ))}
          </div>
          {q.explanation && (
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function WrongNotesPage() {
  return (
    <Suspense>
      <WrongNotesInner />
    </Suspense>
  )
}
