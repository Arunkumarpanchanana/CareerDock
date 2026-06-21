'use client'

import { Plus, ZoomIn, ZoomOut, Maximize2, Download, Trash2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface CanvasToolbarProps {
  onAddModule: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onExport: () => void
  onClear: () => void
}

export function CanvasToolbar({ onAddModule, onZoomIn, onZoomOut, onFitView, onExport, onClear }: CanvasToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
      <GlassPanel className="!p-2">
        <div className="flex items-center gap-1">
          <button onClick={onAddModule} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Add Module">
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-[var(--glass-border)]" />
          <button onClick={onZoomIn} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={onZoomOut} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={onFitView} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Fit to View">
            <Maximize2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-[var(--glass-border)]" />
          <button onClick={onExport} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all" title="Export">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onClear} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all" title="Clear">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}
