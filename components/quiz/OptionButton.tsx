'use client'

import { memo } from 'react'

interface OptionButtonProps {
  index: number          // 1-based
  text: string
  chosen: number | null  // 사용자가 선택한 번호 (1-based) or null
  correct: number        // 정답 번호 (1-based)
  revealed: boolean      // 채점 결과 공개 여부
  disabled: boolean
  onClick: (index: number) => void
}

const LABELS = ['①', '②', '③', '④']

export const OptionButton = memo(function OptionButton({
  index, text, chosen, correct, revealed, disabled, onClick,
}: OptionButtonProps) {
  let style =
    'w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors option-btn'

  if (!revealed) {
    // 채점 전
    if (chosen === index) {
      style += ' bg-blue-600/30 border-blue-500 text-white'
    } else {
      style += ' bg-slate-800/80 border-slate-700 text-slate-200 active:bg-slate-700'
    }
  } else {
    // 채점 후
    if (index === correct) {
      style += ' bg-green-900/40 border-green-500 text-green-200'
    } else if (chosen === index && chosen !== correct) {
      style += ' bg-red-900/40 border-red-500 text-red-200'
    } else {
      style += ' bg-slate-800/40 border-slate-700/50 text-slate-400'
    }
  }

  return (
    <button
      className={style}
      onClick={() => !disabled && onClick(index)}
      disabled={disabled}
      type="button"
    >
      <span className="shrink-0 font-bold text-sm mt-0.5 w-5 text-center">
        {LABELS[index - 1]}
      </span>
      <span className="flex-1 text-sm leading-relaxed">{text}</span>
      {revealed && index === correct && (
        <span className="shrink-0 text-green-400 text-base">✓</span>
      )}
      {revealed && chosen === index && chosen !== correct && (
        <span className="shrink-0 text-red-400 text-base">✗</span>
      )}
    </button>
  )
})
