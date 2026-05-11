'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UploadResult } from '@/types'

export default function AdminUploadPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const parsed = JSON.parse(text)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '업로드 실패')
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setText(content)
  }

  const sampleJson = JSON.stringify([
    {
      subject: '설비보전',
      year: 2024,
      round: 1,
      question: '문제 텍스트를 여기에 입력하세요.',
      options: ['선택지1', '선택지2', '선택지3', '선택지4'],
      answer: 1,
      explanation: '해설을 여기에 입력하세요.',
    },
  ], null, 2)

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 pb-8">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 홈</Link>
        <h2 className="text-white font-semibold text-lg">관리자 · 문제 업로드</h2>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
        <p className="text-amber-300 text-xs font-semibold">JSON 형식으로 문제를 업로드하세요</p>
        <p className="text-amber-400/70 text-xs mt-1">
          필수: subject, question, options(4개 배열), answer(1~4)<br />
          선택: year, round, explanation, image_url, tags, difficulty(1~3)
        </p>
      </div>

      {/* 파일 업로드 */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/40 p-3">
        <label className="block text-slate-300 text-sm mb-2 font-medium">JSON 파일 선택</label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="text-slate-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-300 file:text-sm"
        />
      </div>

      {/* JSON 직접 입력 */}
      <div className="flex flex-col gap-2">
        <label className="text-slate-300 text-sm font-medium">또는 JSON 직접 입력</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={sampleJson}
          className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-300 text-xs font-mono resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
          <p className="text-green-300 text-sm font-semibold">업로드 완료</p>
          <div className="mt-2 text-sm space-y-1">
            <p className="text-slate-300">✓ 추가됨: <span className="text-green-400 font-bold">{result.inserted}개</span></p>
            <p className="text-slate-300">중복 제외: <span className="text-yellow-400">{result.duplicates}개</span></p>
            {result.errors.length > 0 && (
              <div>
                <p className="text-red-400">오류 {result.errors.length}건:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-red-400 text-xs ml-2">{e}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!text.trim() || loading}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold disabled:opacity-40 active:bg-blue-700"
      >
        {loading ? '업로드 중...' : '업로드하기'}
      </button>

      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
        <p className="text-slate-400 text-xs font-semibold mb-2">JSON 형식 예시</p>
        <pre className="text-slate-500 text-xs overflow-x-auto no-scrollbar">{sampleJson}</pre>
      </div>
    </div>
  )
}
