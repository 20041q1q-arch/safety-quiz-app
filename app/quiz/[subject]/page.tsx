'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadQuestions, filterBySubject } from '@/lib/questions'
import { selectWeightedQuestions } from '@/lib/algorithms/randomize'
import { useQuizStore } from '@/store/quizStore'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { QuizHeader } from '@/components/quiz/QuizHeader'
import { OptionButton } from '@/components/quiz/OptionButton'
import { FeedbackPanel } from '@/components/quiz/FeedbackPanel'
import QuestionImage from '@/components/image/QuestionImage'
import Modal from '@/components/ui/Modal'
import type { Question } from '@/types'

const QUIZ_COUNT = 60

export default function QuizSubjectPage() {
  const params = useParams()
  const router = useRouter()
  const subject = decodeURIComponent(params.subject as string)

  const quiz = useQuizStore()
  const { load: loadProgress, progressMap, updateProgress } = useProgressStore()
  const settings = useSettingsStore()

  const [exitModal, setExitModal] = useState(false)
  const [done, setDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 문제 초기화
  useEffect(() => {
    async function init() {
      const [qs] = await Promise.all([loadQuestions(), loadProgress()])
      let pool = subject === '전체' ? qs : filterBySubject(qs, subject)
      const selected = selectWeightedQuestions(pool, QUIZ_COUNT, progressMap)
      quiz.initQuiz(selected, 'subject', subject === '전체' ? undefined : subject)
    }
    init()
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
      quiz.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  const currentQ = quiz.questions[quiz.currentIndex] ?? null
  const chosen = currentQ ? quiz.answers[currentQ.id] ?? null : null
  const isCorrect = currentQ ? chosen === currentQ.answer : false
  const isFinished = quiz.currentIndex >= quiz.questions.length && quiz.questions.length > 0

  // 정답 선택 처리
  const handleSelect = useCallback(
    (index: number) => {
      if (!currentQ || quiz.feedbackVisible) return
      const timeMs = Date.now() - quiz.questionStartAt
      quiz.submitAnswer(currentQ.id, index)
      const correct = index === currentQ.answer

      updateProgress(currentQ.id, correct, timeMs)
      if (correct) setCorrectCount((c) => c + 1)

      // 진동 피드백
      if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(correct ? 30 : [30, 50, 30])
      }

      // 자동 다음 문제
      if (settings.autoNext && correct) {
        autoTimer.current = setTimeout(() => {
          quiz.nextQuestion()
        }, settings.autoNextDelaySec * 1000)
      }
    },
    [currentQ, quiz, updateProgress, settings],
  )

  // 키보드 단축키 (1~4 + Enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        handleSelect(Number(e.key))
      }
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (quiz.feedbackVisible) {
          if (autoTimer.current) clearTimeout(autoTimer.current)
          quiz.nextQuestion()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSelect, quiz])

  const handleNext = () => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    quiz.nextQuestion()
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">문제 로딩 중...</div>
      </div>
    )
  }

  // 완료 화면
  if (isFinished) {
    const total = quiz.questions.length
    const accuracy = Math.round((correctCount / total) * 100)

    return (
      <div className="flex-1 flex flex-col p-5 gap-5">
        <div className="text-center pt-8">
          <div className="text-5xl mb-3">{accuracy >= 70 ? '🎉' : accuracy >= 50 ? '📈' : '💪'}</div>
          <h2 className="text-white text-2xl font-bold">{accuracy}%</h2>
          <p className="text-slate-400 text-sm mt-1">{correctCount}/{total} 정답</p>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-4 text-center border border-slate-700/50">
          <p className="text-slate-300 text-sm">
            {accuracy >= 80 ? '훌륭합니다! 계속 유지하세요.' :
             accuracy >= 60 ? '좋아요! 조금만 더 반복하면 완벽합니다.' :
             '아직 취약한 문제가 많습니다. 오답노트를 확인하세요.'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              quiz.reset()
              router.replace(`/quiz/${encodeURIComponent(subject)}`)
            }}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base active:bg-blue-700"
          >
            다시 풀기
          </button>
          <button
            onClick={() => router.push('/wrong-notes')}
            className="w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-medium active:bg-slate-700 border border-slate-700"
          >
            오답노트 보기
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 text-slate-500 text-sm active:text-slate-300"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  if (!currentQ) return null

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4">
        <QuizHeader
          subject={subject === '전체' ? null : subject}
          current={quiz.currentIndex + 1}
          total={quiz.questions.length}
          onExit={() => setExitModal(true)}
          correctCount={correctCount}
        />
      </div>

      <div className="flex-1 flex flex-col px-4 pb-6 gap-3 overflow-y-auto no-scrollbar slide-in">
        {/* 문제 번호 + 텍스트 */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
          <p className="text-slate-400 text-xs mb-2">Q{quiz.currentIndex + 1}</p>
          <p className="text-white text-base leading-relaxed">{currentQ.question}</p>
          {currentQ.image_url && (
            <QuestionImage src={currentQ.image_url} alt="문제 이미지" />
          )}
        </div>

        {/* 선택지 */}
        <div className="flex flex-col gap-2">
          {currentQ.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i + 1}
              text={opt}
              chosen={chosen}
              correct={currentQ.answer}
              revealed={quiz.feedbackVisible}
              disabled={quiz.feedbackVisible}
              onClick={handleSelect}
            />
          ))}
        </div>

        {/* 피드백 */}
        {quiz.feedbackVisible && (
          <FeedbackPanel
            correct={isCorrect}
            explanation={currentQ.explanation}
            expImageUrl={currentQ.exp_image_url}
          />
        )}

        {/* 다음 버튼 */}
        {quiz.feedbackVisible && (
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-slate-700 text-white font-semibold active:bg-slate-600 mt-1"
          >
            다음 문제 →
          </button>
        )}
      </div>

      <Modal
        open={exitModal}
        title="풀이를 종료할까요?"
        message="지금까지의 학습 기록은 저장됩니다."
        confirmLabel="종료"
        cancelLabel="계속 풀기"
        onConfirm={() => router.push('/')}
        onCancel={() => setExitModal(false)}
        danger
      />
    </div>
  )
}
