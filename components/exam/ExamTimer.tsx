'use client'

import { memo } from 'react'

interface ExamTimerProps {
  timeLeft: number  // 초
}

export const ExamTimer = memo(function ExamTimer({ timeLeft }: ExamTimerProps) {
  const h = Math.floor(timeLeft / 3600)
  const m = Math.floor((timeLeft % 3600) / 60)
  const s = timeLeft % 60

  const isWarning = timeLeft < 300  // 5분 이하
  const isDanger = timeLeft < 60    // 1분 이하

  const fmt = (n: number) => String(n).padStart(2, '0')

  return (
    <span
      className={`font-mono text-sm font-semibold tabular-nums ${
        isDanger ? 'text-red-400 animate-pulse' :
        isWarning ? 'text-amber-400' :
        'text-slate-300'
      }`}
    >
      {h > 0 ? `${fmt(h)}:` : ''}{fmt(m)}:{fmt(s)}
    </span>
  )
})
