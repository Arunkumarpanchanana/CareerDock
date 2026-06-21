'use client'

import { GripVertical, Minus, X } from 'lucide-react'
import { useCallback, useRef, type ReactNode } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface CanvasModuleProps {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  onMove: (id: string, x: number, y: number) => void
  onMinimize: (id: string) => void
  onRemove: (id: string) => void
  children?: ReactNode
}

export function CanvasModule({ id, title, x, y, width, height, minimized, onMove, onMinimize, onRemove, children }: CanvasModuleProps) {
  const dragRef = useRef({ startX: 0, startY: 0, modX: 0, modY: 0, dragging: false })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget.parentElement
    if (!el) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, modX: x, modY: y, dragging: true }

    function handleMouseMove(ev: MouseEvent) {
      if (!dragRef.current.dragging) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      onMove(id, dragRef.current.modX + dx, dragRef.current.modY + dy)
    }

    function handleMouseUp() {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [id, x, y, onMove])

  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width: minimized ? 320 : width, zIndex: 10 }}
    >
      <GlassPanel className={minimized ? '!p-3' : ''}>
        <div className="flex items-center justify-between gap-2 mb-2 cursor-move" onMouseDown={handleMouseDown}>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onMinimize(id)} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onRemove(id)} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {!minimized && <div>{children}</div>}
      </GlassPanel>
    </div>
  )
}
