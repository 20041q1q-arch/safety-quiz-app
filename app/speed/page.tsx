'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadQuestions, filterBySubject, getSubjects } from '@/lib/questions'
import { selectWeightedQuestions, fisherYatesShuffle } from '@/lib/algorithms/randomize'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { OptionButton } from '@/components/quiz/OptionButton'
import QuestionImage from '@/components/image/QuestionImage'
import type { Question } from '@/types'
import { Suspense } from 'react'

function SpeedModeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') // 'wrong-only' | null

  const { load: loadProgress, progressMap, updateProgress, getWrongQuestions } = useProgressStore()
  const settings = useSettingsStore()

  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [stats, setStats] = useState({ total: 0, correct: 0 })
  const [setupMode, setSetupMode] = useState(true)
  const [subject, setSubject] = useState('전체')
  const [subjects, setSubjects] = useState<string[]>([])
  const [allQs, setAllQs] = useState<Question[]>([])
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const questionStart = useRef(Date.now())

  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])
      setAllQs(qs)
      setSubjects(['전체', ...getSubjects(qs)])
    }
    init()
  }, [loadProgress])

  const startSession = useCallback(() => {
    let pool = subject === '전체' ? allQs : filterBySubject(allQs, subject)
    if (filterParam === 'wrong-only') {
      pool = getWrongQuestions(pool)
    }
    const selected = selectWeightedQuestions(pool, 60, progressMap)
    setQuestions(selected)
    setIndex(0)
    setChosen(null)
    setRevealed(false)
    setStats({ total: 0, correct: 0 })
    setSetupMode(false)
    questionStart.current = Date.now()
  }, [subject, allQs, filterParam, getWrongQuestions, progressMap])

  const handleSelect = useCallback((idx: number) => {
    if (revealed || !questions[index]) return
    const q = questions[index]
    const isCorrect = idx === q.answer
    const timeMs = Date.now() - questionStart.current

    setChosen(idx)
    setRevealed(true)
    setCorrect(isCorrect)
    setStats((s) => ({ total: s.total + 1, correct: s.correct + (isCorrect ? 1 : 0) }))
    updateProgress(q.id, isCorrect, timeMs)

    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(isCorrect ? 20 : [20, 40, 20])
    }

    // 자동 다음 (초고속)
    autoTimer.current = setTimeout(() => {
      nextQ()
    }, settings.speedModeAutoSec * 1000)
  }, [revealed, questions, index, updateProgress, settings])

  const nextQ = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    setIndex((i) => i + 1)
    setChosen(null)
    setRevealed(false)
    questionStart.current = Date.now()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) handleSelect(Number(e.key))
      if (e.key === 'Enter' || e.key === 'ArrowRight') nextQ()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSelect, nextQ])

  // 완료
  if (!setupMode && index >= questions.length && questions.length > 0) {
    const acc = Math.round((stats.correct / stats.total) * 100)
    return (
      <div className="flex-1 flex flex-col p-5 gap-5 items-center justify-center text-center">
        <div className="text-5xl">{acc >= 70 ? '⚡' : '💪'}</div>
        <div>
          <p className="text-white text-3xl font-bold">{acc}%</p>
          <p className="text-slate-400 text-sm mt-1">{stats.correct}/{stats.total} 정답</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={startSession} className="w-full py-4 rounded-2xl bg-amber-600 text-white font-semibold active:bg-amber-700">
            다시 돌리기
          </button>
          <button onClick={() => router.push('/')} className="w-full py-3 text-slate-500 text-sm">
            홈으로
          </button>
        </div>
      </div>
    )
  }

  // 설정 화면
  if (setupMode) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => router.back()} className="text-slate-400 text-sm">← 뒤로</button>
          <h2 className="text-white font-semibold text-lg">⚡ 초고속 암기 모드</h2>
        </div>
        <p className="text-slate-400 text-xs">선택 즉시 채점 · {settings.speedModeAutoSec}초 후 자동 이동 · 60문제</p>

        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
          <p className="text-slate-300 text-sm font-medium mb-2">과목 선택</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                  subject === s ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 active:bg-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          className="w-full py-5 rounded-2xl bg-amber-600 text-white font-bold text-lg active:bg-amber-700 mt-auto"
        >
          ⚡ 시작하기
        </button>
      </div>
    )
  }

  const q = questions[index]
  if (!q) return null
  const progress = `${index + 1}/${questions.length}`
  const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : '-'

  return (
    <div className="flex-1 flex flex-col">
      {/* 미니 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <button onClick={() => router.back()} className="text-slate-500 text-sm">✕</button>
        <span className="text-slate-400 text-sm font-mono">{progress}</span>
        <span className="text-amber-400 text-sm font-semibold">{acc}%</span>
      </div>

      {/* 문제 */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-2.5 overflow-y-auto no-scrollbar slide-in">
        <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/40">
          <p className="text-white text-sm leading-relaxed">{q.question}</p>
          {q.image_url && <QuestionImage src={q.image_url} alt="문제 이미지" />}
        </div>

        <div className="flex flex-col gap-1.5">
          {q.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i + 1}
              text={opt}
              chosen={chosen}
              correct={q.answer}
              revealed={revealed}
              disabled={revealed}
              onClick={handleSelect}
            />
          ))}
        </div>

        {/* 해설 (최소화) */}
        {revealed && q.explanation && settings.showExplanation && (
          <div className={`rounded-xl px-3 py-2 text-xs border fade-in ${
            correct ? 'bg-green-900/20 border-green-700/30 text-green-300' : 'bg-red-900/20 border-red-700/30 text-red-300'
          }`}>
            {correct ? '✓ ' : '✗ '}{q.explanation}
          </div>
        )}
      </div>

      {/* 하단: 다음 버튼 */}
      {revealed && (
        <div className="px-4 py-3 border-t border-slate-800">
          <button
            onClick={nextQ}
            className="w-full py-3.5 rounded-xl bg-slate-700 text-white font-semibold active:bg-slate-600 text-sm"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  )
}

export default function SpeedPage() {
  return (
    <Suspense>
      <SpeedModeInner />
    </Suspense>
  )
}
