'use client'

import { useCallback, useState } from 'react'
import { CanvasModule } from './CanvasModule'
import { AgentManager } from './AgentManager'
import { CanvasToolbar } from './CanvasToolbar'
import { useCanvasState } from '@/hooks/useCanvasState'
import { useVibe } from '@/hooks/useVibe'
import type { CanvasModuleType } from '@/types/canvas'

const MODULE_TYPES: { type: CanvasModuleType; title: string }[] = [
  { type: 'resume', title: 'Resume Snapshot' },
  { type: 'job-search', title: 'Job Search' },
  { type: 'skill-insights', title: 'Skill Insights' },
  { type: 'interview-feedback', title: 'Interview Feedback' },
  { type: 'expert-sessions', title: 'Expert Sessions' },
]

export function Canvas() {
  const { state, addModule, updateModulePosition, toggleMinimize, removeModule, addPath, setActivePath, setZoom } = useCanvasState()
  const { vibe, setVibe, vibes } = useVibe()
  const [showPicker, setShowPicker] = useState(false)

  const handleAddModule = useCallback(() => {
    setShowPicker((prev) => !prev)
  }, [])

  const handlePickModule = useCallback((type: CanvasModuleType, title: string) => {
    addModule(type, title)
    setShowPicker(false)
  }, [addModule])

  const handleExport = useCallback(() => {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-state.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  return (
    <div className="flex h-screen">
      <div
        className="flex-1 relative overflow-hidden"
        style={{ transform: `scale(${state.viewport.zoom})`, transformOrigin: '0 0' }}
      >
        {/* Vibe Selector */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => setVibe(v.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-300 ${
                vibe === v.id
                  ? 'text-white shadow-lg'
                  : 'border-[var(--glass-border)] text-[var(--text-secondary)] bg-[var(--glass-bg)] backdrop-blur-sm hover:text-[var(--text-primary)]'
              }`}
              style={vibe === v.id ? { backgroundColor: v.color, borderColor: v.color } : undefined}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Modules */}
        {state.modules.map((mod) => (
          <CanvasModule
            key={mod.id}
            id={mod.id}
            title={mod.title}
            x={mod.position.x}
            y={mod.position.y}
            width={mod.size.width}
            height={mod.size.height}
            minimized={mod.minimized}
            onMove={updateModulePosition}
            onMinimize={toggleMinimize}
            onRemove={removeModule}
          >
            <div className="text-sm text-[var(--text-secondary)]">
              {mod.type === 'resume' && <p>Resume preview will render here</p>}
              {mod.type === 'job-search' && <p>Saved searches and listings</p>}
              {mod.type === 'skill-insights' && <p>Skill gap analysis results</p>}
              {mod.type === 'interview-feedback' && <p>Recent interview scores</p>}
              {mod.type === 'expert-sessions' && <p>Upcoming expert sessions</p>}
            </div>
          </CanvasModule>
        ))}

        {/* Module Picker */}
        {showPicker && (
          <div className="absolute top-12 left-4 z-20 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl shadow-xl p-3 space-y-1 min-w-48">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2 pb-1">Add Module</p>
            {MODULE_TYPES.map((mt) => (
              <button
                key={mt.type}
                onClick={() => handlePickModule(mt.type, mt.title)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
              >
                {mt.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <AgentManager
        paths={state.paths}
        activePathId={state.activePathId}
        onSelectPath={setActivePath}
        onAddPath={addPath}
      />

      <CanvasToolbar
        onAddModule={handleAddModule}
        onZoomIn={() => setZoom(state.viewport.zoom + 0.1)}
        onZoomOut={() => setZoom(state.viewport.zoom - 0.1)}
        onFitView={() => setZoom(1)}
        onExport={handleExport}
        onClear={() => {}}
      />
    </div>
  )
}
