'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useExamStore } from '@/store/examStore'
import { useProgressStore } from '@/store/progressStore'
import type { Question } from '@/types'

export default function ExamResultPage() {
  const params = useParams()
  const router = useRouter()
  const year = Number(params.year)
  const round = Number(params.round)

  const { result, questions, answers } = useExamStore()
  const { updateProgress } = useProgressStore()
  const [savedProgress, setSavedProgress] = useState(false)
  const [expandWrong, setExpandWrong] = useState(false)

  // 결과 없으면 모의고사 목록으로
  useEffect(() => {
    if (!result) {
      router.replace('/exam')
    }
  }, [result, router])

  // 학습 이력 저장 (1회만)
  useEffect(() => {
    if (!result || savedProgress || questions.length === 0) return
    for (const q of questions) {
      const chosen = answers[q.id]
      if (chosen !== undefined) {
        updateProgress(q.id, chosen === q.answer, 0)
      }
    }
    setSavedProgress(true)
  }, [result, savedProgress, questions, answers, updateProgress])

  if (!result) return null

  const { score, passed, correctCount, totalCount, subjectScores, wrongQuestions } = result

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 pt-4">
        <Link href="/exam" className="text-slate-400 text-sm active:text-white">← 목록</Link>
        <h2 className="text-white font-semibold">{year}년 {round}회 결과</h2>
      </div>

      {/* 합격/불합격 */}
      <div className={`rounded-2xl p-6 text-center border ${
        passed
          ? 'bg-green-900/30 border-green-700/50'
          : 'bg-red-900/20 border-red-700/30'
      }`}>
        <div className="text-4xl mb-2">{passed ? '🎉' : '📚'}</div>
        <p className={`text-3xl font-bold ${passed ? 'text-green-300' : 'text-red-300'}`}>
          {score}점
        </p>
        <p className={`text-lg font-semibold mt-1 ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {passed ? '합격' : '불합격'}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          {correctCount}/{totalCount}문제 정답 · 합격기준 60점
        </p>
      </div>

      {/* 과목별 점수 */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 text-sm font-semibold mb-3">과목별 점수</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(subjectScores).map(([subject, { correct, total }]) => {
            const pct = Math.round((correct / total) * 100)
            const subjPassed = pct >= 40
            return (
              <div key={subject}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{subject}</span>
                  <span className={subjPassed ? 'text-green-400' : 'text-red-400'}>
                    {correct}/{total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${subjPassed ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-slate-500 text-xs mt-3">* 과목당 40% 이상 + 총점 60점 이상 합격</p>
      </div>

      {/* 틀린 문제 목록 */}
      {wrongQuestions.length > 0 && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/40 overflow-hidden">
          <button
            onClick={() => setExpandWrong((v) => !v)}
            className="w-full flex items-center justify-between p-4 active:bg-slate-700/40"
          >
            <span className="text-slate-300 text-sm font-semibold">
              틀린 문제 {wrongQuestions.length}개
            </span>
            <span className="text-slate-400 text-sm">{expandWrong ? '▲' : '▼'}</span>
          </button>

          {expandWrong && (
            <div className="border-t border-slate-700/40 divide-y divide-slate-700/30">
              {wrongQuestions.map((q, i) => (
                <WrongItem key={q.id} q={q} no={i + 1} chosen={answers[q.id]} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2">
        <Link
          href="/wrong-notes"
          className="w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-medium text-center border border-slate-700 active:bg-slate-700 text-sm"
        >
          오답노트 복습하기
        </Link>
        <Link
          href={`/exam/${year}/${round}`}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-center active:bg-blue-700 text-sm"
        >
          다시 풀기
        </Link>
        <Link
          href="/"
          className="w-full py-3 text-slate-500 text-sm text-center active:text-slate-300"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}

function WrongItem({ q, no, chosen }: { q: Question; no: number; chosen?: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-2">
          <span className="text-red-400 text-xs font-bold shrink-0 mt-0.5">✗{no}</span>
          <p className="text-slate-300 text-sm leading-snug line-clamp-2">{q.question}</p>
        </div>
      </button>
      {expanded && (
        <div className="mt-2 pl-5 text-xs space-y-1">
          {q.options.map((opt, i) => (
            <p
              key={i}
              className={
                i + 1 === q.answer
                  ? 'text-green-400 font-semibold'
                  : i + 1 === chosen
                  ? 'text-red-400 line-through'
                  : 'text-slate-500'
              }
            >
              {['①', '②', '③', '④'][i]} {opt}
            </p>
          ))}
          {q.explanation && (
            <p className="text-slate-400 mt-2 leading-relaxed">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
