'use client'

import { memo } from 'react'
import QuestionImage from '@/components/image/QuestionImage'

interface FeedbackPanelProps {
  correct: boolean
  explanation: string
  expImageUrl?: string
}

export const FeedbackPanel = memo(function FeedbackPanel({
  correct, explanation, expImageUrl,
}: FeedbackPanelProps) {
  return (
    <div className={`rounded-xl p-4 border fade-in ${
      correct
        ? 'bg-green-900/25 border-green-700/40'
        : 'bg-red-900/25 border-red-700/40'
    }`}>
      <p className={`font-semibold text-sm mb-1 ${correct ? 'text-green-300' : 'text-red-300'}`}>
        {correct ? '✓ 정답입니다!' : '✗ 오답입니다'}
      </p>
      {(explanation || expImageUrl) && (
        <div className="text-slate-300 text-sm leading-relaxed mt-2">
          {explanation && <p>{explanation}</p>}
          {expImageUrl && <QuestionImage src={expImageUrl} alt="해설 이미지" />}
        </div>
      )}
    </div>
  )
})
