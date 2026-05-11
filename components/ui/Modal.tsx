'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function Modal({
  open, title, message, confirmLabel = '확인', cancelLabel = '취소',
  onConfirm, onCancel, danger = false,
}: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-5 fade-in">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {message && <p className="text-slate-400 text-sm mt-2">{message}</p>}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium active:bg-slate-600"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold active:opacity-80 ${
              danger ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
