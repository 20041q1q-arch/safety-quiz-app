'use client'

import { memo } from 'react'

interface QuizHeaderProps {
  subject: string | null
  current: number   // 1-based
  total: number
  onExit: () => void
  correctCount?: number
}

export const QuizHeader = memo(function QuizHeader({
  subject, current, total, onExit, correctCount,
}: QuizHeaderProps) {
  const pct = Math.round(((current - 1) / total) * 100)

  return (
    <div className="sticky top-0 z-10 bg-[#0f1117]/95 backdrop-blur-sm pb-2 pt-safe">
      <div className="flex items-center gap-3 px-1 mb-2">
        <button
          onClick={onExit}
          className="text-slate-400 text-sm active:text-white px-1 py-1"
        >
          ← 나가기
        </button>
        <div className="flex-1 text-center">
          {subject && (
            <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
              {subject}
            </span>
          )}
        </div>
        <span className="text-slate-400 text-sm font-mono">
          {current}/{total}
          {correctCount !== undefined && (
            <span className="text-green-400 ml-1">({correctCount}✓)</span>
          )}
        </span>
      </div>
      {/* 진행률 바 */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})
