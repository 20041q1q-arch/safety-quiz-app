'use client'

import { useState } from 'react'
import Image from 'next/image'
import ImageZoomModal from './ImageZoomModal'

interface QuestionImageProps {
  src: string
  alt?: string
}

export default function QuestionImage({ src, alt = '문제 이미지' }: QuestionImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)

  return (
    <>
      <div
        className="relative w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-700 cursor-zoom-in my-3"
        onClick={() => setZoomOpen(true)}
        style={{ minHeight: 120 }}
      >
        {/* 스켈레톤 */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-700 rounded-xl" />
        )}
        <Image
          src={src}
          alt={alt}
          width={640}
          height={400}
          className={`w-full h-auto object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          priority={false}
        />
        <div className="absolute bottom-1 right-1 bg-black/50 rounded-md px-1.5 py-0.5 text-xs text-white/70">
          탭하여 확대
        </div>
      </div>

      <ImageZoomModal
        open={zoomOpen}
        src={src}
        alt={alt}
        onClose={() => setZoomOpen(false)}
      />
    </>
  )
}
