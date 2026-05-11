'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface ImageZoomModalProps {
  open: boolean
  src: string
  alt: string
  onClose: () => void
}

export default function ImageZoomModal({ open, src, alt, onClose }: ImageZoomModalProps) {
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/80 text-3xl leading-none z-10"
        onClick={onClose}
        aria-label="닫기"
      >
        ×
      </button>
      <div
        ref={imgRef}
        className="w-full max-w-screen-sm px-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-x pan-y pinch-zoom', maxHeight: '90dvh' }}
      >
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className="w-full h-auto rounded-lg"
          quality={95}
          priority
        />
      </div>
      <p className="absolute bottom-4 text-white/40 text-xs">핀치 줌 가능 · 탭하여 닫기</p>
    </div>
  )
}
