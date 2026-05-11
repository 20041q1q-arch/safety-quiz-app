'use client'

import { memo } from 'react'

interface ExamNavProps {
  total: number
  currentIndex: number
  answers: Record<number, number>
  questionIds: number[]
  onGoto: (index: number) => void
}

export const ExamNav = memo(function ExamNav({
  total, currentIndex, answers, questionIds, onGoto,
}: ExamNavProps) {
  return (
    <div className="p-4 overflow-y-auto no-scrollbar" style={{ maxHeight: '70dvh' }}>
      <p className="text-slate-400 text-xs mb-3">문제 번호 선택</p>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const qid = questionIds[i]
          const answered = qid !== undefined && answers[qid] !== undefined
          const isCurrent = i === currentIndex

          return (
            <button
              key={i}
              onClick={() => onGoto(i)}
              className={`aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : answered
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> 현재
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-600 inline-block" /> 답변
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" /> 미답변
        </span>
      </div>
    </div>
  )
})
