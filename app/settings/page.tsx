'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSettingsStore } from '@/store/settingsStore'
import { useProgressStore } from '@/store/progressStore'
import Modal from '@/components/ui/Modal'

export default function SettingsPage() {
  const settings = useSettingsStore()
  const { reset: resetProgress } = useProgressStore()
  const [resetModal, setResetModal] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  function handleReset() {
    resetProgress()
    localStorage.clear()
    setResetModal(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 pb-8">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-slate-400 text-sm active:text-white">← 뒤로</Link>
        <h2 className="text-white font-semibold text-lg">설정</h2>
      </div>

      {/* 퀴즈 설정 */}
      <Section title="퀴즈 설정">
        <Toggle
          label="정답 후 자동 다음 문제"
          sub="정답 시 자동으로 다음으로 이동"
          value={settings.autoNext}
          onChange={(v) => settings.update({ autoNext: v })}
        />
        {settings.autoNext && (
          <SliderRow
            label={`자동 이동 대기 ${settings.autoNextDelaySec}초`}
            value={settings.autoNextDelaySec}
            min={0.5}
            max={3}
            step={0.5}
            onChange={(v) => settings.update({ autoNextDelaySec: v })}
          />
        )}
        <Toggle
          label="해설 즉시 표시"
          sub="오답 시 해설 바로 보기"
          value={settings.showExplanation}
          onChange={(v) => settings.update({ showExplanation: v })}
        />
      </Section>

      {/* 초고속 모드 */}
      <Section title="초고속 암기 모드">
        <SliderRow
          label={`자동 이동 ${settings.speedModeAutoSec}초`}
          value={settings.speedModeAutoSec}
          min={1}
          max={10}
          step={1}
          onChange={(v) => settings.update({ speedModeAutoSec: v })}
        />
      </Section>

      {/* 피드백 */}
      <Section title="피드백">
        <Toggle
          label="진동 피드백"
          sub="정답/오답 시 진동"
          value={settings.vibrationEnabled}
          onChange={(v) => settings.update({ vibrationEnabled: v })}
        />
        <Toggle
          label="효과음"
          sub="(준비 중)"
          value={settings.soundEnabled}
          onChange={(v) => settings.update({ soundEnabled: v })}
          disabled
        />
      </Section>

      {/* 글자 크기 */}
      <Section title="글자 크기">
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => settings.update({ fontSize: size })}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                settings.fontSize === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {size === 'sm' ? '작게' : size === 'md' ? '보통' : '크게'}
            </button>
          ))}
        </div>
      </Section>

      {/* 데이터 */}
      <Section title="데이터">
        {resetDone && (
          <p className="text-green-400 text-xs">학습 데이터가 초기화되었습니다.</p>
        )}
        <button
          onClick={() => setResetModal(true)}
          className="w-full py-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-400 text-sm font-medium active:bg-red-900/50"
        >
          학습 데이터 초기화
        </button>
      </Section>

      {/* 앱 정보 */}
      <div className="text-center text-slate-600 text-xs mt-2">
        <p>설비보전산업기사 필기 암기 앱</p>
        <p className="mt-0.5">v0.1.0</p>
      </div>

      <Modal
        open={resetModal}
        title="학습 데이터를 초기화할까요?"
        message="모든 풀이 이력, 오답노트, 복습 일정이 삭제됩니다."
        confirmLabel="초기화"
        cancelLabel="취소"
        onConfirm={handleReset}
        onCancel={() => setResetModal(false)}
        danger
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/40 flex flex-col gap-3">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Toggle({
  label, sub, value, onChange, disabled,
}: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-200'}`}>{label}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-slate-700'
        } ${disabled ? 'opacity-30' : ''}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  )
}

function SliderRow({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <p className="text-slate-300 text-sm mb-2">{label}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  )
}
