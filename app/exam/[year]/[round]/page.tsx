'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadQuestions, filterByYearRound } from '@/lib/questions'
import { useExamStore } from '@/store/examStore'
import { ExamTimer } from '@/components/exam/ExamTimer'
import { ExamNav } from '@/components/exam/ExamNav'
import QuestionImage from '@/components/image/QuestionImage'
import Modal from '@/components/ui/Modal'

const DURATION_SEC = 150 * 60  // 150분

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const year = Number(params.year)
  const round = Number(params.round)

  const exam = useExamStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [exitModal, setExitModal] = useState(false)
  const [submitModal, setSubmitModal] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    loadQuestions().then((qs) => {
      const pool = filterByYearRound(qs, year, round)
      exam.startExam(pool, {
        type: 'year',
        year,
        round,
        label: `${year}년 ${round}회`,
        durationSec: DURATION_SEC,
      })
    })

    timerRef.current = setInterval(() => {
      useExamStore.getState().tick()
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      exam.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, round])

  // 시험 제출 후 결과 페이지 이동
  useEffect(() => {
    if (exam.isSubmitted && exam.result) {
      if (timerRef.current) clearInterval(timerRef.current)
      router.replace(`/exam/${year}/${round}/result`)
    }
  }, [exam.isSubmitted, exam.result, year, round, router])

  const handleSubmit = useCallback(() => {
    exam.submitExam()
  }, [exam])

  const currentQ = exam.questions[exam.currentIndex]
  const chosen = currentQ ? exam.answers[currentQ.id] ?? null : null
  const answeredCount = Object.keys(exam.answers).length
  const unanswered = exam.questions.length - answeredCount

  if (exam.questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm">문제 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-[#0f1117]/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setExitModal(true)}
            className="text-slate-400 text-sm active:text-white px-1"
          >
            ✕
          </button>
          <span className="text-white font-semibold text-sm">{year}년 {round}회</span>
          <span className="text-slate-500 text-xs ml-1">
            {exam.currentIndex + 1}/{exam.questions.length}
          </span>
          <div className="flex-1" />
          <ExamTimer timeLeft={exam.timeLeft} />
          <button
            onClick={() => setNavOpen(true)}
            className="ml-2 text-slate-400 text-xs bg-slate-800 px-2.5 py-1.5 rounded-lg active:bg-slate-700"
          >
            답안지
          </button>
        </div>
        {/* 답변 현황 바 */}
        <div className="flex px-4 pb-2 gap-1 text-xs text-slate-500">
          <span className="text-slate-300">{answeredCount}개 답변</span>
          {unanswered > 0 && (
            <span className="text-amber-400"> · 미답변 {unanswered}개</span>
          )}
        </div>
      </div>

      {/* 문제 영역 */}
      {currentQ && (
        <div className="flex-1 flex flex-col px-4 py-3 gap-3 overflow-y-auto no-scrollbar">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40">
            <p className="text-slate-400 text-xs mb-1">문제 {exam.currentIndex + 1}</p>
            <p className="text-white text-base leading-relaxed">{currentQ.question}</p>
            {currentQ.image_url && (
              <QuestionImage src={currentQ.image_url} alt="문제 이미지" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            {currentQ.options.map((opt, i) => {
              const idx = i + 1
              const isSelected = chosen === idx
              return (
                <button
                  key={i}
                  onClick={() => exam.selectAnswer(currentQ.id, idx)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors option-btn ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 text-white'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200 active:bg-slate-700'
                  }`}
                >
                  <span className="shrink-0 font-bold text-sm mt-0.5 w-5 text-center text-blue-400">
                    {['①', '②', '③', '④'][i]}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed">{opt}</span>
                  {isSelected && <span className="shrink-0 text-blue-400">●</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 bg-[#0f1117]/95 border-t border-slate-800 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => exam.goToQuestion(exam.currentIndex - 1)}
            disabled={exam.currentIndex === 0}
            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium disabled:opacity-30 active:bg-slate-700 text-sm"
          >
            ← 이전
          </button>
          {exam.currentIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => exam.goToQuestion(exam.currentIndex + 1)}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium active:bg-slate-700 text-sm"
            >
              다음 →
            </button>
          ) : (
            <button
              onClick={() => setSubmitModal(true)}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold active:bg-blue-700 text-sm"
            >
              채점하기
            </button>
          )}
        </div>
      </div>

      {/* 답안지 Bottom Sheet */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNavOpen(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-slate-800 rounded-t-2xl border-t border-slate-700">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-white font-semibold">답안지</h3>
              <button onClick={() => setNavOpen(false)} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <ExamNav
              total={exam.questions.length}
              currentIndex={exam.currentIndex}
              answers={exam.answers}
              questionIds={exam.questions.map((q) => q.id)}
              onGoto={(i) => { exam.goToQuestion(i); setNavOpen(false) }}
            />
            <div className="px-4 pb-4">
              <button
                onClick={() => { setNavOpen(false); setSubmitModal(true) }}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold active:bg-blue-700"
              >
                채점하기
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={exitModal}
        title="시험을 종료할까요?"
        message="저장 없이 나가집니다."
        confirmLabel="종료"
        cancelLabel="계속 풀기"
        onConfirm={() => router.push('/exam')}
        onCancel={() => setExitModal(false)}
        danger
      />

      <Modal
        open={submitModal}
        title="채점하시겠습니까?"
        message={unanswered > 0 ? `미답변 ${unanswered}문제가 있습니다.` : '모든 문제에 답했습니다.'}
        confirmLabel="채점하기"
        cancelLabel="계속 풀기"
        onConfirm={handleSubmit}
        onCancel={() => setSubmitModal(false)}
      />
    </div>
  )
}
