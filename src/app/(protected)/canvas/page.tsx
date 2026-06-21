'use client'

import { Canvas } from '@/components/canvas/Canvas'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'

export default function CanvasPage() {
  return (
    <div className="fixed inset-0 z-0">
      <AnimatedBackground density={15} className="opacity-30" />
      <Canvas />
    </div>
  )
}
